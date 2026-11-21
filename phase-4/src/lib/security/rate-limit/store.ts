/**
 * Horizon Portal — Distributed Rate Limit Store Implementation
 * src/lib/security/rate-limit/store.ts
 *
 * Implements atomic distributed storage for Vercel Serverless / Edge runtimes:
 * 1. UpstashRedisStore: Zero-dependency HTTP REST pipeline integration with Upstash Redis.
 * 2. MemoryDistributedStore: In-memory atomic store for local dev, simulation, and automated test suites.
 */

import { DistributedRateLimitStore } from "./types";

/**
 * In-memory distributed store simulating shared Redis behavior for local dev & testing.
 */
export class MemoryDistributedStore implements DistributedRateLimitStore {
  private store = new Map<string, { count: number; expiresAt: number; windowSeconds: number }>();

  async incrementAndGetTTL(key: string, windowSeconds: number): Promise<{ count: number; ttlMs: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.expiresAt) {
      // New window or expired
      const expiresAt = now + windowSeconds * 1000;
      this.store.set(key, { count: 1, expiresAt, windowSeconds });
      return { count: 1, ttlMs: windowSeconds * 1000 };
    }

    // Increment existing window
    existing.count += 1;
    const ttlMs = Math.max(0, existing.expiresAt - now);
    return { count: existing.count, ttlMs };
  }

  async get(key: string): Promise<{ count: number; ttlMs: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.expiresAt) {
      if (existing) {
        this.store.delete(key);
      }
      return { count: 0, ttlMs: 0 };
    }

    const ttlMs = Math.max(0, existing.expiresAt - now);
    return { count: existing.count, ttlMs };
  }

  async reset(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Test/management helper: clear all rate-limit counters.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Test/management helper: get total active keys.
   */
  size(): number {
    return this.store.size;
  }
}

/**
 * Production Upstash Redis REST store.
 * Uses native HTTP fetch with REST pipeline commands:
 * - Atomic INCR + EXPIRE (NX) + PTTL in a single HTTP request round-trip
 * - 3000ms fetch timeout to prevent serverless function hangs
 * - Zero external npm dependencies
 */
export class UpstashRedisStore implements DistributedRateLimitStore {
  private url: string;
  private token: string;
  private timeoutMs: number;

  constructor(url: string, token: string, timeoutMs = 3000) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("http://")) {
      throw new Error("Invalid Upstash Redis URL: Expected valid HTTP/HTTPS URL");
    }
    this.url = trimmedUrl.replace(/\/+$/, "");
    this.token = token.trim();
    this.timeoutMs = timeoutMs;
  }

  private async executePipeline<T = unknown[]>(commands: unknown[][]): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upstash Redis HTTP ${response.status}: ${text}`);
      }

      const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
      for (const res of results) {
        if (res.error) {
          throw new Error(`Upstash command error: ${res.error}`);
        }
      }

      return results.map((r) => r.result) as unknown as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async incrementAndGetTTL(key: string, windowSeconds: number): Promise<{ count: number; ttlMs: number }> {
    // Pipeline:
    // 1. INCR key
    // 2. EXPIRE key windowSeconds NX (only set if key does not have an expiry)
    // 3. PTTL key
    const pipeline = [
      ["INCR", key],
      ["EXPIRE", key, windowSeconds, "NX"],
      ["PTTL", key],
    ];

    const results = await this.executePipeline<[number, number, number]>(pipeline);
    const count = Number(results[0]) || 1;
    let ttlMs = Number(results[2]);

    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      ttlMs = windowSeconds * 1000;
    }

    return { count, ttlMs };
  }

  async get(key: string): Promise<{ count: number; ttlMs: number }> {
    // Pipeline:
    // 1. GET key
    // 2. PTTL key
    const pipeline = [
      ["GET", key],
      ["PTTL", key],
    ];

    const results = await this.executePipeline<[string | null, number]>(pipeline);
    const rawVal = results[0];
    const ttlVal = Number(results[1]);

    if (rawVal === null || ttlVal < 0) {
      return { count: 0, ttlMs: 0 };
    }

    const count = parseInt(rawVal, 10) || 0;
    const ttlMs = Math.max(0, ttlVal);

    return { count, ttlMs };
  }

  async reset(key: string): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { result?: number };
      return Boolean(data.result && data.result > 0);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

// Module-level store singletons
let memoryStoreInstance: MemoryDistributedStore | null = null;
let customStoreInstance: DistributedRateLimitStore | null = null;

export function setRateLimitStoreForTesting(store: DistributedRateLimitStore | null): void {
  customStoreInstance = store;
}

export function getRateLimitStore(): DistributedRateLimitStore {
  if (customStoreInstance) {
    return customStoreInstance;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    return new UpstashRedisStore(upstashUrl, upstashToken);
  }

  if (isProduction) {
    // SEC-FIND-07: In production, silent fallback to in-memory store across serverless micro-instances is strictly prohibited.
    throw new Error(
      "Production distributed rate limiting requires valid UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables. Silent in-memory fallback is disabled in production."
    );
  }

  // Development / Local / CI fallback
  if (!memoryStoreInstance) {
    memoryStoreInstance = new MemoryDistributedStore();
  }

  return memoryStoreInstance;
}
