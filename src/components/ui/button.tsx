/**
 * Horizon Design System — Button Component
 * src/components/ui/button.tsx
 *
 * Variants: primary | secondary | danger
 * States: default | hover | active | disabled | loading
 * All colors reference Horizon CSS custom properties via Tailwind v4 utilities.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. Defaults to "primary". */
  variant?: ButtonVariant;
  /** Size preset. Defaults to "md". */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  /** Full-width block button. */
  fullWidth?: boolean;
  /** Icon placed before the label. */
  leftIcon?: React.ReactNode;
  /** Icon placed after the label. */
  rightIcon?: React.ReactNode;
}

/* ── Spinner ────────────────────────────────────────────────── */

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn("hz-animate-spin", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

/* ── Style Maps ─────────────────────────────────────────────── */

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--hz-btn-primary-bg)] text-[var(--hz-btn-primary-text)]",
    "border border-transparent",
    "hover:bg-[var(--hz-btn-primary-bg-hover)]",
    "active:bg-[var(--hz-btn-primary-bg-active)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--hz-btn-primary-ring)] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--hz-bg-base)]",
    "shadow-[var(--hz-shadow-sm)] hover:shadow-[var(--hz-shadow-md)]",
  ].join(" "),

  secondary: [
    "bg-[var(--hz-btn-secondary-bg)] text-[var(--hz-btn-secondary-text)]",
    "border border-[var(--hz-btn-secondary-border)]",
    "hover:bg-[var(--hz-btn-secondary-bg-hover)]",
    "active:bg-[var(--hz-btn-secondary-bg-active)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--hz-focus-ring)] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--hz-bg-base)]",
    "shadow-[var(--hz-shadow-sm)] hover:shadow-[var(--hz-shadow-md)]",
  ].join(" "),

  danger: [
    "bg-[var(--hz-btn-danger-bg)] text-[var(--hz-btn-danger-text)]",
    "border border-transparent",
    "hover:bg-[var(--hz-btn-danger-bg-hover)]",
    "active:bg-[var(--hz-btn-danger-bg-active)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--hz-danger)] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--hz-bg-base)]",
    "shadow-[var(--hz-shadow-sm)] hover:shadow-[var(--hz-shadow-md)]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const spinnerSizeStyles: Record<ButtonSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

/* ── Component ─────────────────────────────────────────────── */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          /* Base */
          "relative inline-flex items-center justify-center",
          "rounded-lg font-medium",
          "cursor-pointer select-none",
          "transition-all duration-150 ease-out",
          "outline-none focus-visible:outline-none",
          /* Disabled */
          isDisabled &&
            "opacity-50 cursor-not-allowed pointer-events-none",
          /* Width */
          fullWidth ? "w-full" : "w-auto",
          /* Variant */
          variantStyles[variant],
          /* Size */
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {/* Loading spinner replaces left icon */}
        {loading ? (
          <Spinner className={spinnerSizeStyles[size]} />
        ) : (
          leftIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}

        {/* Label */}
        <span className={loading ? "opacity-75" : undefined}>{children}</span>

        {/* Right icon (hidden while loading) */}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
