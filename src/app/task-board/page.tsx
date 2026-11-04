/**
 * Horizon Portal — Team Task Board Route
 * src/app/task-board/page.tsx
 *
 * Primary route for the enterprise Kanban Team Task Board:
 * - Server-side authentication and session verification.
 * - Persistent AppShell layout with active role awareness.
 * - Pre-loads actual database teams and sprints for zero-delay filter readiness.
 * - Renders interactive TaskBoard client component.
 */

import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server-session";
import { AppShell } from "@/components/layout/AppShell";
import { TopBarUser } from "@/components/layout/TopBar";
import { TaskBoard } from "@/components/task-board/TaskBoard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Team Task Board | Horizon Portal",
  description:
    "Manage team tasks, track sprint progress, and monitor work across your organization.",
};

export default async function TaskBoardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Pre-fetch actual database teams and sprints on the server for instant filter availability
  const [teams, sprints] = await Promise.all([
    prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
      },
      orderBy: {
        teamName: "asc",
      },
    }),
    prisma.sprint.findMany({
      select: {
        id: true,
        sprintName: true,
      },
      orderBy: {
        startDate: "desc",
      },
    }),
  ]);

  const topBarUser: TopBarUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return (
    <AppShell initialUser={topBarUser}>
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <TaskBoard
          initialTeams={teams}
          initialSprints={sprints}
          currentUserRole={user.role}
        />
      </main>
    </AppShell>
  );
}
