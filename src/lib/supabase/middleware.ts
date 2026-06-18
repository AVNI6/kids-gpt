import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const keepSignedIn = request.cookies.get("keep_signed_in")?.value === "true";
        
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options };
          if (!keepSignedIn && name.startsWith("sb-")) {
            delete cookieOptions.maxAge;
            delete cookieOptions.expires;
          }
          request.cookies.set({ name, value, ...cookieOptions });
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options };
          if (!keepSignedIn && name.startsWith("sb-")) {
            delete cookieOptions.maxAge;
            delete cookieOptions.expires;
          }
          response.cookies.set({ name, value, ...cookieOptions });
        });
      },
    },
  });

  return {
    supabase,
    get response() {
      return response;
    },
  };
};
