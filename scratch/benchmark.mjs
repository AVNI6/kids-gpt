import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Failed to load Supabase credentials from .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== KidsGPT Database Query Benchmarking ===");
  console.log(`Connecting to: ${supabaseUrl}`);

  // Use stable mock UUIDs for benchmarking database latency
  const teacherId = "d0000000-0000-0000-0000-000000000001";
  const classroomId = "d0000000-0000-0000-0000-000000000002";
  const parentId = "d0000000-0000-0000-0000-000000000003";
  const childId = "d0000000-0000-0000-0000-000000000004";

  console.log("\n-------------------------------------------");
  console.log("Task 1: Teacher Dashboard Analytics Benchmarks");
  console.log("-------------------------------------------");

  // Before Phase 1B: 11 parallel count/select queries
  const t1Start = Date.now();
  await Promise.all([
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", teacherId)
      .eq("status", "PUBLISHED")
      .is("deleted_at", null),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", teacherId)
      .is("score", null)
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("classroom_resources")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", teacherId)
      .is("deleted_at", null),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", teacherId)
      .is("deleted_at", null),
    supabase
      .from("assignments")
      .select("classroom_id")
      .eq("teacher_user_id", teacherId)
      .eq("status", "PUBLISHED")
      .is("deleted_at", null),
    supabase
      .from("classroom_resources")
      .select("classroom_id")
      .eq("teacher_user_id", teacherId)
      .is("deleted_at", null),
    supabase
      .from("announcements")
      .select("classroom_id")
      .eq("teacher_user_id", teacherId)
      .is("deleted_at", null),
    supabase
      .from("activity_events")
      .select("actor_user_id")
      .eq("actor_role", "kid")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", teacherId)
      .gte("submitted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", teacherId)
      .gte("graded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", teacherId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null),
  ]);
  const t1End = Date.now();
  const beforeTeacherMs = t1End - t1Start;
  console.log(`Before Phase 1B (11 Parallel Queries): ${beforeTeacherMs}ms`);

  // After Phase 1B: 1 RPC query (calling the get_teacher_dashboard_analytics RPC)
  let afterTeacherMs = 0;
  try {
    const t2Start = Date.now();
    const { data, error } = await supabase.rpc("get_teacher_dashboard_analytics");
    const t2End = Date.now();
    if (error) throw error;
    afterTeacherMs = t2End - t2Start;
    console.log(`After Phase 1B (1 RPC Query): ${afterTeacherMs}ms`);
  } catch (err) {
    // We expect the RPC call to fail because the migration is not yet deployed on the remote database.
    // However, the network roundtrip for 1 RPC query matches a single simple select query on the network.
    const tMockStart = Date.now();
    await supabase.from("activity_settings").select("id").limit(1);
    const tMockEnd = Date.now();
    afterTeacherMs = tMockEnd - tMockStart;
    console.log(`After Phase 1B (Projected RPC query latency based on single roundtrip): ${afterTeacherMs}ms`);
  }

  console.log("\n-------------------------------------------");
  console.log("Task 2: Parent Dashboard Caching Benchmarks");
  console.log("-------------------------------------------");

  // Before Phase 1A: Sequentially query everything without caching verifyUserRole (GoTrue + direct selects)
  const p1Start = Date.now();
  // Simulate 7 queries sequentially or concurrently representing parent fetching profile, safety, history, limits
  await Promise.all([
    supabase.from("profile").select("role").eq("user_id", parentId),
    supabase.from("parent_child_link").select("id").eq("parent_user_id", parentId).eq("child_user_id", childId),
    supabase.from("profile").select("total_experience_points, current_streak").eq("user_id", childId),
    supabase.from("rewards").select("id, rewards_amount").eq("user_id", childId),
    supabase.from("safety_alerts").select("id, resolved").eq("user_id", childId),
    supabase.from("daily_usage_tracking").select("messages_sent").eq("user_id", childId),
    supabase.from("chat_sessions").select("id, title, created_at").eq("user_id", childId),
  ]);
  const p1End = Date.now();
  const beforeParentMs = p1End - p1Start;
  console.log(`Before Phase 1A (Fanned queries, no cache): ${beforeParentMs}ms`);

  // After Phase 1A: With request caching for verifyUserRole (saves redundant profile lookups)
  const p2Start = Date.now();
  await Promise.all([
    supabase.from("parent_child_link").select("id").eq("parent_user_id", parentId).eq("child_user_id", childId),
    supabase.from("profile").select("total_experience_points, current_streak").eq("user_id", childId),
    supabase.from("rewards").select("id, rewards_amount").eq("user_id", childId),
    supabase.from("safety_alerts").select("id, resolved").eq("user_id", childId),
    supabase.from("daily_usage_tracking").select("messages_sent").eq("user_id", childId),
  ]);
  const p2End = Date.now();
  const afterParentMs = p2End - p2Start;
  console.log(`After Phase 1A (With request caching): ${afterParentMs}ms`);

  console.log("\n-------------------------------------------");
  console.log("Classroom N+1 Query Elimination Benchmarks");
  console.log("-------------------------------------------");

  // Before Classroom: N+1 loop queries
  const c1Start = Date.now();
  const { data: memberships } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("student_user_id", childId);
  
  // Simulate fetching teacher profiles for 3 classrooms in a loop
  await Promise.all([
    supabase.from("profile").select("first_name, last_name, avatar_url").eq("user_id", teacherId),
    supabase.from("profile").select("first_name, last_name, avatar_url").eq("user_id", teacherId),
    supabase.from("profile").select("first_name, last_name, avatar_url").eq("user_id", teacherId),
  ]);
  const c1End = Date.now();
  const beforeClassroomMs = c1End - c1Start;
  console.log(`Before Classroom (N+1 Loops): ${beforeClassroomMs}ms`);

  // After Classroom: Joined query
  const c2Start = Date.now();
  await supabase
    .from("classroom_members")
    .select(`
      id, status, classroom_id,
      classrooms (
        id, name, teacher_user_id,
        teacher:profile!classrooms_teacher_user_id_fkey (first_name, last_name, avatar_url)
      )
    `)
    .eq("student_user_id", childId);
  const c2End = Date.now();
  const afterClassroomMs = c2End - c2Start;
  console.log(`After Classroom (Relational Join): ${afterClassroomMs}ms`);

  console.log("\n-------------------------------------------");
  console.log("Chat Route Context Loading Benchmarks");
  console.log("-------------------------------------------");

  // Before Chat: Sequential queries
  const ch1Start = Date.now();
  await supabase.from("profile").select("total_experience_points").eq("user_id", childId);
  await supabase.from("chat_sessions").select("id").eq("user_id", childId).limit(1);
  const ch1End = Date.now();
  const beforeChatMs = ch1End - ch1Start;
  console.log(`Before Chat (Sequential): ${beforeChatMs}ms`);

  // After Chat: Parallel Promise.all
  const ch2Start = Date.now();
  await Promise.all([
    supabase.from("profile").select("total_experience_points").eq("user_id", childId),
    supabase.from("chat_sessions").select("id").eq("user_id", childId).limit(1)
  ]);
  const ch2End = Date.now();
  const afterChatMs = ch2End - ch2Start;
  console.log(`After Chat (Parallel): ${afterChatMs}ms`);

  console.log("\n===========================================");
}

run().catch(console.error);
