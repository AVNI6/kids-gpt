create table public.whole_usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  subscription_id uuid references public.subscriptions (id),
  usage_date date,
  total_token_used int,
  tokens_remaining int,
  messages_sent int,
  pdfs_generated int,
  total_session_duration_ms int,
  limit_reached boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists whole_usage_tracking_set_updated_at on public.whole_usage_tracking;
create trigger whole_usage_tracking_set_updated_at
before update on public.whole_usage_tracking
for each row
execute function public.set_updated_at();
