"use server";

import { processActivityCompletion } from "@/lib/services/kid/rewards.actions";

/**
 * Server Action to securely claim XP for completing a Jigsaw Puzzle.
 * Delegates the validation, streak logic, DB upserts, alerts, and cache revalidation
 * to the centralized `processActivityCompletion` action.
 */
export async function claimJigsawXp(
  activityId?: string,
  gridSize?: number,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string }> {
  const result = await processActivityCompletion({
    activitySlug: "jigsaw-puzzle",
    activityTitle: "Jigsaw Puzzle",
    timezone,
    jigsawGridSize: gridSize,
    jigsawThemeName: activityId,
  });

  return {
    success: result.success,
    error: result.error,
  };
}
