create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  title varchar,
  session_type varchar,
  is_active boolean,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row
execute function public.set_updated_at();
