"use client";

/**
 * HR Assistant — Chat Panel Interface
 * src/components/assistant/HRAssistantPanel.tsx
 *
 * Full-featured conversational dialog for the HR assistant:
 * - Deterministic intent & FAQ responses with category and policy sources
 * - Personal authenticated leave and payslip queries
 * - Strict salary privacy refusals highlighted with security badges
 * - Keyboard accessible (Escape closes, Enter sends)
 * - Auto-scroll, loading states, error recovery, and conversation reset
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  BotIcon,
  UserIcon,
  XIcon,
  SendIcon,
  RotateCcwIcon,
  SparklesIcon,
  ShieldAlertIcon,
  BookOpenIcon,
  AlertCircleIcon,
} from "./icons";
import SuggestedQuestionChips from "./SuggestedQuestionChips";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  category?: string;
  policySource?: string | null;
  isRefusal?: boolean;
  suggestedQuestions?: string[];
  timestamp: string;
}

export interface HRAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

let messageSequence = 0;
function nextId(prefix: string): string {
  messageSequence += 1;
  return `${prefix}-${messageSequence}`;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "msg-welcome-0",
  sender: "assistant",
  text: "Hello! I am the Zenith Nova HR assistant. Ask me about leave balances, payslips, attendance, or company policies.",
  category: "General",
  policySource: "Zenith Nova HR Policy Handbook v3.2",
  timestamp: "Just now",
};

export const HRAssistantPanel: React.FC<HRAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Submit message to Chat API
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? inputValue;
    const trimmed = rawText.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setErrorMessage(null);
    setInputValue("");

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const userMessage: ChatMessage = {
      id: nextId("usr"),
      sender: "user",
      text: trimmed,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/hr-assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage("Your session has expired. Please log in again.");
        } else {
          setErrorMessage(data.error || "Unable to retrieve response from assistant.");
        }
        return;
      }

      const assistantMessage: ChatMessage = {
        id: nextId("asst"),
        sender: "assistant",
        text: data.answer || "No response received.",
        category: data.category || "General",
        policySource: data.policySource || null,
        isRefusal: Boolean(data.isRefusal),
        suggestedQuestions: data.suggestedQuestions || [],
        timestamp: timeStr,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setErrorMessage("Network error: Could not reach HR assistant service.");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClearConversation = () => {
    setMessages([
      {
        ...INITIAL_WELCOME_MESSAGE,
        id: nextId("msg-welcome"),
        timestamp: "Just now",
      },
    ]);
    setErrorMessage(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="HR Assistant Support Panel"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-w-lg h-[600px] max-h-[calc(100vh-7.5rem)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <header className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-700/80 ring-2 ring-indigo-400">
            <BotIcon className="w-5 h-5 text-white" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight leading-none">HR Assistant</h2>
            <p className="text-[11px] text-indigo-100/90 font-medium mt-0.5">Aura Workforce</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearConversation}
            title="Reset conversation"
            aria-label="Reset conversation"
            className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-indigo-700/70 transition-colors"
          >
            <RotateCcwIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close assistant"
            aria-label="Close assistant"
            className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-indigo-700/70 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                <BotIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs space-y-1.5 ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-br-xs"
                  : msg.isRefusal
                  ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-100 rounded-bl-xs"
                  : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs"
              }`}
            >
              {/* Refusal / Security Alert Badge */}
              {msg.isRefusal && (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-[11px] pb-0.5">
                  <ShieldAlertIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Salary Privacy Refusal</span>
                </div>
              )}

              {/* Message Content */}
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Metadata Badges: Category & Policy Source */}
              {msg.sender === "assistant" && (msg.category || msg.policySource) && (
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {msg.category && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 font-medium">
                      {msg.category}
                    </span>
                  )}
                  {msg.policySource && (
                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <BookOpenIcon className="w-3 h-3" />
                      <span className="truncate max-w-[200px]" title={msg.policySource}>
                        {msg.policySource}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Follow-up question chips from assistant */}
              {msg.sender === "assistant" && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1">
                  {msg.suggestedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 transition-colors text-left"
                    >
                      <SparklesIcon className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[220px]">{q}</span>
                    </button>
                  ))}
                </div>
              )}

              <div
                className={`text-[9px] text-right pt-0.5 ${
                  msg.sender === "user" ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-center justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
              <BotIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircleIcon className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Anchor for Auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Area (Pinned above input) */}
      <div className="px-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <SuggestedQuestionChips
          onSelectQuestion={(q) => handleSendMessage(q)}
          disabled={isLoading}
        />
      </div>

      {/* Input Footer */}
      <footer className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about leave, payslips, policies..."
            aria-label="Ask HR Assistant a question"
            disabled={isLoading}
            maxLength={500}
            className="flex-1 h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
            className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default HRAssistantPanel;
