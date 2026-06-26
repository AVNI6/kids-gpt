import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const client = createClient(request);

  await client.supabase.auth.getUser();

  const response = client.response;
  response.headers.set("x-middleware-cache", "no-cache");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
