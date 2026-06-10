import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const getEnvVar = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};
const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const tables = ["activity_settings", "profile", "classrooms", "parent_child_link", "rewards"];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`Table ${table}: Error - ${error.message}`);
    } else {
      console.log(`Table ${table}: Success - found ${data.length} rows`);
    }
  }
}
test();
