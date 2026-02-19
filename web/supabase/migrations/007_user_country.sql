-- Add country column for international churches.
-- Run in Supabase SQL Editor or via Supabase CLI.

alter table public.users
  add column if not exists country text;

comment on column public.users.country is 'Country (US, CA, GB, AU, OTHER)';
