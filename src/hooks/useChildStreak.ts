import { useCallback } from "react";

// Pure functions that can be used in both Server and Client Components
export function getSafeStreak(streak: number | null | undefined): number {
  return streak ?? 0;
}

export function getStreakDescription(streak: number | null | undefined): string {
  const activeStreak = getSafeStreak(streak);
  if (activeStreak === 0) return "No active streak";
  if (activeStreak === 1) return "1 day straight!";
  return `${activeStreak} days straight!`;
}

export interface MinimalChildProfile {
  current_streak?: number | null;
}

/**
 * Calculates the maximum current streak across a group of linked children
 */
export function getMaxStreak(children: MinimalChildProfile[] | null | undefined): number {
  if (!children || children.length === 0) return 0;
  return children.reduce((max, child) => {
    const childStreak = getSafeStreak(child.current_streak);
    return childStreak > max ? childStreak : max;
  }, 0);
}

export function getStreakEncouragement(streak: number | null | undefined): string {
  const activeStreak = getSafeStreak(streak);
  if (activeStreak === 0) {
    return "Start a learning journey today to begin your streak! 🚀";
  }
  if (activeStreak < 3) {
    return "Great start! Keep learning daily to protect your streak! 🔥";
  }
  if (activeStreak < 7) {
    return "You're on a roll! Consistent daily learning builds awesome habits! 💫";
  }
  return "Incredible dedication! You are a legendary straight-A explorer! 🏆";
}

// React Hook for Client Components
export function useChildStreak() {
  const safeStreak = useCallback((streak: number | null | undefined) => getSafeStreak(streak), []);
  const streakDescription = useCallback(
    (streak: number | null | undefined) => getStreakDescription(streak),
    []
  );
  const maxStreak = useCallback(
    (children: MinimalChildProfile[] | null | undefined) => getMaxStreak(children),
    []
  );
  const streakEncouragement = useCallback(
    (streak: number | null | undefined) => getStreakEncouragement(streak),
    []
  );

  return {
    getSafeStreak: safeStreak,
    getStreakDescription: streakDescription,
    getMaxStreak: maxStreak,
    getStreakEncouragement: streakEncouragement,
  };
}
