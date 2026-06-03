export function calculateAge(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null;

  const birthDate = new Date(birthdate);

  // invalid date check
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // prevent negative ages
  return age >= 0 ? age : null;
}

export function displayAge(birthdate: string | null | undefined): string {
  const age = calculateAge(birthdate);

  if (age === null) return "N/A";

  return age === 1 ? "1 Year Old" : `${age} Years Old`;
}
