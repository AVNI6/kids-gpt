create table public.kid_permissions_default (
  id uuid primary key default gen_random_uuid(),
  granted_by_user_id uuid references public.profile (user_id),
  category public.permission_category,
  is_allowed boolean,
  default_allowed boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists kid_permissions_default_set_updated_at on public.kid_permissions_default;
create trigger kid_permissions_default_set_updated_at
before update on public.kid_permissions_default
for each row
execute function public.set_updated_at();
