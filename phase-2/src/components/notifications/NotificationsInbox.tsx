"use client";

/**
 * Horizon Portal — Notifications Inbox Component
 * src/components/notifications/NotificationsInbox.tsx
 *
 * Implements Phase 2 Day 8:
 * - Personal notification inbox with unread count
 * - Mark as read with persistent SQLite state & optimistic updates
 * - Visual distinction between read and unread items
 * - Separate company announcements feed from 03_Data_Pack/announcements.json
 * - Light and dark theme tokens, responsive layouts, accessible controls
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";

export interface PersonalNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanyAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  postedOn: string;
}

export const NotificationsInbox: React.FC = () => {
  const [notifications, setNotifications] = useState<PersonalNotification[]>([]);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Fetch notifications and announcements
  const fetchInboxData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);
    setActionError(null);

    try {
      const res = await fetch("/api/v1/notifications", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication session expired. Please sign in again.");
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to fetch notifications (Status ${res.status})`);
      }

      const json = await res.json();
      const notifs: PersonalNotification[] = json.notifications || json.data?.notifications || [];
      const announ: CompanyAnnouncement[] = json.announcements || json.data?.announcements || [];
      const count: number =
        typeof json.unreadCount === "number"
          ? json.unreadCount
          : notifs.filter((n) => !n.isRead).length;

      setNotifications(notifs);
      setAnnouncements(announ);
      setUnreadCount(count);

      // Notify TopBar to synchronize badge count
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("horizon:notifications-updated"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInboxData();
  }, [fetchInboxData]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    if (markingReadId) return; // Prevent duplicate concurrent clicks
    setMarkingReadId(id);
    setActionError(null);

    // Snapshot previous state for rollback on error
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to mark notification as read.");
      }

      const json = await res.json();
      if (typeof json.unreadCount === "number") {
        setUnreadCount(json.unreadCount);
      }

      // Notify global top-bar bell
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("horizon:notifications-updated"));
      }
    } catch (err: unknown) {
      // Rollback to previous state on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      const msg = err instanceof Error ? err.message : "Failed to update notification.";
      setActionError(msg);
    } finally {
      setMarkingReadId(null);
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (filter === "read") {
      return notifications.filter((n) => n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--hz-border-default)] pb-5">
          <div className="space-y-2">
            <Skeleton variant="text" width="12rem" height="1.75rem" />
            <Skeleton variant="text" width="20rem" height="1rem" />
          </div>
          <Skeleton variant="rectangular" width="6rem" height="2.25rem" className="rounded-xl" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="rectangular" height="5rem" className="rounded-2xl" />
            <Skeleton variant="rectangular" height="5rem" className="rounded-2xl" />
            <Skeleton variant="rectangular" height="5rem" className="rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton variant="rectangular" height="12rem" className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        title="Failed to Load Notifications"
        description={errorMessage}
        onRetry={() => fetchInboxData()}
      />
    );
  }

  return (
    <div className="space-y-8" id="notifications-inbox-container">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--hz-border-default)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
              Notifications
            </h1>
            {unreadCount > 0 ? (
              <Badge variant="primary" size="md">
                {unreadCount} Unread
              </Badge>
            ) : (
              <Badge variant="secondary" size="md">
                All caught up
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--hz-text-secondary)]">
            Personal updates, review requests, and company announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchInboxData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5"
            aria-label="Refresh notifications and announcements"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[var(--hz-primary-600)]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Error */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--hz-danger-500)] bg-[var(--hz-danger-50)] dark:bg-[var(--hz-danger-950)]/40 p-4 text-sm text-[var(--hz-danger-700)] dark:text-[var(--hz-danger-300)] shadow-sm flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Layout: Personal Inbox (Left) & Announcements (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Personal Notifications */}
        <section
          aria-labelledby="personal-notifications-heading"
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2
              id="personal-notifications-heading"
              className="text-lg font-semibold text-[var(--hz-text-primary)] tracking-tight flex items-center gap-2"
            >
              <span>Personal Inbox</span>
              <span className="text-xs font-normal text-[var(--hz-text-muted)]">
                ({notifications.length} total)
              </span>
            </h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--hz-bg-subtle)] border border-[var(--hz-border-default)]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === "all"
                    ? "bg-[var(--hz-bg-surface)] text-[var(--hz-text-primary)] shadow-xs"
                    : "text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-[var(--hz-bg-surface)] text-[var(--hz-text-primary)] shadow-xs"
                    : "text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("read")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === "read"
                    ? "bg-[var(--hz-bg-surface)] text-[var(--hz-text-primary)] shadow-xs"
                    : "text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]"
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
          </div>

          {/* List of Personal Notifications */}
          {filteredNotifications.length === 0 ? (
            filter === "unread" ? (
              <EmptyState
                title="All caught up!"
                description="You have zero unread notifications. New alerts will show up here as they occur."
              />
            ) : (
              <EmptyState
                title="No notifications"
                description="Your personal inbox is currently empty."
              />
            )
          ) : (
            <div className="space-y-3" role="feed" aria-label="Personal notifications list">
              {filteredNotifications.map((n) => {
                const isItemUnread = !n.isRead;
                const isMarking = markingReadId === n.id;

                return (
                  <article
                    key={n.id}
                    id={`notification-card-${n.id}`}
                    aria-label={`${isItemUnread ? "Unread" : "Read"} notification: ${n.title}`}
                    className={`relative rounded-2xl border transition-all p-5 ${
                      isItemUnread
                        ? "border-l-4 border-l-[var(--hz-primary-600)] border-[var(--hz-primary-200)] dark:border-[var(--hz-primary-800)] bg-[var(--hz-primary-50)]/30 dark:bg-[var(--hz-primary-950)]/20 shadow-xs"
                        : "border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3
                            className={`text-sm tracking-tight ${
                              isItemUnread
                                ? "font-bold text-[var(--hz-text-primary)]"
                                : "font-medium text-[var(--hz-text-secondary)]"
                            }`}
                          >
                            {n.title}
                          </h3>
                          {isItemUnread ? (
                            <Badge variant="primary" size="sm">
                              Unread
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">
                              Read
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-[var(--hz-text-primary)] leading-relaxed whitespace-pre-line">
                          {n.message}
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-[11px] text-[var(--hz-text-muted)]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <time dateTime={n.createdAt}>{formatDate(n.createdAt)}</time>
                        </div>
                      </div>

                      {/* Mark As Read Button for Unread Items */}
                      {isItemUnread && (
                        <div className="shrink-0 pt-1 sm:pt-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isMarking}
                            onClick={() => handleMarkAsRead(n.id)}
                            id={`mark-read-btn-${n.id}`}
                            aria-label={`Mark "${n.title}" as read`}
                            className="text-xs flex items-center gap-1.5 border-[var(--hz-primary-300)] dark:border-[var(--hz-primary-700)] text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)] hover:bg-[var(--hz-primary-100)] dark:hover:bg-[var(--hz-primary-900)]/40"
                          >
                            {isMarking ? (
                              <>
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Mark read</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Company Announcements (Separated Feed) */}
        <aside
          aria-labelledby="company-announcements-heading"
          className="space-y-4"
        >
          <div className="flex items-center justify-between pb-1">
            <h2
              id="company-announcements-heading"
              className="text-lg font-semibold text-[var(--hz-text-primary)] tracking-tight flex items-center gap-2"
            >
              <svg className="h-5 w-5 text-[var(--hz-secondary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span>Company Announcements</span>
            </h2>
            <Badge variant="secondary" size="sm">
              All Portal Users
            </Badge>
          </div>

          <p className="text-xs text-[var(--hz-text-muted)] -mt-2">
            Broadcast updates from Growmar leadership and HR. Shared across the company.
          </p>

          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements"
              description="There are currently no company announcements posted."
            />
          ) : (
            <div className="space-y-3" role="feed" aria-label="Company announcements list">
              {announcements.map((a) => (
                <article
                  key={a.id}
                  id={`announcement-card-${a.id}`}
                  className="rounded-2xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-5 space-y-2.5 transition-shadow hover:shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)]">
                      {a.category}
                    </span>
                    <time
                      dateTime={a.postedOn}
                      className="text-[11px] text-[var(--hz-text-muted)] font-mono"
                    >
                      {a.postedOn}
                    </time>
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--hz-text-primary)] leading-snug">
                    {a.title}
                  </h3>

                  <p className="text-xs text-[var(--hz-text-secondary)] leading-relaxed">
                    {a.body}
                  </p>

                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[var(--hz-text-muted)] border-t border-[var(--hz-border-default)]/60">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--hz-success-500)]" />
                    <span>Company-wide announcement</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default NotificationsInbox;
