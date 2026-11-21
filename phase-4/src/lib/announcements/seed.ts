/**
 * Horizon Portal — Announcements Seeding Utility
 * src/lib/announcements/seed.ts
 *
 * Safely parses, validates, and seeds announcements from 03_Data_Pack/announcements.json
 * into the SQLite database using idempotent Prisma upserts.
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

export interface RawAnnouncement {
  announcement_id?: unknown;
  title?: unknown;
  body?: unknown;
  category?: unknown;
  posted_on?: unknown;
}

export interface ValidatedAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  postedOn: Date;
}

export interface SeedResult {
  sourcePath: string;
  sourceCount: number;
  validCount: number;
  rejectedCount: number;
  upsertedCount: number;
  rejectedDetails: string[];
}

export const ANNOUNCEMENTS_SOURCE_PATH = path.join(
  process.cwd(),
  "03_Data_Pack",
  "announcements.json"
);

/**
 * Validates a single raw announcement record against required schema.
 */
export function validateAnnouncement(raw: RawAnnouncement, index: number): ValidatedAnnouncement | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.announcement_id === "string" ? raw.announcement_id.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  const category = typeof raw.category === "string" ? raw.category.trim() : "";
  const postedOnStr = typeof raw.posted_on === "string" ? raw.posted_on.trim() : "";

  if (!id || !title || !body || !category || !postedOnStr) {
    return null;
  }

  const parsedDate = new Date(postedOnStr);
  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    id,
    title,
    body,
    category,
    postedOn: parsedDate,
  };
}

/**
 * Reads, validates, and safely upserts announcements into the database.
 */
export async function seedAnnouncements(prisma: PrismaClient): Promise<SeedResult> {
  if (!fs.existsSync(ANNOUNCEMENTS_SOURCE_PATH)) {
    throw new Error(`CRITICAL: Source announcements file not found at ${ANNOUNCEMENTS_SOURCE_PATH}`);
  }

  const rawContent = fs.readFileSync(ANNOUNCEMENTS_SOURCE_PATH, "utf-8");
  const rawList = JSON.parse(rawContent) as RawAnnouncement[];

  if (!Array.isArray(rawList)) {
    throw new Error(`CRITICAL: announcements.json does not contain an array of records.`);
  }

  const validRecords: ValidatedAnnouncement[] = [];
  const rejectedDetails: string[] = [];

  rawList.forEach((raw, idx) => {
    const validated = validateAnnouncement(raw, idx);
    if (validated) {
      validRecords.push(validated);
    } else {
      rejectedDetails.push(`Record at index ${idx} failed schema validation`);
    }
  });

  let upsertedCount = 0;
  for (const record of validRecords) {
    await prisma.announcement.upsert({
      where: { id: record.id },
      update: {
        title: record.title,
        body: record.body,
        category: record.category,
        postedOn: record.postedOn,
      },
      create: {
        id: record.id,
        title: record.title,
        body: record.body,
        category: record.category,
        postedOn: record.postedOn,
      },
    });
    upsertedCount++;
  }

  return {
    sourcePath: ANNOUNCEMENTS_SOURCE_PATH,
    sourceCount: rawList.length,
    validCount: validRecords.length,
    rejectedCount: rejectedDetails.length,
    upsertedCount,
    rejectedDetails,
  };
}
