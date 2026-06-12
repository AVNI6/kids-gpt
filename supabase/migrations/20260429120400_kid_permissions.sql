create table public.kid_permissions (
  id uuid primary key default gen_random_uuid(),
  default_id uuid references public.kid_permissions_default (id),
  kid_user_id uuid references public.profile (user_id),
  granted_by_user_id uuid references public.profile (user_id),
  is_allowed boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists kid_permissions_set_updated_at on public.kid_permissions;
create trigger kid_permissions_set_updated_at
before update on public.kid_permissions
for each row
execute function public.set_updated_at();
