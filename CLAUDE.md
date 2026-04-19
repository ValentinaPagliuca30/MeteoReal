# Weather Pulse System

This repository is a two-service monorepo for a live weather dashboard.

## Services

- `apps/web`: Next.js frontend deployed to Vercel
- `apps/worker`: background polling service deployed to Railway
- `Supabase`: Postgres database, auth, row storage, and Realtime subscriptions

## Expected production flow

1. The worker polls Open-Meteo every 30 seconds for a fixed list of cities.
2. The worker transforms each response into one stable `weather_snapshots` row.
3. The worker upserts those rows into Supabase.
4. Supabase Realtime broadcasts changes to subscribed frontend clients.
5. The frontend renders all cities for logged-out users and favorite cities for signed-in users.

## Development goals

- Keep the worker idempotent so repeated polls only refresh the current city state.
- Keep the frontend read-only; all ingestion logic belongs in the worker.
- Use environment variables for Open-Meteo, Supabase URL, and Supabase service keys.
- Prefer one canonical `weather_snapshots` table that represents current weather state.
- Use `favorites` for per-user saved cities with RLS scoped to `auth.uid()`.

## Deployment shape

- Vercel hosts `apps/web`
- Railway hosts `apps/worker`
- Supabase hosts Postgres + Realtime

## Suggested table

`weather_snapshots`

- `id`
- `city_name`
- `country_code`
- `latitude`
- `longitude`
- `temperature_c`
- `apparent_temperature_c`
- `wind_speed_kmh`
- `weather_code`
- `weather_label`
- `is_day`
- `observed_at`
- `updated_at`

`favorites`

- `user_id`
- `city_id`
