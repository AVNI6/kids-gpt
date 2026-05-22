/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  // Get a kid user
  const { data: users } = await supabase
    .from("profile")
    .select("user_id")
    .eq("role", "kid")
    .limit(1);
  if (!users || users.length === 0) {
    console.log("No kid users found");
    return;
  }

  const userId = users[0].user_id;
  console.log("Testing for user:", userId);

  // Check current streak
  const { data: profile1 } = await supabase
    .from("profile")
    .select("current_streak")
    .eq("user_id", userId)
    .single();
  console.log("Current streak before:", profile1.current_streak);

  // Call RPC
  const { data, error } = await supabase.rpc("save_kid_activity_progress", {
    p_user_id: userId,
    p_activity_slug: "math-challenges",
    p_activity_title: "Math Challenges",
    p_score_str: "100%",
  });

  console.log("RPC Data:", data);
  console.log("RPC Error:", error);

  // Check current streak after
  const { data: profile2 } = await supabase
    .from("profile")
    .select("current_streak")
    .eq("user_id", userId)
    .single();
  console.log("Current streak after:", profile2.current_streak);
}

test();
