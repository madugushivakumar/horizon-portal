/**
 * HR Assistant Chat API Route
 * POST /api/v1/hr-assistant/chat
 *
 * Provides the conversational endpoint for the HR assistant chat widget:
 * 1. Validates incoming message payload with Zod 4 (1-500 chars, non-empty, trimmed).
 * 2. Authenticates current user session via signed JWT cookie (getAuthenticatedUserFromToken).
 * 3. Strictly derives identity from the authenticated session (rejects/ignores any client identity injection).
 * 4. Dispatches query to the Assistant Service.
 * 5. Returns structured, sanitized response with no-cache headers.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createValidationErrorResponse } from "@/lib/validations/common";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAuthenticatedUserFromToken } from "@/lib/auth/user";
import { processAssistantMessage } from "@/lib/assistant/assistant-service";

const ChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message must contain at least 1 non-whitespace character.")
    .max(500, "Message cannot exceed 500 characters."),
});

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate the user session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authResult = await getAuthenticatedUserFromToken(token);

    if (!authResult.success) {
      return NextResponse.json(
        { error: "Authentication required to use the HR assistant." },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    // Step 2: Parse and validate JSON request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return createValidationErrorResponse(
        "Invalid JSON request body.",
        undefined,
        NO_CACHE_HEADERS
      );
    }

    const validationResult = ChatRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error, undefined, NO_CACHE_HEADERS);
    }

    const { message } = validationResult.data;

    // Step 3: Process the assistant message bound to authenticated user
    const response = await processAssistantMessage(authResult.user, message);

    return NextResponse.json(
      {
        success: true,
        answer: response.answer,
        category: response.category,
        policySource: response.policySource ?? null,
        suggestedQuestions: response.suggestedQuestions ?? [],
        isRefusal: response.isRefusal ?? false,
      },
      { status: 200, headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    unstable_rethrow(error);
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    // Safe error handling: never leak stack traces or internal details to the client
    console.error("Unhandled error in HR Assistant Chat API:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request. Please try again later." },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
