create table public.daily_usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  subscription_id uuid references public.subscriptions (id),
  usage_date date,
  messages_sent int,
  token_used int,
  pdfs_generated int,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists daily_usage_tracking_set_updated_at on public.daily_usage_tracking;
create trigger daily_usage_tracking_set_updated_at
before update on public.daily_usage_tracking
for each row
execute function public.set_updated_at();
