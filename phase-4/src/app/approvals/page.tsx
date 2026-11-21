import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UnifiedApprovalCenter } from "@/components/approvals/UnifiedApprovalCenter";

export const metadata = {
  title: "Unified Approval Center | Horizon Portal",
  description: "Unified governance and approval workflow for employee leave requests and corporate expense authorizations.",
};

export default function ApprovalsPage() {
  return (
    <AppShell>
      <UnifiedApprovalCenter />
    </AppShell>
  );
}
