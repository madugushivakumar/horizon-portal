/**
 * Horizon Portal — Notifications & Announcements API Endpoint
 * GET /api/v1/notifications
 *
 * Returns personal notifications, unread count, and accessible company announcements
 * for the authenticated user. Enforces strict privacy and server-side authentication.
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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status, headers: NO_CACHE_HEADERS }
      );
    }

    const userId = authResult.user.id;

    // Fetch personal notifications, unread count, and company announcements in parallel
    const [personalNotifications, unreadCount, announcements] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.announcement.findMany({
        orderBy: { postedOn: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          category: true,
          postedOn: true,
        },
      }),
    ]);

    const formattedNotifications = personalNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    const formattedAnnouncements = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      postedOn: a.postedOn.toISOString().split("T")[0],
    }));

    return NextResponse.json(
      {
        success: true,
        notifications: formattedNotifications,
        unreadCount,
        announcements: formattedAnnouncements,
        data: {
          notifications: formattedNotifications,
          unreadCount,
          announcements: formattedAnnouncements,
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

    console.error("Error retrieving notifications:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving notifications." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
