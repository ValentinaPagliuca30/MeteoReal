# NBA Scoreboard

Monorepo for a live sports dashboard:

- `apps/web`: Next.js frontend intended for Vercel
- `apps/worker`: polling worker intended for Railway
- `Supabase`: database + Realtime fan-out layer

## Architecture

1. The Railway worker polls the ESPN NBA scoreboard endpoint every 30 seconds.
2. The worker normalizes live game data and upserts the current state into Supabase.
3. Supabase Realtime pushes row changes to subscribed clients.
4. The Next.js app renders the latest scoreboard and updates without refresh.

## Local commands

```bash
npm run dev:web
npm run build:web
npm run lint:web
npm run dev:worker
```

## Next steps

- Add Supabase project credentials to both apps
- Create a `games` table and enable Realtime
- Replace mock scoreboard data in the frontend with a live subscription
- Implement ESPN polling + Supabase upsert in the worker
- Push the repo to GitHub

## Supabase setup

The SQL for the database schema, RLS, and Realtime publication is in
`supabase/schema.sql`.

Apply it in Supabase SQL Editor, then confirm:

- `games` is in Database -> Replication
- Auth is enabled for your project
- `apps/web/.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`
- `apps/web/.env.local` contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`
