import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function PayslipsPage() {
  return (
    <PlaceholderView
      title="My Payslips & Tax Documents"
      description="Access encrypted historical earnings statements, tax withholdings, and year-end compensation summaries."
      category="Self Service"
      targetPhase="Phase 2 (Payroll Integration)"
      permittedRoles={["Employee"]}
      icon="📄"
    />
  );
}
