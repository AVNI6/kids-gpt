"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { SignInUserInput, SignUpUserInput, UserRole } from "@/types/user";

const VALID_ROLES: UserRole[] = ["kid", "parent", "teacher"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertValidRole(role: string): asserts role is UserRole {
  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error("Invalid role.");
  }
}

export async function signUpUser(input: SignUpUserInput) {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const role = input.role;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  assertValidRole(role);

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
      ...(siteUrl ? { emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding` } : {}),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Enforce Login-First flow even if project settings auto-create a session.
  if (data.session) {
    await supabase.auth.signOut();
  }

  redirect(`/signin?from=signup&role=${role}`);
}

export async function signInUser(input: SignInUserInput) {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}
