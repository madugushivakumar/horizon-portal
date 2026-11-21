/**
 * Horizon Portal — Workload & Capacity Route
 * src/app/capacity/page.tsx
 *
 * Primary route for the enterprise Workload & Capacity view:
 * - Server-side authentication and session verification.
 * - Persistent AppShell layout with active role awareness.
 * - Pre-loads role-scoped sprints and teams for zero-delay filter readiness.
 * - Renders interactive CapacityDashboard client component.
 */

import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server-session";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { CapacityDashboard } from "@/components/capacity/CapacityDashboard";
import { prisma } from "@/lib/prisma";
import { resolveUserCapacityScope } from "@/lib/capacity/auth";
import { calculateWorkingDaysInRange, formatDateToISOString } from "@/lib/capacity/working-days";
import { CapacitySprintInfo } from "@/lib/capacity/capacity-types";

export const metadata: Metadata = {
  title: "Workload & Capacity | Horizon Portal",
  description:
    "Monitor team bandwidth, approved leave impact, story point allocations, and prevent workload overload.",
};

export default async function CapacityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Pre-fetch role-scoped filters on server for instant hydration
  const [scope, rawSprints, holidays] = await Promise.all([
    resolveUserCapacityScope(user),
    prisma.sprint.findMany({
      select: {
        id: true,
        sprintName: true,
        startDate: true,
        endDate: true,
        workingDays: true,
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.holiday.findMany({
      select: {
        holidayDate: true,
        date: true,
      },
    }),
  ]);

  const holidayDateStrings = new Set<string>(
    holidays.map((h) => h.holidayDate || formatDateToISOString(h.date))
  );

  let teams: Array<{ id: string; teamName: string }>;

  if (scope.isUnrestricted) {
    teams = await prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
      },
      orderBy: {
        teamName: "asc",
      },
    });
  } else {
    teams = await prisma.team.findMany({
      where: {
        id: { in: scope.authorizedTeamIds },
      },
      select: {
        id: true,
        teamName: true,
      },
      orderBy: {
        teamName: "asc",
      },
    });
  }

  const formattedSprints: CapacitySprintInfo[] = rawSprints.map((s) => {
    const sprintDaysResult = calculateWorkingDaysInRange(
      s.startDate,
      s.endDate,
      holidayDateStrings
    );
    return {
      id: s.id,
      name: s.sprintName,
      startDate: formatDateToISOString(s.startDate),
      endDate: formatDateToISOString(s.endDate),
      workingDays: sprintDaysResult.workingDays,
    };
  });

  const topBarUser: TopBarUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return (
    <AppShell initialUser={topBarUser}>
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <CapacityDashboard
          initialSprints={formattedSprints}
          initialTeams={teams}
          currentUserRole={user.role}
        />
      </main>
    </AppShell>
  );
}
