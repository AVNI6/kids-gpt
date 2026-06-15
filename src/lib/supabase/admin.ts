import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env variable");
  }

  if (!serviceRoleKey) {
    console.warn(
      "[createAdminClient] WARNING: No Supabase service role/secret key was found in environment variables (checked SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY, SUPABASE_SECRET_KEY). Falling back to publishable key, which will enforce RLS restrictions."
    );
  }

  const finalKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!finalKey) {
    throw new Error(
      "Missing Supabase key env variable (neither service/secret key nor NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is defined)"
    );
  }

  return createClient(supabaseUrl, finalKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
