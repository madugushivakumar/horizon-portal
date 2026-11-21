"use client";

/**
 * HR Assistant — Suggested Question Chips
 * src/components/assistant/SuggestedQuestionChips.tsx
 *
 * Categorized suggestion chips that help employees quickly discover
 * supported capabilities across 5 distinct domains:
 * - Leave (balances, policies, applying)
 * - Attendance (working hours, weekend rules)
 * - Payroll (latest payslips, pay date, PF)
 * - Employee Profile (reporting manager, department, banking)
 * - General HR (WFH policy, probation, contact)
 */

import React, { useState } from "react";
import {
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  UserCheckIcon,
  HelpCircleIcon,
  IconProps,
} from "./icons";

export interface SuggestedQuestionChipsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

type CategoryKey = "leave" | "attendance" | "payroll" | "profile" | "general";

interface CategoryData {
  label: string;
  icon: React.FC<IconProps>;
  questions: string[];
}

const CATEGORIES: Record<CategoryKey, CategoryData> = {
  leave: {
    label: "Leave",
    icon: CalendarIcon,
    questions: [
      "What is my leave balance?",
      "How many casual leaves do I get?",
      "How does earned leave work?",
      "What is the maternity leave policy?",
    ],
  },
  attendance: {
    label: "Attendance",
    icon: ClockIcon,
    questions: [
      "What are the office hours?",
      "Do we have to work on Saturdays?",
      "How are holidays decided?",
    ],
  },
  payroll: {
    label: "Payroll",
    icon: DollarSignIcon,
    questions: [
      "Where can I view my latest payslip?",
      "When is salary paid?",
      "How is PF calculated?",
      "When do I get Form 16?",
    ],
  },
  profile: {
    label: "Profile",
    icon: UserCheckIcon,
    questions: [
      "Who is my manager?",
      "What is my department?",
      "How do I update my bank details?",
    ],
  },
  general: {
    label: "General HR",
    icon: HelpCircleIcon,
    questions: [
      "What is the work from home policy?",
      "What is the probation period?",
      "Who do I contact for payroll queries?",
      "What insurance do I have?",
    ],
  },
};

export const SuggestedQuestionChips: React.FC<SuggestedQuestionChipsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("leave");

  return (
    <div className="space-y-2 py-2">
      {/* Category Pills Header */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Question categories">
        {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
          const cat = CATEGORIES[key];
          const Icon = cat.icon;
          const isActive = activeCategory === key;

          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              onClick={() => setActiveCategory(key)}
              disabled={disabled}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chips List */}
      <div
        id={`panel-${activeCategory}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeCategory}`}
        className="flex flex-wrap gap-1.5 pt-1"
      >
        {CATEGORIES[activeCategory].questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-700/80 transition-all text-left ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <SparklesIcon className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
            <span className="line-clamp-1">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestionChips;
