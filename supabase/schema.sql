-- Run this once in Supabase: SQL Editor > New query > paste > Run.

-- 1. Profiles table (one row per auth user) -------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  username    text not null,
  email       text not null,
  role        text not null default 'USER'    check (role   in ('SUPERADMIN', 'ADMIN', 'USER')),
  status      text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'BLOCKED')),
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));
create unique index if not exists profiles_email_key    on public.profiles (lower(email));

-- 2. Create the profile automatically on sign-up --------------------------
-- Role and status are fixed here. Anything the browser sends is ignored,
-- so a registration can never grant Admin or Superadmin access.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    new.email,
    'USER',
    'PENDING'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Row Level Security ---------------------------------------------------
-- Users can read only their own profile. No insert/update/delete policies exist,
-- so the browser cannot change roles or statuses. Admin policies come with the
-- Superadmin / User Management stage.
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 4. Helper functions used by the login and registration pages ------------
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

-- Lets people log in with a username by looking up the matching email.
create or replace function public.get_login_email(p_identifier text)
returns text
language sql
security definer
set search_path = ''
as $$
  select email from public.profiles where lower(username) = lower(p_identifier) limit 1;
$$;

revoke all on function public.username_available(text) from public;
revoke all on function public.get_login_email(text)    from public;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.get_login_email(text)    to anon, authenticated;

-- 5. Create your first Superadmin ------------------------------------------
-- Register normally through register.html, confirm the email if required, then run:
-- update public.profiles set role = 'SUPERADMIN', status = 'ACTIVE' where email = 'you@example.com';
