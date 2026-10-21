"use client";

/**
 * Horizon Design System — Breadcrumbs Component
 * src/components/layout/Breadcrumbs.tsx
 *
 * Renders hierarchical navigational context based on route segments or explicit items.
 * Ancestor links are navigable; current page is marked with aria-current="page".
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItem[];
  homeLabel?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Directory",
  leave: "My Leave",
  payslips: "My Payslips",
  approvals: "Team Approvals",
  team: "Team Performance",
  "leave-management": "Leave Operations",
  payroll: "Payroll Operations",
  recruitment: "Recruitment",
  admin: "Administration",
  users: "User Management",
  settings: "Settings",
  audit: "Audit Logs",
  design: "Design System",
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  homeLabel = "Horizon Portal",
  className,
  ...props
}) => {
  const pathname = usePathname();

  // If explicit items were not provided, compute from pathname
  const computedItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return [{ label: homeLabel, href: "/dashboard" }];
    }

    const trail: BreadcrumbItem[] = [{ label: homeLabel, href: "/dashboard" }];
    let accumulatedPath = "";

    segments.forEach((seg, idx) => {
      accumulatedPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

      trail.push({
        label,
        href: isLast ? undefined : accumulatedPath,
      });
    });

    return trail;
  }, [items, pathname, homeLabel]);

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn("flex items-center text-xs text-[var(--hz-text-muted)]", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {computedItems.map((item, index) => {
          const isLast = index === computedItems.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-[var(--hz-border-default)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--hz-text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hz-primary-500)] rounded px-0.5"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="font-medium text-[var(--hz-text-primary)] truncate max-w-[160px] sm:max-w-none"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
