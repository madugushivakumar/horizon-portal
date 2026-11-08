"use client";

/**
 * Horizon Portal — Sidebar Navigation Component
 * src/components/layout/Sidebar.tsx
 *
 * Implements role-aware navigation rendering based on central navigation config.
 * Desktop: Persistent clean sidebar (w-64)
 * Mobile: Accessible modal-style drawer with backdrop, focus trapping & ESC key handling.
 */

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavigationForRole, Role } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  userRole?: string;
  isOpen: boolean; // Mobile open state
  onClose: () => void;
  toggleButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

// Icon renderer mapped to navigation item icons
function renderNavIcon(name: string, active: boolean) {
  const iconClass = cn(
    "h-5 w-5 shrink-0 transition-colors",
    active
      ? "text-[var(--hz-primary-600)] dark:text-[var(--hz-primary-400)]"
      : "text-[var(--hz-text-muted)] group-hover:text-[var(--hz-text-primary)]"
  );

  switch (name) {
    case "dashboard":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "users":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "calendar":
    case "calendar-days":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "document":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "clipboard-check":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "chart-bar":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "currency-dollar":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "user-plus":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    case "shield-check":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "cog":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = "Employee",
  isOpen,
  onClose,
  toggleButtonRef,
}) => {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Compute navigation sections for this specific role
  const sections = React.useMemo(() => getNavigationForRole(userRole as Role), [userRole]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
        toggleButtonRef?.current?.focus();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, toggleButtonRef]);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-5 border-b border-[var(--hz-border-default)]">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-primary-500)] rounded-lg p-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--hz-primary-600)] to-[var(--hz-secondary-500)] text-white shadow-md shadow-[var(--hz-primary-500)]/20 font-bold text-sm">
              HZ
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-[var(--hz-text-primary)]">
                Horizon Portal
              </div>
              <div className="text-[10px] text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
                Aura Workforce
              </div>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[var(--hz-text-muted)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Role Pill Indicator */}
        <div className="px-5 py-3 border-b border-[var(--hz-border-subtle)] bg-[var(--hz-bg-subtle)]/40 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
            Active Role
          </span>
          <Badge
            variant={
              userRole === "Admin"
                ? "danger"
                : userRole === "HR"
                ? "warning"
                : userRole === "Manager"
                ? "primary"
                : "secondary"
            }
            size="sm"
          >
            {userRole}
          </Badge>
        </div>

        {/* Navigation Sections */}
        <nav aria-label="Portal Navigation" className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.heading && (
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--hz-text-muted)]">
                  {section.heading}
                </div>
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hz-primary-500)]",
                          isActive
                            ? "bg-[var(--hz-primary-50)] text-[var(--hz-primary-700)] dark:bg-[var(--hz-primary-950)]/60 dark:text-[var(--hz-primary-300)] shadow-sm font-semibold"
                            : "text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] hover:text-[var(--hz-text-primary)]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderNavIcon(item.icon, isActive)}
                          <span>{item.title}</span>
                        </div>

                        {item.badge && (
                          <Badge variant="warning" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer link to Design System */}
      <div className="p-4 border-t border-[var(--hz-border-default)]">
        <Link
          href="/design"
          onClick={onClose}
          className="flex items-center justify-between rounded-xl border border-[var(--hz-border-default)] bg-[var(--hz-bg-subtle)] px-3 py-2 text-xs font-medium text-[var(--hz-text-secondary)] hover:border-[var(--hz-primary-500)] hover:text-[var(--hz-text-primary)] transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--hz-primary-500)]" />
            <span>Design System</span>
          </div>
          <span className="text-[10px] text-[var(--hz-text-muted)] font-mono">/design</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Desktop Sidebar Navigation"
        className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 border-r border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)]"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Drawer Dialog */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[var(--hz-bg-surface)] border-r border-[var(--hz-border-default)] shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
