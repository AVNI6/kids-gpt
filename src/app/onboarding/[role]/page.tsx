import { notFound, redirect } from "next/navigation";

import { RoleOnboardingPage } from "../../../components/onboarding/role-onboarding-page";

type Role = "parent" | "kid" | "teacher";
type NonKidRole = "parent" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

export default async function OnboardingRoute({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;

  if (!allowedRoles.includes(role as Role)) {
    notFound();
  }

  // Kid onboarding has a dedicated route and UI implementation.
  if (role === "kid") {
    redirect("/onboarding/kid");
  }

  return <RoleOnboardingPage role={role as NonKidRole} />;
}
