/**
 * Horizon Portal — shared utilities
 * src/lib/utils.ts
 */

/**
 * Joins class names, filtering out falsy values.
 * A lightweight alternative to clsx / classnames.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Returns a deterministic stagger delay for list animations.
 */
export function staggerDelay(index: number, base = 60): string {
  return `${index * base}ms`;
}
