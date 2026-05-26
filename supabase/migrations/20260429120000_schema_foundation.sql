create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'provider_status') then
    create type public.provider_status as enum ('success', 'failed', 'fallback_used');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active', 'cancelled', 'expired', 'trial');
  end if;

  if not exists (select 1 from pg_type where typname = 'sender_role') then
    create type public.sender_role as enum ('user', 'model');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('kid', 'parent', 'teacher');
  end if;

  if not exists (select 1 from pg_type where typname = 'permission_category') then
    create type public.permission_category as enum ('chat', 'learn', 'game', 'social', 'account', 'safety');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
