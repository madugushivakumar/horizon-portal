/**
 * Horizon Design System — Card Component
 * src/components/ui/card.tsx
 *
 * Reusable container with consistent surface, border, radius, and shadow.
 * Exports: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */

import React from "react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */

export type CardElevation = "flat" | "raised" | "elevated";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shadow / elevation preset. Defaults to "raised". */
  elevation?: CardElevation;
  /** Padding preset. Defaults to "md". */
  padding?: CardPadding;
  /** Render a subtle hover lift effect. */
  interactive?: boolean;
  /** Add a coloured top accent bar. */
  accent?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack header and actions vertically on small screens. */
  responsive?: boolean;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

/* ── Style Maps ─────────────────────────────────────────────── */

const elevationStyles: Record<CardElevation, string> = {
  flat:     "shadow-none",
  raised:   "shadow-[var(--hz-shadow-sm)]",
  elevated: "shadow-[var(--hz-shadow-md)]",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

const accentColors: Record<string, string> = {
  primary:   "border-t-[var(--hz-primary-500)]",
  secondary: "border-t-[var(--hz-secondary-600)]",
  success:   "border-t-[var(--hz-success)]",
  warning:   "border-t-[var(--hz-warning)]",
  danger:    "border-t-[var(--hz-danger)]",
  info:      "border-t-[var(--hz-info)]",
};

/* ── Card ───────────────────────────────────────────────────── */

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      elevation = "raised",
      padding = "md",
      interactive = false,
      accent,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        /* Base surface */
        "relative rounded-xl overflow-hidden",
        "bg-[var(--hz-card-bg)]",
        "border border-[var(--hz-card-border)]",
        /* Elevation */
        elevationStyles[elevation],
        /* Padding */
        padding !== "none" && paddingStyles[padding],
        /* Accent top border */
        accent && "border-t-2",
        accent && accentColors[accent],
        /* Interactive */
        interactive &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--hz-shadow-lg)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

/* ── CardHeader ─────────────────────────────────────────────── */

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ responsive = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex gap-4 mb-4",
        responsive
          ? "flex-col sm:flex-row sm:items-center sm:justify-between"
          : "items-start justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

/* ── CardTitle ──────────────────────────────────────────────── */

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Tag = "h3", className, children, ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight",
        "text-[var(--hz-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
);
CardTitle.displayName = "CardTitle";

/* ── CardDescription ────────────────────────────────────────── */

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--hz-text-secondary)]", className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

/* ── CardContent ────────────────────────────────────────────── */

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-[var(--hz-text-primary)]", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

/* ── CardFooter ─────────────────────────────────────────────── */

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-4 pt-4 border-t border-[var(--hz-border)]",
        "flex items-center gap-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export default Card;
