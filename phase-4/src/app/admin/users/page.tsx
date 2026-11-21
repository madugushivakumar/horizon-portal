import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function AdminUsersPage() {
  return (
    <PlaceholderView
      title="User Management & RBAC"
      description="Create, invite, deactivate, and assign role-based access control permissions across portal accounts."
      category="Administration"
      targetPhase="Phase 2 (Identity & Access)"
      permittedRoles={["Admin"]}
      icon="🛡️"
    />
  );
}
