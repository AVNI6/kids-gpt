import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Sync the raw Cookie header string explicitly to the request headers
        // so downstream Server Components / Route Handlers read the new session cookies.
        const requestHeaders = new Headers(request.headers);
        const cookieString = request.cookies
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join("; ");
        requestHeaders.set("Cookie", cookieString);

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
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

export const updateSession = async (request: NextRequest) => {
  const client = createClient(request);
  await client.supabase.auth.getUser();
  return client.response;
};
