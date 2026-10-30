import React from "react";
import { LeaveApprovalQueue } from "@/components/approvals/LeaveApprovalQueue";

export default function ApprovalsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <LeaveApprovalQueue />
    </div>
  );
}
