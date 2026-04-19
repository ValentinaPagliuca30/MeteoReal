# Weather Pulse

Monorepo for a live weather dashboard:

- `apps/web`: Next.js frontend intended for Vercel
- `apps/worker`: polling worker intended for Railway
- `Supabase`: database + Realtime fan-out layer

## Architecture

1. The Railway worker polls Open-Meteo every 30 seconds for tracked cities.
2. The worker normalizes current conditions and upserts the current state into Supabase.
3. Supabase Realtime pushes row changes to subscribed clients.
4. The Next.js app renders the latest weather cards and updates without refresh.

## Local commands

```bash
npm run dev:web
npm run build:web
npm run lint:web
npm run dev:worker
```

## Next steps

- Add Supabase project credentials to both apps
- Run `supabase/schema.sql`
- Enable Auth and Realtime in Supabase
- Verify the worker writes into `weather_snapshots`
- Push the repo to GitHub

## Supabase setup

The SQL for the database schema, RLS, and Realtime publication is in
`supabase/schema.sql`.

Apply it in Supabase SQL Editor, then confirm:

- `weather_snapshots` is in Database -> Replication
- Auth is enabled for your project
- `apps/web/.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`
- `apps/web/.env.local` contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `apps/worker/.env` contains `SUPABASE_URL`
- `apps/worker/.env` contains `SUPABASE_SERVICE_ROLE_KEY`
