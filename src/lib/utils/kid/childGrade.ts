export function displayGrade(standard?: string | null): string {
  if (!standard) return "Student";
  const stdLower = standard.toLowerCase().trim();
  if (
    stdLower.includes("grade") ||
    stdLower.includes("kindergarten") ||
    stdLower.includes("preschool") ||
    stdLower.includes("classroom")
  ) {
    return standard;
  }
  // Standard format standardise
  return `${standard} Grade`;
}
