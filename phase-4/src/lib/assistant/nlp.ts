/**
 * HR Assistant — Deterministic NLP & Text Normalization Subsystem
 * src/lib/assistant/nlp.ts
 *
 * Implements deterministic text processing without ML, embeddings, or external services:
 * - Lowercase conversion & whitespace trimming
 * - Unicode-safe punctuation stripping
 * - Tokenization and deduplication
 * - Stopword filtering tailored for HR queries
 * - Jaccard / token similarity calculation
 */

/**
 * Standard English stopwords + generic filler words common in HR chat inputs.
 * Excludes critical domain words (e.g., 'leave', 'pay', 'bonus', 'salary', 'balance', 'who', 'when', 'my').
 */
export const HR_STOPWORDS = new Set<string>([
  "a", "about", "an", "and", "are", "as", "at", "be", "by", "can",
  "could", "did", "do", "does", "doing", "for", "from", "get", "got",
  "had", "has", "have", "how", "i", "if", "in", "into", "is", "it",
  "its", "me", "might", "much", "must", "of", "off", "on", "or",
  "our", "ours", "shall", "should", "so", "some", "such", "than",
  "that", "the", "their", "theirs", "them", "then", "there", "these",
  "they", "this", "those", "to", "too", "us", "very", "was", "we",
  "were", "what", "which", "while", "will", "with", "would", "you", "your"
]);

/**
 * Normalizes text: trims, lowercases, replaces multiple whitespaces and punctuation.
 */
export function normalizeText(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // replace punctuation with space (preserve hyphens)
    .replace(/\s+/g, " ")      // collapse whitespace
    .trim();
}

/**
 * Tokenizes normalized text into words, removing empty tokens.
 */
export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, "")) // trim hyphens at ends
    .filter((t) => t.length > 0);
}

/**
 * Extracts meaningful non-stopword tokens from an input string.
 * Retains single letters if they match critical abbreviations (e.g. 'cl', 'sl', 'el', 'pf').
 */
export function extractKeywords(input: string, customStopwords: Set<string> = HR_STOPWORDS): string[] {
  const tokens = tokenize(input);
  return tokens.filter((token) => {
    // Keep standard acronyms
    if (["cl", "sl", "el", "pf", "esi", "lop", "tds", "wfh", "hr"].includes(token)) {
      return true;
    }
    // Filter standard stopwords
    return !customStopwords.has(token) && token.length > 1;
  });
}

/**
 * Checks if normalized text contains any of the target phrases or keywords.
 */
export function containsAnyPhrase(text: string, phrases: string[]): boolean {
  const normalized = ` ${normalizeText(text)} `;
  return phrases.some((phrase) => {
    const normPhrase = ` ${normalizeText(phrase)} `;
    return normalized.includes(normPhrase);
  });
}

/**
 * Computes Jaccard similarity between two token sets.
 * Returns a value between 0.0 (no overlap) and 1.0 (identical sets).
 */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0.0;
  }

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0.0;
}

