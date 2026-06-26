import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

import { headers } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  // Detect if the request is a prefetch to disable auto token refresh.
  // This prevents background prefetch requests from rotating tokens and invalidating sessions.
  let isPrefetch = false;
  try {
    const headerStore = await headers();
    isPrefetch =
      headerStore.get("purpose") === "prefetch" ||
      headerStore.get("next-router-prefetch") === "1" ||
      headerStore.get("sec-purpose") === "prefetch";
  } catch {
    // Ignore header reading errors if called outside of request context (e.g. build time)
  }

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    auth: {
      autoRefreshToken: !isPrefetch,
      persistSession: false,
    },
  });
};
