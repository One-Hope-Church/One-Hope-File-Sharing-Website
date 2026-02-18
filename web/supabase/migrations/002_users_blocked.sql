-- Allow blocking a user from signing in (OTP will be rejected).
alter table public.users
  add column if not exists blocked boolean not null default false;

comment on column public.users.blocked is 'When true, user cannot sign in (OTP verify returns error).';
