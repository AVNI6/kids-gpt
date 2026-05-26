create table public.teacher_student_links (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid references public.profile (user_id),
  student_user_id uuid references public.profile (user_id),
  class_code varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists teacher_student_links_set_updated_at on public.teacher_student_links;
create trigger teacher_student_links_set_updated_at
before update on public.teacher_student_links
for each row
execute function public.set_updated_at();
