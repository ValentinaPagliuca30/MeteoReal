create extension if not exists "pgcrypto";

create table if not exists public.tracked_cities (
  id text primary key,
  city_name text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weather_snapshots (
  id text primary key,
  city_name text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  temperature_c double precision,
  apparent_temperature_c double precision,
  wind_speed_kmh double precision,
  weather_code integer,
  weather_label text,
  is_day boolean,
  observed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  city_id text not null references public.tracked_cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

insert into public.tracked_cities (id, city_name, country_code, latitude, longitude)
values
  ('chicago-us', 'Chicago', 'US', 41.8781, -87.6298),
  ('new-york-us', 'New York', 'US', 40.7128, -74.006),
  ('los-angeles-us', 'Los Angeles', 'US', 34.0522, -118.2437),
  ('miami-us', 'Miami', 'US', 25.7617, -80.1918),
  ('seattle-us', 'Seattle', 'US', 47.6062, -122.3321),
  ('denver-us', 'Denver', 'US', 39.7392, -104.9903),
  ('austin-us', 'Austin', 'US', 30.2672, -97.7431),
  ('boston-us', 'Boston', 'US', 42.3601, -71.0589),
  ('san-francisco-us', 'San Francisco', 'US', 37.7749, -122.4194),
  ('new-orleans-us', 'New Orleans', 'US', 29.9511, -90.0715),
  ('london-gb', 'London', 'GB', 51.5072, -0.1276),
  ('paris-fr', 'Paris', 'FR', 48.8566, 2.3522),
  ('berlin-de', 'Berlin', 'DE', 52.52, 13.405),
  ('rome-it', 'Rome', 'IT', 41.9028, 12.4964),
  ('milan-it', 'Milan', 'IT', 45.4642, 9.19),
  ('madrid-es', 'Madrid', 'ES', 40.4168, -3.7038),
  ('amsterdam-nl', 'Amsterdam', 'NL', 52.3676, 4.9041),
  ('stockholm-se', 'Stockholm', 'SE', 59.3293, 18.0686),
  ('istanbul-tr', 'Istanbul', 'TR', 41.0082, 28.9784),
  ('tokyo-jp', 'Tokyo', 'JP', 35.6764, 139.65),
  ('seoul-kr', 'Seoul', 'KR', 37.5665, 126.978),
  ('bangkok-th', 'Bangkok', 'TH', 13.7563, 100.5018),
  ('singapore-sg', 'Singapore', 'SG', 1.3521, 103.8198),
  ('dubai-ae', 'Dubai', 'AE', 25.2048, 55.2708),
  ('mumbai-in', 'Mumbai', 'IN', 19.076, 72.8777),
  ('sydney-au', 'Sydney', 'AU', -33.8688, 151.2093),
  ('melbourne-au', 'Melbourne', 'AU', -37.8136, 144.9631),
  ('cape-town-za', 'Cape Town', 'ZA', -33.9249, 18.4241),
  ('cairo-eg', 'Cairo', 'EG', 30.0444, 31.2357),
  ('mexico-city-mx', 'Mexico City', 'MX', 19.4326, -99.1332),
  ('sao-paulo-br', 'Sao Paulo', 'BR', -23.5505, -46.6333)
on conflict (id) do nothing;

alter table public.tracked_cities enable row level security;
alter table public.weather_snapshots enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "tracked_cities_readable_by_everyone" on public.tracked_cities;
create policy "tracked_cities_readable_by_everyone"
on public.tracked_cities
for select
to anon, authenticated
using (true);

drop policy if exists "tracked_cities_insertable_by_everyone" on public.tracked_cities;
create policy "tracked_cities_insertable_by_everyone"
on public.tracked_cities
for insert
to anon, authenticated
with check (true);

drop policy if exists "weather_snapshots_readable_by_everyone" on public.weather_snapshots;
create policy "weather_snapshots_readable_by_everyone"
on public.weather_snapshots
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

alter publication supabase_realtime add table public.weather_snapshots;
