/**
 * Horizon Design System — Input Component
 * src/components/ui/input.tsx
 *
 * Features:
 *  - Visible label with accessible htmlFor association
 *  - Optional helper text
 *  - Optional error message (aria-describedby + aria-invalid)
 *  - Required and disabled states
 *  - Focus and invalid visual styling via Horizon tokens
 */

"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label text. */
  label: string;
  /** Optional supporting text displayed below the input. */
  helperText?: string;
  /** Error message. When provided the input renders in invalid state. */
  errorText?: string;
  /** Makes the label show a required indicator. */
  required?: boolean;
  /** Hides the label visually while keeping it accessible. */
  hideLabel?: boolean;
  /** Icon displayed inside the left edge of the input. */
  leftElement?: React.ReactNode;
  /** Icon displayed inside the right edge of the input. */
  rightElement?: React.ReactNode;
  /** Container class override. */
  wrapperClassName?: string;
}

/* ── Sub-components ────────────────────────────────────────── */

/** Animated error icon shown next to error text. */
const ErrorIcon: React.FC = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0 mt-px"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 6.5a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

/* ── Component ─────────────────────────────────────────────── */

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      id: externalId,
      helperText,
      errorText,
      required,
      hideLabel,
      disabled,
      leftElement,
      rightElement,
      wrapperClassName,
      className,
      type = "text",
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const inputId = externalId ?? `hz-input-${uid}`;
    const errorId = `hz-input-error-${uid}`;
    const helperId = `hz-input-helper-${uid}`;
    const hasError = Boolean(errorText);

    const describedBy = [
      hasError ? errorId : null,
      helperText && !hasError ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium leading-5 transition-colors",
            disabled
              ? "text-[var(--hz-text-disabled)]"
              : "text-[var(--hz-text-primary)]",
            hideLabel && "sr-only"
          )}
        >
          {label}
          {required && (
            <span
              className="ml-1 text-[var(--hz-danger)] select-none"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>

        {/* Input wrapper — enables left/right elements */}
        <div className="relative flex items-center">
          {leftElement && (
            <span
              className="absolute left-3 flex items-center text-[var(--hz-text-muted)] pointer-events-none"
              aria-hidden="true"
            >
              {leftElement}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-required={required}
            className={cn(
              /* Layout */
              "w-full h-10 rounded-lg text-sm",
              "px-3 py-2",
              Boolean(leftElement) && "pl-9",
              Boolean(rightElement) && "pr-9",
              /* Colours — token-backed */
              "bg-[var(--hz-input-bg)]",
              "text-[var(--hz-input-text)]",
              "border",
              hasError
                ? "border-[var(--hz-input-error-border)]"
                : "border-[var(--hz-input-border)]",
              /* Transitions */
              "transition-all duration-150 outline-none",
              /* Placeholder */
              "placeholder:text-[var(--hz-input-placeholder)]",
              /* Hover */
              !hasError &&
                !disabled &&
                "hover:border-[var(--hz-input-border-hover)]",
              /* Focus */
              !hasError &&
                "focus:border-[var(--hz-input-border-focus)] focus:shadow-[var(--hz-shadow-focus)]",
              hasError &&
                "focus:shadow-[var(--hz-shadow-focus-danger)]",
              /* Disabled */
              disabled &&
                "bg-[var(--hz-input-disabled-bg)] text-[var(--hz-text-disabled)] cursor-not-allowed opacity-60",
              className
            )}
            {...props}
          />

          {rightElement && (
            <span
              className="absolute right-3 flex items-center text-[var(--hz-text-muted)] pointer-events-none"
              aria-hidden="true"
            >
              {rightElement}
            </span>
          )}
        </div>

        {/* Error message — not color-only; includes icon */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-xs font-medium text-[var(--hz-input-error-text)]"
          >
            <ErrorIcon />
            {errorText}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <p
            id={helperId}
            className="text-xs text-[var(--hz-text-muted)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
