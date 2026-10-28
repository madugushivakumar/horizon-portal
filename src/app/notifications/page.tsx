"use client";

/**
 * Horizon Portal — Notifications & Announcements Page
 * src/app/notifications/page.tsx
 *
 * Implements Phase 2 Day 8:
 * - Real-time personal inbox with unread count
 * - Mark as read with persistent SQLite state & optimistic UI
 * - Company announcements feed (distinguished from personal items)
 * - Protected shell integration with role badge and top bar
 */

import React, { useEffect, useState, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";

function NotificationsPageContent() {
  const [currentUser, setCurrentUser] = useState<TopBarUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        // AppShell handles fallback loading/redirect
      }
    }
    loadUser();
  }, []);

  return (
    <AppShell initialUser={currentUser}>
      <NotificationsInbox />
    </AppShell>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-semibold text-[var(--hz-text-muted)] animate-pulse">
          Loading Notifications Portal...
        </div>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}
