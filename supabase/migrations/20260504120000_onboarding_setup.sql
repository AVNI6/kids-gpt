-- Add onboarding columns to profile table
ALTER TABLE public.profile 
ADD COLUMN IF NOT EXISTS is_onboarded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS connection_code varchar UNIQUE;

-- Create an index on connection_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_connection_code 
ON public.profile(connection_code) 
WHERE connection_code IS NOT NULL;

-- Update the handle_new_user() trigger to extract role from metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  extracted_role public.user_role;
begin 
  -- Extract role from metadata, default to 'kid' if not provided or invalid
  extracted_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'kid'::public.user_role
  );
  
  -- Handle invalid role values gracefully
  if extracted_role is null then
    extracted_role := 'kid'::public.user_role;
  end if;

  insert into public.profile(
    user_id,
    role,
    is_onboarded,
    total_experience_points,
    current_streak,
    longest_streak
  )
  values (
    new.id,
    extracted_role,
    false,
    0,
    0,
    0
  );
  
  return new;
end;
$$ language plpgsql security definer;
