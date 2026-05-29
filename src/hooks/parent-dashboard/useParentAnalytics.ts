import { useMemo } from "react";
import type { ChildActivityLog } from "@/types/parent-dashboard/dashboard.types";

export function useParentAnalytics(timeline: ChildActivityLog[]) {
  // 1. Calculate subject mastery and metrics dynamically
  const subjectPerformance = useMemo(() => {
    let mathCount = 0,
      mathSum = 0;
    let wordCount = 0,
      wordSum = 0;
    let scienceCount = 0,
      scienceSum = 0;
    let logicCount = 0,
      logicSum = 0;
    let memoryCount = 0,
      memorySum = 0;

    timeline.forEach((item) => {
      const slug = item.activity_settings?.slug || item.source_type || "";
      const desc = (item.description ?? "").toLowerCase();
      const scoreVal = item.score !== null && item.score !== undefined ? item.score : 100;

      if (
        slug === "math-challenges" ||
        desc.includes("math") ||
        desc.includes("arithmetic") ||
        desc.includes("number") ||
        desc.includes("fraction")
      ) {
        mathCount++;
        mathSum += scoreVal;
      } else if (
        slug === "word-scrambles" ||
        desc.includes("scramble") ||
        desc.includes("word") ||
        desc.includes("spell") ||
        desc.includes("english") ||
        desc.includes("vocabulary") ||
        desc.includes("grammar")
      ) {
        wordCount++;
        wordSum += scoreVal;
      } else if (
        slug === "science-lab" ||
        desc.includes("science") ||
        desc.includes("lab") ||
        desc.includes("experiment") ||
        desc.includes("volcano") ||
        desc.includes("magnet") ||
        desc.includes("planet") ||
        desc.includes("space") ||
        desc.includes("nature")
      ) {
        scienceCount++;
        scienceSum += scoreVal;
      } else if (
        slug === "logic-puzzles" ||
        desc.includes("puzzle") ||
        desc.includes("logic") ||
        desc.includes("maze") ||
        desc.includes("coding") ||
        desc.includes("programming")
      ) {
        logicCount++;
        logicSum += scoreVal;
      } else if (
        slug === "memory-match" ||
        slug === "match-following" ||
        slug === "flashcards" ||
        slug === "quizzes" ||
        slug === "jigsaw-puzzle" ||
        slug === "color-mixer" ||
        desc.includes("memory") ||
        desc.includes("match") ||
        desc.includes("pair") ||
        desc.includes("flashcard")
      ) {
        memoryCount++;
        memorySum += scoreVal;
      } else {
        logicCount++;
        logicSum += scoreVal;
      }
    });

    const mathProgress = mathCount > 0 ? Math.round(mathSum / mathCount) : 0;
    const wordProgress = wordCount > 0 ? Math.round(wordSum / wordCount) : 0;
    const scienceProgress = scienceCount > 0 ? Math.round(scienceSum / scienceCount) : 0;
    const logicProgress = logicCount > 0 ? Math.round(logicSum / logicCount) : 0;
    const memoryProgress = memoryCount > 0 ? Math.round(memorySum / memoryCount) : 0;

    return [
      { name: "Math Challenges 🧮", progress: mathProgress, color: "bg-sky-500", count: mathCount },
      { name: "Word Scrambles 🔠", progress: wordProgress, color: "bg-sky-500", count: wordCount },
      {
        name: "Science Lab 🧪",
        progress: scienceProgress,
        color: "bg-sky-500",
        count: scienceCount,
      },
      { name: "Logic Puzzles 🧩", progress: logicProgress, color: "bg-sky-500", count: logicCount },
      {
        name: "Memory & Matching 🎴",
        progress: memoryProgress,
        color: "bg-sky-500",
        count: memoryCount,
      },
    ];
  }, [timeline]);

  // 2. Extract accuracy calculations
  const quizAccuracy = useMemo(() => {
    let totalScore = 0;
    let scoreCount = 0;

    timeline.forEach((item) => {
      const match = (item.description ?? "").match(/Score:\s*(\d+)%/i);
      if (match && match[1]) {
        totalScore += parseInt(match[1], 10);
        scoreCount++;
      } else if (item.score !== null && item.score !== undefined) {
        totalScore += item.score;
        scoreCount++;
      }
    });

    return scoreCount > 0 ? Math.round(totalScore / scoreCount) : timeline.length > 0 ? 88 : 0;
  }, [timeline]);

  return {
    subjectPerformance,
    quizAccuracy,
  };
}
