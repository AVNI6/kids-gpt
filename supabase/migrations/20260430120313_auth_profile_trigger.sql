ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS email varchar;

create or replace function public.handle_new_user()
returns trigger as $$
begin 
    insert into public.profile(
       user_id,
       role,
       total_experience_points,
       current_streak,
       longest_streak
    )
    values (
        new.id,
        'parent'::public.user_role, -- FIXED: Changed to single quotes
        0,
        0,
        0
    );
    return new;
end;
$$ language plpgsql security definer;


drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();