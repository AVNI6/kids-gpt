import { useCallback } from "react";

// Pure functions that can be used in Server Components
export function getSafeXP(xp: number | null | undefined): number {
  return xp ?? 0;
}

export function getLevel(xp: number | null | undefined): number {
  return Math.floor(getSafeXP(xp) / 100) + 1;
}

export function getLevelTitle(xp: number | null | undefined): string {
  const points = getSafeXP(xp);
  if (points >= 5000) return "Legendary Genius";
  if (points >= 4000) return "Ultimate Champion";
  if (points >= 3000) return "Master Innovator";
  if (points >= 2000) return "Elite Achiever";
  if (points >= 1500) return "Advanced Mastery";
  if (points >= 1000) return "Skilled Performer";
  if (points >= 700) return "Smart Explorer";
  if (points >= 500) return "Curious Explorer";
  if (points >= 300) return "Rising Learner";
  if (points >= 150) return "Active Participant";
  if (points >= 50) return "Beginner Adventurer";
  return "Getting Started";
}

// React Hook for Client Components
export function useChildXP() {
  const safeXP = useCallback((xp: number | null | undefined) => getSafeXP(xp), []);
  const level = useCallback((xp: number | null | undefined) => getLevel(xp), []);
  const levelTitle = useCallback((xp: number | null | undefined) => getLevelTitle(xp), []);

  return { getSafeXP: safeXP, getLevel: level, getLevelTitle: levelTitle };
}
