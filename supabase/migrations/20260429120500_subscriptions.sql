create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  plan_id uuid references public.subscriptions_plans (id),
  stripe_customer_id varchar,
  stripe_subscription_id varchar,
  status public.subscription_status,
  plan_type varchar,
  price int,
  expired_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();
