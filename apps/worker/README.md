# Worker

This service is intended to run on Railway and poll ESPN every 30 seconds.

Current state:

- Polls ESPN's NBA scoreboard endpoint
- Normalizes rows into the `games` table shape
- Upserts the latest state into Supabase every 30 seconds

## Required environment variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ESPN_SCOREBOARD_URL=https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
```

Use the service role key only in the worker, never in the frontend.
