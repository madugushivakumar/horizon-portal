import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function TeamPage() {
  return (
    <PlaceholderView
      title="Team Performance & Reports"
      description="Track direct reports headcount, performance review milestones, and team availability schedules."
      category="Management"
      targetPhase="Phase 2 (Team Analytics)"
      permittedRoles={["Manager", "Admin"]}
      icon="📊"
    />
  );
}
