create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  rewards_amount int,
  source_type varchar,
  source_id uuid,
  description varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
before update on public.rewards
for each row
execute function public.set_updated_at();
