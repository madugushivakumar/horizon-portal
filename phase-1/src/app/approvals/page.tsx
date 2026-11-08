import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function ApprovalsPage() {
  return (
    <PlaceholderView
      title="Team Approvals"
      description="Review, approve, or reject pending team member leave submissions, expense claims, and time adjustments."
      category="Management"
      targetPhase="Phase 2 (Approval Workflows)"
      permittedRoles={["Manager", "Admin"]}
      icon="✓"
    />
  );
}
