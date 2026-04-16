import { createClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 30_000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ESPN_SCOREBOARD_URL =
  process.env.ESPN_SCOREBOARD_URL ||
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickLogo(team) {
  if (!team) {
    return "";
  }

  return team.logo || team.logos?.[0]?.href || team.logos?.[0]?.url || "";
}

function parseClock(status) {
  const type = status?.type;

  if (!type) {
    return null;
  }

  if (type.completed) {
    return "Final";
  }

  const detail = type.detail || "";
  const shortDetail = type.shortDetail || "";

  if (type.state === "pre") {
    return detail || shortDetail || null;
  }

  return shortDetail || detail || null;
}

function normalizeGame(event) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((team) => team.homeAway === "home");
  const away = competitors.find((team) => team.homeAway === "away");

  if (!home || !away) {
    return null;
  }

  return {
    id: String(event.id),
    home_team:
      home.team?.abbreviation ||
      home.team?.shortDisplayName ||
      home.team?.displayName ||
      "HOME",
    away_team:
      away.team?.abbreviation ||
      away.team?.shortDisplayName ||
      away.team?.displayName ||
      "AWAY",
    scores: {
      home: parseNumber(home.score),
      away: parseNumber(away.score),
    },
    status:
      event.status?.type?.description ||
      event.status?.type?.name ||
      event.status?.type?.state ||
      "Scheduled",
    game_clock: parseClock(event.status),
    logos: {
      home: pickLogo(home.team),
      away: pickLogo(away.team),
    },
    updated_at: new Date().toISOString(),
  };
}

async function fetchScoreboard() {
  const response = await fetch(ESPN_SCOREBOARD_URL, {
    headers: {
      "User-Agent": "nba-scoreboard-worker/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN request failed with status ${response.status}`);
  }

  return response.json();
}

async function upsertGames(games) {
  if (games.length === 0) {
    console.log("[worker] no games returned from ESPN");
    return;
  }

  const { error } = await supabase.from("games").upsert(games, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function pollGames() {
  const timestamp = new Date().toISOString();
  console.log(`[worker] poll started at ${timestamp}`);

  const payload = await fetchScoreboard();
  const games = (payload.events || []).map(normalizeGame).filter(Boolean);

  await upsertGames(games);
  console.log(`[worker] upserted ${games.length} game rows`);
}

async function run() {
  await pollGames();

  setInterval(() => {
    pollGames().catch((error) => {
      console.error("[worker] poll failed", error);
    });
  }, POLL_INTERVAL_MS);
}

run().catch((error) => {
  console.error("[worker] fatal startup error", error);
  process.exit(1);
});
