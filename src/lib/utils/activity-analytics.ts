export interface ChildActivityLog {
  id: string;
  rewards_amount: number | null;
  description: string | null;
  created_at: string | null;
  source_type: string | null;
  score?: number | null;
}

export interface ActivitySettingItem {
  title: string;
  minutes: number;
}

/**
 * Calculates aggregated learning metrics and mastery values for child activities.
 *
 * @param timeline Array of child activity log items
 * @param activitySettingsList Custom duration configurations for individual activities
 */
export function calculateActivityAnalytics(
  timeline: ChildActivityLog[],
  activitySettingsList: ActivitySettingItem[] = []
): {
  subjectMastery: { math: number; science: number; english: number; coding: number };
  learningTimeMins: number;
  quizAccuracy: number;
} {
  const totalCompleted = timeline.length;

  let mathCount = 0;
  let scienceCount = 0;
  let englishCount = 0;
  let codingCount = 0;

  timeline.forEach((item) => {
    const desc = (item.description ?? "").toLowerCase();
    if (desc.includes("math") || desc.includes("arithmetic") || desc.includes("number")) {
      mathCount++;
    } else if (desc.includes("science") || desc.includes("nature") || desc.includes("space")) {
      scienceCount++;
    } else if (
      desc.includes("english") ||
      desc.includes("spelling") ||
      desc.includes("word") ||
      desc.includes("grammar")
    ) {
      englishCount++;
    } else if (
      desc.includes("coding") ||
      desc.includes("programming") ||
      desc.includes("logic") ||
      desc.includes("puzzle")
    ) {
      codingCount++;
    } else {
      codingCount++; // Default to coding/logic for undefined categories
    }
  });

  const subjectMastery = {
    math: Math.min(100, 20 + mathCount * 20),
    science: Math.min(100, 20 + scienceCount * 20),
    english: Math.min(100, 20 + englishCount * 20),
    coding: Math.min(100, 20 + codingCount * 20),
  };

  let learningTimeMins = 0;
  timeline.forEach((item) => {
    const desc = item.description ?? "";
    const matchedSetting = activitySettingsList.find((s) =>
      desc.toLowerCase().includes(s.title.toLowerCase())
    );
    if (matchedSetting) {
      learningTimeMins += matchedSetting.minutes;
    } else {
      learningTimeMins += 10;
    }
  });

  if (totalCompleted > 0) {
    learningTimeMins += 15;
  }

  let totalScore = 0;
  let scoreCount = 0;
  timeline.forEach((item) => {
    const match = (item.description ?? "").match(/Score:\s*(\d+)%/i);
    if (match && match[1]) {
      totalScore += parseInt(match[1], 10);
      scoreCount++;
    }
  });

  const quizAccuracy =
    scoreCount > 0 ? Math.round(totalScore / scoreCount) : totalCompleted > 0 ? 88 : 0;

  return {
    subjectMastery,
    learningTimeMins,
    quizAccuracy,
  };
}
export default calculateActivityAnalytics;
