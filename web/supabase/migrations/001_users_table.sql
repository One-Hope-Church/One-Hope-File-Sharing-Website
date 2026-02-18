-- One Hope Resources: users table for email+OTP sign-in and role (user/admin).
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor) or via Supabase CLI.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

-- Optional: RLS so only service role can read/write (app uses service role key).
alter table public.users enable row level security;

-- No policy grants access to anon/authenticated; app uses service_role which bypasses RLS.
create policy "No direct access"
  on public.users
  for all
  using (false)
  with check (false);

-- Or restrict to service role by not granting to anon/authenticated:
-- revoke all on public.users from anon, authenticated;
-- grant all on public.users to service_role;

comment on table public.users is 'One Hope Resources app users; role can be toggled between user and admin.';
