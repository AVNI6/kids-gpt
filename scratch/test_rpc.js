/* eslint-disable @typescript-eslint/no-require-imports */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://tytlgaxulpqfrkvnekfr.supabase.co",
  "sb_publishable_YE2l44RrCWmj8agKCIg6Bw_vOU80RE1"
);

async function testRpc() {
  console.log("Testing link_users_by_email...");

  // Test with a dummy current_user_id and a dummy email.
  // We expect it to return "Current user not found or missing role" or similar
  // since the UUID doesn't exist, proving the new logic is active.
  const { data, error } = await supabase.rpc("link_users_by_email", {
    p_current_user_id: "00000000-0000-0000-0000-000000000000",
    p_target_email: "nonexistent@example.com",
  });

  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Response:", data);
  }
}

testRpc();
