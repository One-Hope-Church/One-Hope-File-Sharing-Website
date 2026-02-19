-- Add profile columns to users table for profile completion flow.
-- Run in Supabase SQL Editor or via Supabase CLI.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists church_name text,
  add column if not exists church_city text,
  add column if not exists church_state text;

comment on column public.users.first_name is 'User first name from profile completion';
comment on column public.users.last_name is 'User last name from profile completion';
comment on column public.users.phone is 'User phone number';
comment on column public.users.church_name is 'Church/organization name';
comment on column public.users.church_city is 'Church city';
comment on column public.users.church_state is 'Church state';
