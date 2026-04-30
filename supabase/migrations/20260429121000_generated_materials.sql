create table public.generated_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  chat_session_id uuid references public.chat_sessions (id),
  type varchar,
  format varchar,
  file_url varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists generated_materials_set_updated_at on public.generated_materials;
create trigger generated_materials_set_updated_at
before update on public.generated_materials
for each row
execute function public.set_updated_at();
