/**
 * Horizon Portal — Server-Only Notification Dispatcher Helper
 * src/lib/notifications/notify.ts
 *
 * Reusable server-side helper to safely persist personal notifications with
 * schema validation, recipient verification, deduplication, and safe error handling.
 */

import { prisma } from "@/lib/prisma";

export interface SafeNotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  eventKey: string | null;
  createdAt: Date;
}

export interface NotifyOptions {
  userId: string;
  title: string;
  message: string;
  eventKey?: string | null;
}

export interface NotificationResult {
  success: boolean;
  notification?: SafeNotificationRecord;
  deduplicated?: boolean;
  error?: string;
}

export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationError";
  }
}

const MAX_TITLE_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EVENT_KEY_LENGTH = 128;

/**
 * Creates and persists a personal notification for an authenticated user.
 * Supports both argument signatures:
 *   notify(userId, title, message, eventKey?)
 *   notify({ userId, title, message, eventKey? })
 */
export async function notify(
  param1: string | NotifyOptions,
  param2?: string,
  param3?: string,
  param4?: string | null
): Promise<NotificationResult> {
  let userId = "";
  let title = "";
  let message = "";
  let eventKey: string | null = null;

  if (typeof param1 === "object" && param1 !== null) {
    userId = param1.userId;
    title = param1.title;
    message = param1.message;
    eventKey = param1.eventKey ?? null;
  } else if (typeof param1 === "string") {
    userId = param1;
    title = param2 ?? "";
    message = param3 ?? "";
    eventKey = param4 ?? null;
  }

  // 1. Input sanitization & validation
  const cleanUserId = typeof userId === "string" ? userId.trim() : "";
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  const cleanEventKey = typeof eventKey === "string" ? eventKey.trim() : null;

  if (!cleanUserId) {
    return { success: false, error: "Recipient user ID is required." };
  }

  if (!cleanTitle) {
    return { success: false, error: "Notification title is required." };
  }

  if (cleanTitle.length > MAX_TITLE_LENGTH) {
    return {
      success: false,
      error: `Notification title exceeds maximum length of ${MAX_TITLE_LENGTH} characters.`,
    };
  }

  if (!cleanMessage) {
    return { success: false, error: "Notification message is required." };
  }

  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `Notification message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  if (cleanEventKey && cleanEventKey.length > MAX_EVENT_KEY_LENGTH) {
    return {
      success: false,
      error: `Event key exceeds maximum length of ${MAX_EVENT_KEY_LENGTH} characters.`,
    };
  }

  try {
    // 2. Verify recipient user exists in database
    const recipient = await prisma.user.findUnique({
      where: { id: cleanUserId },
      select: { id: true, isActive: true },
    });

    if (!recipient) {
      return {
        success: false,
        error: `Recipient user with ID "${cleanUserId}" does not exist.`,
      };
    }

    // 3. Deduplication / Idempotency check if eventKey is provided
    if (cleanEventKey) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: cleanUserId,
          eventKey: cleanEventKey,
        },
        select: {
          id: true,
          userId: true,
          title: true,
          message: true,
          isRead: true,
          eventKey: true,
          createdAt: true,
        },
      });

      if (existing) {
        return {
          success: true,
          notification: existing,
          deduplicated: true,
        };
      }
    }

    // 4. Persist unread notification
    const created = await prisma.notification.create({
      data: {
        userId: cleanUserId,
        title: cleanTitle,
        message: cleanMessage,
        eventKey: cleanEventKey,
        isRead: false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        isRead: true,
        eventKey: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      notification: created,
      deduplicated: false,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown database error.";
    console.error(`[notify] Failed to dispatch notification to user ${cleanUserId}:`, error);
    return {
      success: false,
      error: `Failed to persist notification: ${errorMsg}`,
    };
  }
}
