/**
 * Horizon Portal — Notification Mark as Read API Endpoint
 * POST /api/v1/notifications/[id]/read
 *
 * Marks a single personal notification as read for the authenticated user.
 * Enforces ownership check, idempotency, privacy (404 for foreign or non-existent IDs),
 * and returns updated state + new unread count.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const resolvedParams = await Promise.resolve(context.params);
    const notificationId = typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";

    if (!notificationId) {
      return NextResponse.json(
        { error: "Invalid notification identifier." },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const userId = authResult.user.id;

    // Resolve target notification
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
    });

    // Enforce ownership: 404 if nonexistent or belongs to another user
    if (!existingNotification || existingNotification.userId !== userId) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    let updatedRecord = existingNotification;

    // Idempotent update: Only mutate if currently unread
    if (!existingNotification.isRead) {
      updatedRecord = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
        select: {
          id: true,
          userId: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      });
    }

    // Compute updated unread count for the current user
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    const safeNotification = {
      id: updatedRecord.id,
      title: updatedRecord.title,
      message: updatedRecord.message,
      isRead: updatedRecord.isRead,
      createdAt: updatedRecord.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        notification: safeNotification,
        unreadCount,
        data: {
          notification: safeNotification,
          unreadCount,
        },
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("Error updating notification status:", error);
    return NextResponse.json(
      { error: "Internal server error updating notification status." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
