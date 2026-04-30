create table public.activity_templates (
  id uuid primary key default gen_random_uuid(),
  category varchar,
  activity_type varchar,
  base_prompt text,
  visual_layout_type varchar,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  deleted_at timestamp
);

drop trigger if exists activity_templates_set_updated_at on public.activity_templates;
create trigger activity_templates_set_updated_at
before update on public.activity_templates
for each row
execute function public.set_updated_at();
