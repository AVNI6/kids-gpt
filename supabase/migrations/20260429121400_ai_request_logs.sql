create table public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  api_provider varchar,
  api_model varchar,
  provider_status public.provider_status,
  safety_ratings jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists ai_request_logs_set_updated_at on public.ai_request_logs;
create trigger ai_request_logs_set_updated_at
before update on public.ai_request_logs
for each row
execute function public.set_updated_at();
