create extension if not exists "pgcrypto";

create table if not exists public.games (
  id text primary key,
  home_team text not null,
  away_team text not null,
  scores jsonb not null default '{"home": 0, "away": 0}'::jsonb,
  status text not null,
  game_clock text,
  logos jsonb not null default '{"home": "", "away": ""}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  team_abbr text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, team_abbr)
);

alter table public.games enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "games_readable_by_everyone" on public.games;
create policy "games_readable_by_everyone"
on public.games
for select
to anon, authenticated
using (true);

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own"
on public.favorites
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

alter publication supabase_realtime add table public.games;
