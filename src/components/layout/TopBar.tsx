"use client";

/**
 * Horizon Portal — TopBar Component
 * src/components/layout/TopBar.tsx
 *
 * Implements the global top navigation bar:
 * - Mobile sidebar toggle button
 * - Breadcrumbs / current context display
 * - Theme toggle (light/dark mode)
 * - Authenticated user name, role badge, and initials avatar
 * - Logout button invoking POST /api/v1/auth/logout with loading state
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";

export interface TopBarUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  employeeId?: string | null;
  employee?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface TopBarProps {
  user?: TopBarUser | null;
  onMenuClick?: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  onMenuClick,
  menuButtonRef,
}) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;
        setUnreadCount(count);
      }
    } catch {
      // Ignore network errors during background update
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Listen to focus and visibility changes to refresh count
    const handleFocus = () => fetchUnreadCount();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };
    const handleCustomUpdate = () => fetchUnreadCount();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("horizon:notifications-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("horizon:notifications-updated", handleCustomUpdate);
    };
  }, [fetchUnreadCount]);

  // Derive display name with safe fallbacks
  const displayName =
    user?.name ||
    (user?.employee?.firstName && user?.employee?.lastName
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user?.email?.split("@")[0] || "Authenticated User");

  const role = user?.role || "Employee";

  // Initials for avatar
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "HZ";

  // Role badge variant mapping
  const badgeVariant =
    role === "Admin"
      ? "danger"
      : role === "HR"
      ? "warning"
      : role === "Manager"
      ? "primary"
      : "secondary";

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const res = await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Logout request failed. Please try again.");
      }

      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log out";
      setLogoutError(msg);
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            ref={menuButtonRef}
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: Actions, Theme, and Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications Bell */}
        <Link
          href="/notifications"
          id="topbar-notifications-bell"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications, 0 unread"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span
              id="topbar-unread-badge"
              className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--hz-primary-600)] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--hz-bg-surface)]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)] hover:bg-[var(--hz-bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--hz-primary-500)] transition-colors"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* User Identity & Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--hz-border-default)]">
          {/* Avatar with initials */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--hz-primary-600)] to-[var(--hz-secondary-500)] text-white text-xs font-bold shadow-sm"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* User Name & Role Badge (hidden on smallest screens) */}
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-[var(--hz-text-primary)]">
              {displayName}
            </span>
            <div className="mt-0.5">
              <Badge variant={badgeVariant} size="sm">
                {role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Sign out of Horizon Portal"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--hz-border-default)] px-3 py-1.5 text-xs font-medium text-[var(--hz-text-secondary)] hover:border-[var(--hz-danger-500)] hover:text-[var(--hz-danger-600)] hover:bg-[var(--hz-danger-50)] dark:hover:bg-[var(--hz-danger-950)]/50 focus-visible:outline-2 focus-visible:outline-[var(--hz-danger-500)] transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin text-[var(--hz-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Leaving...</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Logout Error if any */}
      {logoutError && (
        <div
          role="alert"
          className="absolute bottom-2 right-4 rounded-lg bg-[var(--hz-danger-50)] dark:bg-[var(--hz-danger-950)] border border-[var(--hz-danger-500)] px-3 py-1.5 text-xs text-[var(--hz-danger-700)] dark:text-[var(--hz-danger-300)] shadow-lg"
        >
          {logoutError}
        </div>
      )}
    </header>
  );
};

export default TopBar;
