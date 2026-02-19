-- User saved/bookmarked resources. Links Supabase users to Sanity document IDs.
create table if not exists public.user_saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sanity_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, sanity_id)
);

create index if not exists user_saved_resources_user_id_idx on public.user_saved_resources(user_id);

-- RLS: app uses service_role which bypasses RLS.
alter table public.user_saved_resources enable row level security;

create policy "No direct access"
  on public.user_saved_resources
  for all
  using (false)
  with check (false);

comment on table public.user_saved_resources is 'User bookmarked/saved resources; sanity_id references Sanity resource or collectionResource _id.';
