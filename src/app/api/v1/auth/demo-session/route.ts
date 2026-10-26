import { NextRequest, NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") || "Employee";
  const email = request.nextUrl.searchParams.get("email");

  const where = email ? { email } : { role, isActive: true };
  const user = await prisma.user.findFirst({
    where,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = await createAuthToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId,
  });

  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/leave";
  const targetUrl = new URL(redirectTo, request.url);
  const response = NextResponse.redirect(targetUrl);
  setSessionCookie(response, token);
  return response;
}
