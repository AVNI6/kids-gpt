import { createClient } from "@/lib/supabase/server";
import { StudentLearningProfile } from "@/types/common";
import type { JsonObject, JsonValue } from "@/types/json";

type AssignmentInfo = {
  subject: string | null;
  title: string | null;
};

type AssignmentSubmissionWithJoin = {
  score: number | null;
  submission_type: string | null;
  assignment: AssignmentInfo | AssignmentInfo[] | null;
};

type RewardRow = {
  score: number | null;
  source_type: string | null;
  description: string | null;
};

type GeneratedMaterialRowForProfile = {
  format: string | null;
  type: string | null;
  metadata: JsonObject | null;
};

function getMetadataPrompt(metadata: JsonObject | null): string {
  if (!metadata) return "";
  const prompt = metadata["prompt"] as JsonValue | undefined;
  return typeof prompt === "string" ? prompt : "";
}

/**
 * Deterministically aggregates strengths, weaknesses, interests, and preferred learning styles
 * for a student using database metrics.
 */
export async function calculateStudentLearningProfile(studentId: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  preferred_learning_style: string;
}> {
  const supabase = await createClient();

  // 1. Fetch assignment submissions with subject
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select(
      `
      score,
      submission_type,
      assignment:assignments (
        subject,
        title
      )
    `
    )
    .eq("student_user_id", studentId)
    .is("deleted_at", null);

  // 2. Fetch quiz rewards
  const { data: rewards } = await supabase
    .from("rewards")
    .select("score, source_type, description")
    .eq("user_id", studentId);

  // 3. Fetch generated materials
  const { data: materials } = await supabase
    .from("generated_materials")
    .select("format, type, metadata")
    .eq("user_id", studentId);

  // Map of subject/topic to array of scores
  const subjectScores: Record<string, number[]> = {};

  // Learning style tally
  let visualTally = 0;
  let readingTally = 0;
  let interactiveTally = 0;

  // Interest keywords tally
  const interestWords: Record<string, number> = {};
  const stopWords = new Set([
    "completed",
    "score",
    "quiz",
    "assignment",
    "the",
    "and",
    "for",
    "with",
    "pdf",
    "image",
    "test",
    "material",
    "this",
    "your",
    "that",
    "from",
    "about",
    "some",
    "here",
    "read",
    "writing",
    "grade",
    "feedback",
    "correct",
    "answers",
    "first",
    "learning",
    "classroom",
    "activity",
    "lesson",
  ]);

  // Process assignment submissions
  if (submissions) {
    for (const sub of submissions as AssignmentSubmissionWithJoin[]) {
      const score = sub.score;
      const assignment = Array.isArray(sub.assignment)
        ? (sub.assignment[0] ?? null)
        : sub.assignment;
      const subject = assignment?.subject?.toLowerCase() || "general";
      const title = assignment?.title?.toLowerCase() || "";

      if (score !== null && score !== undefined) {
        if (!subjectScores[subject]) subjectScores[subject] = [];
        subjectScores[subject].push(score);
      }

      // Learning style tally
      if (sub.submission_type === "IMAGE") {
        visualTally += 2;
      } else if (sub.submission_type === "PDF" || sub.submission_type === "TEXT") {
        readingTally += 1;
      }

      // Extract interest words
      title.split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (clean.length > 3 && !stopWords.has(clean)) {
          interestWords[clean] = (interestWords[clean] || 0) + 1;
        }
      });
    }
  }

  // Process rewards
  if (rewards) {
    for (const rew of rewards as RewardRow[]) {
      const score = rew.score;
      const subject = rew.source_type?.toLowerCase() || "general";
      const desc = rew.description?.toLowerCase() || "";

      if (score !== null && score !== undefined) {
        if (!subjectScores[subject]) subjectScores[subject] = [];
        subjectScores[subject].push(score);
      }

      interactiveTally += 1; // Voluntary quizzes increment interactive

      // Extract interest words
      desc.split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (clean.length > 3 && !stopWords.has(clean)) {
          interestWords[clean] = (interestWords[clean] || 0) + 1;
        }
      });
    }
  }

  // Process generated materials
  if (materials) {
    for (const mat of materials as GeneratedMaterialRowForProfile[]) {
      if (mat.format?.toLowerCase() === "image" || mat.format?.toLowerCase() === "jpg") {
        visualTally += 3;
      } else if (mat.format?.toLowerCase() === "pdf") {
        readingTally += 2;
      }

      const prompt = getMetadataPrompt(mat.metadata).toLowerCase();
      prompt.split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (clean.length > 3 && !stopWords.has(clean)) {
          interestWords[clean] = (interestWords[clean] || 0) + 2; // Prompt matches carry more weight
        }
      });
    }
  }

  // Calculate strengths and weaknesses based on average scores
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(subjectScores).forEach(([subject, scores]) => {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avg >= 80) {
      strengths.push(subject);
    } else if (avg < 70) {
      weaknesses.push(subject);
    }
  });

  // Calculate preferred learning style
  let preferred_learning_style = "interactive";
  if (visualTally > readingTally && visualTally > interactiveTally) {
    preferred_learning_style = "visual";
  } else if (readingTally > visualTally && readingTally > interactiveTally) {
    preferred_learning_style = "reading";
  }

  // Calculate top 3 interests
  const interests = Object.entries(interestWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  // Fallbacks if arrays are empty
  if (interests.length === 0) {
    interests.push("general exploration");
  }

  return {
    strengths,
    weaknesses,
    interests,
    preferred_learning_style,
  };
}

/**
 * Server-side utility that safely returns a student's learning profile.
 * Auto-creates profile if missing, or recalculates if stale (older than 24h).
 */
export async function getStudentLearningProfile(
  studentId: string
): Promise<StudentLearningProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_learning_profiles")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    console.error("[getStudentLearningProfile] Error fetching learning profile:", error);
    return null;
  }

  if (!data) {
    // Calculate and create new profile
    const calculated = await calculateStudentLearningProfile(studentId);

    const { data: newProfile, error: insertError } = await supabase
      .from("student_learning_profiles")
      .insert({
        student_id: studentId,
        strengths: calculated.strengths,
        weaknesses: calculated.weaknesses,
        interests: calculated.interests,
        preferred_learning_style: calculated.preferred_learning_style,
        last_calculated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[getStudentLearningProfile] Error creating profile in database:", insertError);
      // Fallback in-memory representation to keep system online
      return {
        student_id: studentId,
        strengths: calculated.strengths,
        weaknesses: calculated.weaknesses,
        interests: calculated.interests,
        preferred_learning_style: calculated.preferred_learning_style,
        last_calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return newProfile as StudentLearningProfile;
  }

  // Check if profile is older than 24 hours (stale check)
  const profileAgeMs = Date.now() - new Date(data.last_calculated_at).getTime();
  const ageLimitMs = 24 * 60 * 60 * 1000;

  if (profileAgeMs > ageLimitMs) {
    const calculated = await calculateStudentLearningProfile(studentId);
    const { data: updatedProfile, error: updateError } = await supabase
      .from("student_learning_profiles")
      .update({
        strengths: calculated.strengths,
        weaknesses: calculated.weaknesses,
        interests: calculated.interests,
        preferred_learning_style: calculated.preferred_learning_style,
        last_calculated_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .select()
      .single();

    if (!updateError && updatedProfile) {
      return updatedProfile as StudentLearningProfile;
    }
  }

  return data as StudentLearningProfile;
}
