-- Log user downloads for "Recently downloaded" feature.
create table if not exists public.user_download_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sanity_id text not null,
  downloaded_at timestamptz not null default now()
);

create index if not exists user_download_log_user_id_idx on public.user_download_log(user_id);
create index if not exists user_download_log_user_downloaded_idx on public.user_download_log(user_id, downloaded_at desc);

alter table public.user_download_log enable row level security;

create policy "No direct access"
  on public.user_download_log
  for all
  using (false)
  with check (false);

comment on table public.user_download_log is 'Log of user downloads for Recently downloaded feature; sanity_id is resource or collectionResource _id.';
