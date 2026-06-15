/**
 * Parses a YYYY-MM-DD date string using the local time constructor to avoid UTC shifting.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date(NaN);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-based index
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Formats a Date object as YYYY-MM-DD in the local timezone.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAge(
  birthdate: string | Date | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!birthdate) return null;

  let birthDate: Date;
  if (birthdate instanceof Date) {
    birthDate = birthdate;
  } else if (typeof birthdate === "string") {
    if (birthdate.includes("-")) {
      birthDate = parseLocalDate(birthdate);
    } else {
      birthDate = new Date(birthdate);
    }
  } else {
    return null;
  }

  // invalid date check
  if (isNaN(birthDate.getTime())) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
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
