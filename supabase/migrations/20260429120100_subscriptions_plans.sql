create table public.subscriptions_plans (
  id uuid primary key default gen_random_uuid(),
  plan_name varchar,
  plan_type varchar,
  daily_token_limit int,
  monthly_token_limit int,
  max_messages_per_day int,
  max_pdfs_per_day int,
  price int,
  is_active boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists subscriptions_plans_set_updated_at on public.subscriptions_plans;
create trigger subscriptions_plans_set_updated_at
before update on public.subscriptions_plans
for each row
execute function public.set_updated_at();
