create table public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  notification varchar,
  source_id uuid,
  reason varchar,
  resolved boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists safety_alerts_set_updated_at on public.safety_alerts;
create trigger safety_alerts_set_updated_at
before update on public.safety_alerts
for each row
execute function public.set_updated_at();
