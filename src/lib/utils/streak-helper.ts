import { getLocalDateString } from "./index";

/**
 * Calculates the timezone-aware learning streak updates based on the last activity completion timestamp.
 *
 * @param lastRewardCreatedAt ISO timestamp of the last activity reward
 * @param currentStreak The child's current streak count from their profile
 * @param longestStreak The child's longest historical streak count from their profile
 * @param timezone The local timezone (default: "Asia/Kolkata")
 */
export function calculateUpdatedStreak(
  lastRewardCreatedAt: string | undefined | null,
  currentStreak: number,
  longestStreak: number,
  timezone: string = "Asia/Kolkata"
): { currentStreak: number; longestStreak: number } {
  const todayStr = getLocalDateString(new Date(), timezone);
  let updatedCurrent = currentStreak;
  let updatedLongest = longestStreak;

  if (lastRewardCreatedAt) {
    const lastDateStr = getLocalDateString(new Date(lastRewardCreatedAt), timezone);

    if (lastDateStr === todayStr) {
      if (updatedCurrent === 0) updatedCurrent = 1;
    } else {
      const lastDate = new Date(lastDateStr + "T12:00:00");
      const todayDate = new Date(todayStr + "T12:00:00");

      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        updatedCurrent += 1;
      } else {
        updatedCurrent = 1;
      }
    }
  } else {
    updatedCurrent = 1;
  }

  if (updatedCurrent > updatedLongest) {
    updatedLongest = updatedCurrent;
  }

  return { currentStreak: updatedCurrent, longestStreak: updatedLongest };
}
export default calculateUpdatedStreak;
