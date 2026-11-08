import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function LeaveManagementPage() {
  return (
    <PlaceholderView
      title="Company Leave Operations"
      description="Administer organization-wide leave categories, annual accrual schedules, and company-wide statutory holidays."
      category="People Operations"
      targetPhase="Phase 2 (Workforce Admin)"
      permittedRoles={["HR", "Admin"]}
      icon="🗓️"
    />
  );
}
