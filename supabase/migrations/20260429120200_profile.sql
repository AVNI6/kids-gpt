create table public.profile (
  user_id uuid primary key,
  first_name varchar,
  last_name varchar,
  username varchar,
  date_of_birth date,
  mobile_no varchar,
  avatar_url varchar,
  role public.user_role,
  total_experience_points int,
  current_streak int,
  longest_streak int,
  standard varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists profile_set_updated_at on public.profile;
create trigger profile_set_updated_at
before update on public.profile
for each row
execute function public.set_updated_at();
