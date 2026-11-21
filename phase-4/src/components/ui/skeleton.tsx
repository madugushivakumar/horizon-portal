/**
 * Horizon Design System — Skeleton Component
 * src/components/ui/skeleton.tsx
 *
 * Configurable loading placeholder for text, cards, avatars, and tables.
 * Supports light & dark modes, smooth pulse animation, and reduced motion.
 */

import React from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  rounded,
  className,
  style,
  ...props
}) => {
  const roundedClass =
    rounded === "full" || variant === "circular"
      ? "rounded-full"
      : rounded === "lg"
      ? "rounded-xl"
      : rounded === "sm"
      ? "rounded-sm"
      : rounded === "none"
      ? "rounded-none"
      : "rounded-lg";

  const defaultHeight =
    variant === "text" ? "h-4" : variant === "circular" ? "h-10 w-10" : "h-24";

  return (
    <div
      role="status"
      aria-label="Loading content..."
      aria-busy="true"
      className={cn(
        "animate-pulse motion-reduce:animate-none bg-[var(--hz-bg-subtle)] border border-[var(--hz-border-subtle)]",
        roundedClass,
        defaultHeight,
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Skeleton;
