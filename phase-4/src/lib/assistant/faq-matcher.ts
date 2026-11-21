/**
 * HR Assistant — FAQ Matching Engine
 * src/lib/assistant/faq-matcher.ts
 *
 * Deterministic weighted scoring engine that queries the 30 active `HrFaq` records
 * from Prisma ORM and matches incoming user queries.
 *
 * Scoring model:
 * 1. Exact normalized question match: score = 1.0
 * 2. Tokenized keyword overlap (Jaccard & overlap coefficient): up to 0.7
 * 3. Exact category match bonus: +0.15
 * 4. Critical keyword alignment (e.g. "casual", "sick", "earned", "probation", "dress", "travel"): +0.25
 *
 * Threshold: 0.35 (scores below 0.35 fall back to polite unknown query handler)
 */

import { prisma } from "@/lib/prisma";
import { normalizeText, tokenize, extractKeywords, jaccardSimilarity } from "./nlp";

export interface MatchedFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  policySource: string;
  score: number;
}

export interface FaqMatchResult {
  matched: boolean;
  faq?: MatchedFaq;
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  competingFaqs?: MatchedFaq[];
}

export const FAQ_CONFIDENCE_THRESHOLD = 0.35;

/**
 * Cache FAQ records in memory for high-performance deterministic matching,
 * invalidating after 5 minutes if updated.
 */
let cachedFaqs: Array<{
  id: string;
  question: string;
  answer: string;
  category: string;
  policySource: string;
  normalizedQuestion: string;
  questionKeywords: string[];
}> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getAuthoritativeFaqs() {
  const now = Date.now();
  if (cachedFaqs && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedFaqs;
  }

  const raw = await prisma.hrFaq.findMany({
    orderBy: { id: "asc" },
  });

  cachedFaqs = raw.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    policySource: f.policySource,
    normalizedQuestion: normalizeText(f.question),
    questionKeywords: extractKeywords(f.question),
  }));
  lastCacheTime = now;

  return cachedFaqs;
}

/**
 * Match a user question against the 30 active HrFaq records.
 */
export async function matchFaq(userQuery: string): Promise<FaqMatchResult> {
  const normalizedUser = normalizeText(userQuery);
  const userTokens = tokenize(normalizedUser);
  const userKeywords = extractKeywords(normalizedUser);

  if (!normalizedUser || userTokens.length === 0) {
    return {
      matched: false,
      score: 0.0,
      confidence: "NONE",
    };
  }

  const faqs = await getAuthoritativeFaqs();

  // 1. Check exact question match
  for (const faq of faqs) {
    if (faq.normalizedQuestion === normalizedUser) {
      return {
        matched: true,
        score: 1.0,
        confidence: "HIGH",
        faq: {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          policySource: faq.policySource,
          score: 1.0,
        },
      };
    }
  }

  // 2. Score each FAQ item
  const scoredList: MatchedFaq[] = [];

  for (const faq of faqs) {
    let score = 0.0;

    // Substring containment of either question in user query or vice versa
    if (normalizedUser.includes(faq.normalizedQuestion) || faq.normalizedQuestion.includes(normalizedUser)) {
      score += 0.45;
    }

    // Jaccard similarity between extracted non-stopword keywords
    const keywordJaccard = jaccardSimilarity(userKeywords, faq.questionKeywords);
    score += keywordJaccard * 0.5;

    // Overlap count ratio (fraction of FAQ keywords present in user question)
    const faqKwSet = new Set(faq.questionKeywords);
    const matchedFaqKws = userKeywords.filter((k) => faqKwSet.has(k)).length;
    if (faq.questionKeywords.length > 0) {
      const recall = matchedFaqKws / faq.questionKeywords.length;
      score += recall * 0.4;
    }

    // Category match bonus if user mentioned the category
    const normCategory = normalizeText(faq.category);
    if (userKeywords.includes(normCategory) || userTokens.includes(normCategory)) {
      score += 0.15;
    }

    // Keyword specific boosts
    if (userKeywords.includes("casual") && faq.id === "FAQ-01") score += 0.35;
    if (userKeywords.includes("sick") && faq.id === "FAQ-02") score += 0.35;
    if (userKeywords.includes("earned") && faq.id === "FAQ-03") score += 0.35;
    if (userKeywords.includes("without") && userKeywords.includes("pay") && faq.id === "FAQ-04") score += 0.35;
    if (userKeywords.includes("maternity") && faq.id === "FAQ-05") score += 0.4;
    if (userKeywords.includes("hours") && faq.id === "FAQ-06") score += 0.35;
    if (userKeywords.includes("saturdays") && faq.id === "FAQ-07") score += 0.4;
    if (userKeywords.includes("overtime") && faq.id === "FAQ-08") score += 0.4;
    if (userKeywords.includes("bonus") && faq.id === "FAQ-11") score += 0.4;
    if (userKeywords.includes("pf") && faq.id === "FAQ-13") score += 0.4;
    if (userKeywords.includes("esi") && faq.id === "FAQ-14") score += 0.4;
    if (userKeywords.includes("tds") && faq.id === "FAQ-16") score += 0.4;
    if (userKeywords.includes("16") && faq.id === "FAQ-17") score += 0.4;
    if (userKeywords.includes("notice") && faq.id === "FAQ-18") score += 0.35;
    if (userKeywords.includes("probation") && faq.id === "FAQ-20") score += 0.4;
    if (userKeywords.includes("wfh") && faq.id === "FAQ-21") score += 0.4;
    if (userKeywords.includes("travel") && faq.id === "FAQ-22") score += 0.4;
    if (userKeywords.includes("insurance") && faq.id === "FAQ-24") score += 0.35;
    if (userKeywords.includes("bank") && faq.id === "FAQ-27") score += 0.4;
    if (userKeywords.includes("dress") && faq.id === "FAQ-29") score += 0.4;
    if (userKeywords.includes("holidays") && faq.id === "FAQ-30") score += 0.35;

    // Normalize final score to max 1.0
    const finalScore = Math.min(1.0, Math.round(score * 100) / 100);

    if (finalScore >= FAQ_CONFIDENCE_THRESHOLD) {
      scoredList.push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        policySource: faq.policySource,
        score: finalScore,
      });
    }
  }

  // Sort descending by score
  scoredList.sort((a, b) => b.score - a.score);

  if (scoredList.length === 0) {
    return {
      matched: false,
      score: 0.0,
      confidence: "NONE",
    };
  }

  const topMatch = scoredList[0];
  const confidence = topMatch.score >= 0.7 ? "HIGH" : topMatch.score >= 0.45 ? "MEDIUM" : "LOW";

  // Check if there are close competing FAQs
  const competingFaqs = scoredList.slice(1, 3).filter((item) => topMatch.score - item.score < 0.1);

  return {
    matched: true,
    score: topMatch.score,
    confidence,
    faq: topMatch,
    competingFaqs: competingFaqs.length > 0 ? competingFaqs : undefined,
  };
}

