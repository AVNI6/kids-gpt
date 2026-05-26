create table public.parent_child_link (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid references public.profile (user_id),
  child_user_id uuid references public.profile (user_id),
  is_approved boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists parent_child_link_set_updated_at on public.parent_child_link;
create trigger parent_child_link_set_updated_at
before update on public.parent_child_link
for each row
execute function public.set_updated_at();
