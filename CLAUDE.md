# NBA Scoreboard System

This repository is a two-service monorepo for a live sports dashboard.

## Services

- `apps/web`: Next.js frontend deployed to Vercel
- `apps/worker`: background polling service deployed to Railway
- `Supabase`: Postgres database, row storage, and Realtime subscriptions

## Expected production flow

1. The worker polls ESPN every 30 seconds for live NBA scoreboard data.
2. The worker transforms the response into a stable `games` record shape.
3. The worker upserts those records into Supabase.
4. Supabase Realtime broadcasts changes to subscribed frontend clients.
5. The frontend renders the latest game state for all connected users.

## Development goals

- Keep the worker idempotent so repeated polls only update changed rows.
- Keep the frontend read-only; all ingestion logic belongs in the worker.
- Use environment variables for ESPN, Supabase URL, and Supabase service keys.
- Prefer one canonical `games` table that represents current scoreboard state.
- Use `favorites` for per-user saved teams with RLS scoped to `auth.uid()`.

## Deployment shape

- Vercel hosts `apps/web`
- Railway hosts `apps/worker`
- Supabase hosts Postgres + Realtime

## Suggested table

`games`

- `id`
- `status`
- `home_team`
- `away_team`
- `scores`
- `game_clock`
- `logos`
- `updated_at`

`favorites`

- `user_id`
- `team_abbr`
