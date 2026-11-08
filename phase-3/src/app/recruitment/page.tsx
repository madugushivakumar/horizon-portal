import React from "react";
import PlaceholderView from "@/components/layout/PlaceholderView";

export default function RecruitmentPage() {
  return (
    <PlaceholderView
      title="Recruitment & Onboarding"
      description="Manage active job openings, applicant pipelines, interview stages, and automated onboarding checklists."
      category="People Operations"
      targetPhase="Phase 2 (Talent Acquisition)"
      permittedRoles={["HR", "Admin"]}
      icon="🤝"
    />
  );
}
