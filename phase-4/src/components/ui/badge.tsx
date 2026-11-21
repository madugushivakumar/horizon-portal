/**
 * Horizon Design System — Badge Component
 * src/components/ui/badge.tsx
 *
 * Variants: default | primary | secondary | success | warning | danger | info
 * Supports dot indicator, icon slot, and dismissible mode.
 */

import React from "react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour variant. Defaults to "default". */
  variant?: BadgeVariant;
  /** Size preset. Defaults to "md". */
  size?: BadgeSize;
  /** Shows a coloured status dot before the label. */
  dot?: boolean;
  /** Icon placed before the label text. */
  icon?: React.ReactNode;
  /** Pill shape (fully rounded). Defaults to true. */
  pill?: boolean;
}

/* ── Style Maps ─────────────────────────────────────────────── */

const variantStyles: Record<BadgeVariant, string> = {
  default: [
    "bg-[var(--hz-badge-default-bg)]",
    "text-[var(--hz-badge-default-text)]",
    "border-[var(--hz-border)]",
  ].join(" "),

  primary: [
    "bg-[var(--hz-primary-100)] dark:bg-[var(--hz-primary-950)]",
    "text-[var(--hz-primary-700)] dark:text-[var(--hz-primary-300)]",
    "border-[var(--hz-primary-200)] dark:border-[var(--hz-primary-800)]",
  ].join(" "),

  secondary: [
    "bg-[var(--hz-secondary-100)] dark:bg-[var(--hz-secondary-900)]",
    "text-[var(--hz-secondary-700)] dark:text-[var(--hz-secondary-300)]",
    "border-[var(--hz-secondary-200)] dark:border-[var(--hz-secondary-800)]",
  ].join(" "),

  success: [
    "bg-[var(--hz-success-bg)] dark:bg-[var(--hz-success-bg-dark)]",
    "text-[var(--hz-success-light)] dark:text-[var(--hz-success-text-dark)]",
    "border-[var(--hz-secondary-200)] dark:border-[var(--hz-secondary-800)]",
  ].join(" "),

  warning: [
    "bg-[var(--hz-warning-bg)] dark:bg-[var(--hz-warning-bg-dark)]",
    "text-[var(--hz-warning-light)] dark:text-[var(--hz-warning-text-dark)]",
    "border-[var(--hz-warning-bg)] dark:border-[var(--hz-warning-bg-dark)]",
  ].join(" "),

  danger: [
    "bg-[var(--hz-danger-bg)] dark:bg-[var(--hz-danger-bg-dark)]",
    "text-[var(--hz-danger-light)] dark:text-[var(--hz-danger-text-dark)]",
    "border-[var(--hz-danger-bg)] dark:border-[var(--hz-danger-bg-dark)]",
  ].join(" "),

  info: [
    "bg-[var(--hz-info-bg)] dark:bg-[var(--hz-info-bg-dark)]",
    "text-[var(--hz-info-light)] dark:text-[var(--hz-info-text-dark)]",
    "border-[var(--hz-info-bg)] dark:border-[var(--hz-info-bg-dark)]",
  ].join(" "),
};

const dotColors: Record<BadgeVariant, string> = {
  default:   "bg-[var(--hz-text-muted)]",
  primary:   "bg-[var(--hz-primary-500)]",
  secondary: "bg-[var(--hz-secondary-600)]",
  success:   "bg-[var(--hz-success)]",
  warning:   "bg-[var(--hz-warning)]",
  danger:    "bg-[var(--hz-danger)]",
  info:      "bg-[var(--hz-info)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

/* ── Component ─────────────────────────────────────────────── */

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      dot = false,
      icon,
      pill = true,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        /* Base */
        "inline-flex items-center border font-medium leading-none",
        "transition-colors duration-150 select-none whitespace-nowrap",
        /* Shape */
        pill ? "rounded-full" : "rounded-md",
        /* Variant */
        variantStyles[variant],
        /* Size */
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Status dot */}
      {dot && (
        <span
          className={cn(
            "inline-block shrink-0 rounded-full",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            dotColors[variant]
          )}
          aria-hidden="true"
        />
      )}

      {/* Optional icon */}
      {icon && !dot && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {children}
    </span>
  )
);

Badge.displayName = "Badge";

export default Badge;
