import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function LeavePage() {
  return (
    <PlaceholderView
      title="My Leave & Time Off"
      description="View personal annual leave balances, submit vacation requests, and track approval status."
      category="Self Service"
      targetPhase="Phase 2 (Leave Engine)"
      permittedRoles={["Employee"]}
      icon="📅"
    />
  );
}
