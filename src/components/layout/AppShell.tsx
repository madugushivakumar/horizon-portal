"use client";

/**
 * Horizon Portal — AppShell Component
 * src/components/layout/AppShell.tsx
 *
 * The core responsive authenticated application layout container:
 * - Persistent desktop sidebar (w-64) with smooth transition
 * - Responsive modal mobile navigation drawer
 * - Sticky TopBar with breadcrumbs, role badge, theme toggle, and sign out
 * - Accessible keyboard navigation and focus management
 * - Zero layout shift skeleton during user session hydration
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar, { TopBarUser } from "./TopBar";
import { Skeleton } from "@/components/ui/skeleton";

export interface AppShellProps {
  children: React.ReactNode;
  initialUser?: TopBarUser | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, initialUser }) => {
  const router = useRouter();
  const [fetchedUser, setFetchedUser] = useState<TopBarUser | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(!initialUser);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Derive active user and loading state without cascading setState effects
  const user = initialUser ?? fetchedUser;
  const isLoading = !user && isFetching;

  // If initialUser was not passed from server layout, fetch from /api/v1/auth/me
  useEffect(() => {
    if (initialUser) {
      return;
    }

    let isMounted = true;
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (!res.ok) {
          if (res.status === 401 && isMounted) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load session");
        }

        const data = await res.json();
        if (isMounted) {
          if (data.success && data.user) {
            setFetchedUser(data.user);
          } else {
            router.push("/login");
          }
        }
      } catch {
        if (isMounted) {
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    }

    fetchCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [initialUser, router]);

  // Loading state placeholder: Shell skeleton prevents any flash or layout shift
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading Horizon Portal application shell"
        className="min-h-screen bg-[var(--hz-bg-canvas)]"
      >
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] p-5 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="2.25rem" height="2.25rem" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" width="70%" height="0.875rem" />
              <Skeleton variant="text" width="40%" height="0.625rem" />
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton variant="rectangular" height="2rem" className="rounded-lg" />
            <Skeleton variant="rectangular" height="2rem" className="rounded-lg" />
            <Skeleton variant="rectangular" height="2rem" className="rounded-lg" />
            <Skeleton variant="rectangular" height="2rem" className="rounded-lg" />
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <header className="h-16 border-b border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] px-6 flex items-center justify-between">
            <Skeleton variant="text" width="10rem" height="1rem" />
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" width="2rem" height="2rem" />
              <Skeleton variant="text" width="6rem" height="0.875rem" />
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
            <Skeleton variant="rectangular" height="12rem" className="rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton variant="rectangular" height="8rem" className="rounded-xl" />
              <Skeleton variant="rectangular" height="8rem" className="rounded-xl" />
              <Skeleton variant="rectangular" height="8rem" className="rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hz-bg-canvas)] text-[var(--hz-text-primary)] transition-colors">
      {/* Sidebar (Role-aware menu + drawer behavior) */}
      <Sidebar
        userRole={user?.role}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        toggleButtonRef={menuButtonRef}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all">
        {/* Sticky TopBar */}
        <TopBar
          user={user}
          onMenuClick={() => setIsMobileOpen(true)}
          menuButtonRef={menuButtonRef}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
