create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profile (user_id),
  session_id uuid references public.chat_sessions (id),
  sender_role public.sender_role,
  content text,
  token_used int,
  response_time_ms int,
  generated_by_model varchar,
  is_flagged boolean,
  attachment_url varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists chat_messages_set_updated_at on public.chat_messages;
create trigger chat_messages_set_updated_at
before update on public.chat_messages
for each row
execute function public.set_updated_at();
