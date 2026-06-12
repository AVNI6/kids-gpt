-- Harden the auth trigger so it reliably persists the selected role and defaults to kid when missing or invalid.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
AS $$
DECLARE
  role_text text := lower(trim(coalesce(new.raw_user_meta_data->>'role', '')));
  extracted_role public.user_role := 'kid'::public.user_role;
BEGIN
  IF role_text IN ('kid', 'parent', 'teacher') THEN
    extracted_role := role_text::public.user_role;
  END IF;

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
    new.id,
    new.email,
    extracted_role,
    false,
    0,
    0,
    0
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

COMMIT;
