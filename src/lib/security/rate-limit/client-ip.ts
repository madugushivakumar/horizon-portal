/**
 * Horizon Portal — Trusted Client IP Extraction & Normalization
 * src/lib/security/rate-limit/client-ip.ts
 */

import { NextRequest } from "next/server";

const FALLBACK_IP = "unknown-client-ip";

/**
 * Validates an IPv4 address string.
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255 || (part.length > 1 && part.startsWith("0"))) {
      return false;
    }
  }
  return true;
}

/**
 * Validates an IPv6 address string.
 */
function isValidIPv6(ip: string): boolean {
  // Regex for standard or compressed IPv6
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
  return ipv6Regex.test(ip);
}

/**
 * Normalizes an IP string:
 * - Trims whitespace
 * - Strips IPv4-mapped IPv6 prefix (`::ffff:`)
 * - Strips trailing port from IPv4 (e.g., `192.168.1.1:54321` -> `192.168.1.1`)
 * - Strips brackets and port from bracketed IPv6 (e.g., `[2001:db8::1]:8080` -> `2001:db8::1`)
 * - Lowercases IPv6
 * - Returns normalized IP if valid, otherwise null
 */
export function normalizeIp(rawIp: string | null | undefined): string | null {
  if (!rawIp || typeof rawIp !== "string") {
    return null;
  }

  let ip = rawIp.trim();
  if (!ip) return null;

  // Handle bracketed IPv6 with port: [2001:db8::1]:8080 -> 2001:db8::1
  if (ip.startsWith("[") && ip.includes("]")) {
    const closingBracket = ip.indexOf("]");
    ip = ip.substring(1, closingBracket);
  } else if (ip.includes(".") && ip.includes(":") && !ip.startsWith("::ffff:")) {
    // IPv4 with port: 192.168.1.1:8080 -> 192.168.1.1
    // (Only if single colon separating port, not IPv6 hex)
    const colonCount = (ip.match(/:/g) || []).length;
    if (colonCount === 1) {
      ip = ip.split(":")[0];
    }
  }

  // Handle IPv4-mapped IPv6: ::ffff:192.0.2.128
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  // Validate IPv4
  if (isValidIPv4(ip)) {
    return ip;
  }

  // Validate IPv6
  if (isValidIPv6(ip)) {
    return ip.toLowerCase();
  }

  return null;
}

/**
 * Extracts and normalizes the client IP address from a NextRequest or standard Request.
 * Inspects trusted headers in authoritative security precedence:
 * 1. x-vercel-forwarded-for (Authoritative platform header managed by Vercel Edge Network)
 * 2. x-real-ip (Standard reverse proxy header, e.g., Cloudflare/Nginx)
 * 3. x-forwarded-for (First client token in multi-hop forwarding list)
 * 4. Runtime request IP fallback
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;

  // 1. x-vercel-forwarded-for (Platform-authoritative on Vercel infrastructure)
  const vercelForwardedFor = headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    // Can be comma-separated list: first token is original client connecting to Vercel edge
    const firstVercelIp = vercelForwardedFor.split(",")[0].trim();
    const normalized = normalizeIp(firstVercelIp);
    if (normalized) return normalized;
  }

  // 2. x-real-ip (Standard gateway header from trusted reverse proxy)
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    const normalized = normalizeIp(realIp);
    if (normalized) return normalized;
  }

  // 3. x-forwarded-for (First client token)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(",")[0].trim();
    const normalized = normalizeIp(firstForwardedIp);
    if (normalized) return normalized;
  }

  // 4. Fallback: inspect any runtime ip property if attached
  const runtimeReq = req as unknown as { ip?: string };
  if (typeof runtimeReq.ip === "string") {
    const normalized = normalizeIp(runtimeReq.ip);
    if (normalized) return normalized;
  }

  return FALLBACK_IP;
}
