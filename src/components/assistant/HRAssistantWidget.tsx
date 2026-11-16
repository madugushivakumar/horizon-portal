"use client";

/**
 * HR Assistant — Floating Trigger Button & Widget Root
 * src/components/assistant/HRAssistantWidget.tsx
 *
 * Mounts globally in `AppShell.tsx` to provide persistent, one-click access
 * to the HR Assistant across all authenticated pages.
 *
 * Features:
 * - Floating action button positioned at bottom-right (bottom-6 right-6)
 * - Accessible keyboard and screen-reader controls
 * - Unobtrusive layout with proper z-index elevation
 * - Animated panel toggle
 */

import React, { useState } from "react";
import { MessageSquareIcon, XIcon, SparklesIcon } from "./icons";
import HRAssistantPanel from "./HRAssistantPanel";

export const HRAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={isOpen ? "Close HR Assistant" : "Open HR Assistant"}
          title={isOpen ? "Close HR Assistant" : "Open HR Assistant"}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 ${
            isOpen
              ? "bg-slate-800 hover:bg-slate-900 text-white rotate-90"
              : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95"
          }`}
        >
          {isOpen ? (
            <XIcon className="w-6 h-6 transition-transform" />
          ) : (
            <>
              <MessageSquareIcon className="w-6 h-6" />
              {/* Pulsing indicator badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 items-center justify-center">
                  <SparklesIcon className="w-2 h-2 text-white" />
                </span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Chat Panel Dialog */}
      <HRAssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default HRAssistantWidget;
