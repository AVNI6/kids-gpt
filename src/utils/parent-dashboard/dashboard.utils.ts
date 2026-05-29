export function getInitials(firstName: string | null, lastName: string | null): string {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "P";
}

export function formatDisplayName(profile: {
  first_name: string | null;
  last_name: string | null;
}): string {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Parent";
}
