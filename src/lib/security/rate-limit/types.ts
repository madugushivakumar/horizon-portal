/**
 * Horizon Portal — Distributed Rate Limiting Types
 * src/lib/security/rate-limit/types.ts
 */

export type RateLimitDecision = {
  allowed: boolean;
  limitType?: "ip" | "account";
  retryAfterSeconds?: number;
  remaining?: number;
  limit?: number;
  resetAt?: Date;
};

export type RateLimitConfig = {
  ipLimit: number;
  ipWindowSeconds: number;
  accountLimit: number;
  accountWindowSeconds: number;
  failureMode: "fail-open" | "fail-closed";
  prefix: string;
};

export interface DistributedRateLimitStore {
  /**
   * Atomically increments a key and returns the updated count and TTL in milliseconds.
   * If the key is newly created, it sets the TTL to windowSeconds.
   */
  incrementAndGetTTL(key: string, windowSeconds: number): Promise<{ count: number; ttlMs: number }>;

  /**
   * Retrieves the current count and remaining TTL in milliseconds without mutating.
   */
  get(key: string): Promise<{ count: number; ttlMs: number }>;

  /**
   * Resets/deletes a key from the distributed store.
   */
  reset(key: string): Promise<boolean>;
}
