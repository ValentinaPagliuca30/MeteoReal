# Worker

This service is intended to run on Railway and poll Open-Meteo every 30 seconds.

Current state:

- Polls Open-Meteo for a fixed list of cities
- Normalizes rows into the `weather_snapshots` table shape
- Upserts the latest state into Supabase every 30 seconds

## Required environment variables

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
```

Use the service role key only in the worker, never in the frontend.
