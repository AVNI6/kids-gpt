import { notFound } from "next/navigation";

import { RoleOnboardingPage } from "@/components/shared/onboarding/role-onboarding-page";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

export default async function OnboardingRoute({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;

  if (!allowedRoles.includes(role as Role)) {
    notFound();
  }

  // All roles are now handled by the unified RoleOnboardingPage.
  return <RoleOnboardingPage role={role as Role} />;
}
