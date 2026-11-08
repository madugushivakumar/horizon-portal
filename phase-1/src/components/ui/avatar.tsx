"use client";

/**
 * Horizon Design System — Avatar Component
 * src/components/ui/avatar.tsx
 *
 * Renders employee initials with deterministic token-based color assignment.
 * Guarantees that the same employee always receives the identical avatar color
 * across directory, profile, and topbar screens without random color shifts.
 */

import React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "id"> {
  name?: string | null;
  id?: string | null;
  size?: AvatarSize;
  alt?: string;
}

const PALETTES = [
  // 0: Horizon Primary (Blue)
  "bg-[var(--hz-primary-100)] text-[var(--hz-primary-700)] dark:bg-[var(--hz-primary-950)] dark:text-[var(--hz-primary-300)] border border-[var(--hz-primary-500)]/20",
  // 1: Horizon Secondary (Indigo)
  "bg-[var(--hz-secondary-100)] text-[var(--hz-secondary-700)] dark:bg-[var(--hz-secondary-950)] dark:text-[var(--hz-secondary-300)] border border-[var(--hz-secondary-500)]/20",
  // 2: Horizon Success (Emerald)
  "bg-[var(--hz-success-bg)] text-[var(--hz-success-light)] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/20",
  // 3: Horizon Warning (Amber)
  "bg-[var(--hz-warning-bg)] text-[var(--hz-warning-light)] dark:bg-amber-950 dark:text-amber-300 border border-amber-500/20",
  // 4: Horizon Info (Sky)
  "bg-[var(--hz-info-bg)] text-[var(--hz-info-light)] dark:bg-sky-950 dark:text-sky-300 border border-sky-500/20",
  // 5: Purple / Accent
  "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-500/20",
] as const;

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "HZ";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HZ";
  if (parts.length === 1) {
    const single = parts[0];
    return (single.length > 1 ? single.slice(0, 2) : single).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDeterministicColorClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs font-semibold rounded-lg",
  md: "h-10 w-10 text-sm font-semibold rounded-xl",
  lg: "h-14 w-14 text-base font-bold rounded-2xl",
  xl: "h-20 w-20 text-xl font-extrabold rounded-3xl",
};

export const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  id,
  size = "md",
  className,
  alt,
  ...props
}) => {
  const initials = getInitials(name);
  const colorSeed = id || name || "horizon";
  const paletteClass = getDeterministicColorClass(colorSeed);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      role="img"
      aria-label={alt || `Avatar initials for ${name}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center select-none shadow-sm transition-colors",
        sizeClass,
        paletteClass,
        className
      )}
      {...props}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );
};

export default Avatar;
