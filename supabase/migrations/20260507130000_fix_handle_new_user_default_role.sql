-- 2026-05-07 13:00:00 UTC
-- Migration: Ensure handle_new_user provisions a safe default profile
-- Sets new auth users to role 'kid' and marks them not onboarded so onboarding can run safely.

-- Replace the trigger function to provision a minimal profile row with safe defaults.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profile (
    user_id,
    email,
    role,
    is_onboarded,
    total_experience_points,
    current_streak,
    longest_streak
  )
  VALUES (
    NEW.id,
    NEW.email,
    'kid'::public.user_role,
    false,
    0,
    0,
    0
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger that calls the function after a new auth user is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
