import { createClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 30_000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPEN_METEO_BASE_URL =
  process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1/forecast";

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

function parseNullableNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function labelWeather(code, isDay) {
  switch (code) {
    case 0:
      return isDay ? "Clear sky" : "Clear night";
    case 1:
    case 2:
      return "Mostly clear";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
      return "Drizzle";
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
    case 73:
    case 75:
    case 77:
      return "Snow";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
    case 96:
    case 99:
      return "Thunderstorm";
    default:
      return "Unknown";
  }
}

async function fetchCurrentWeather(city) {
  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "weather-pulse-worker/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed for ${city.id} with status ${response.status}`,
    );
  }

  return response.json();
}

async function upsertSnapshots(rows) {
  const { error } = await supabase.from("weather_snapshots").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function loadTrackedCities() {
  const { data, error } = await supabase
    .from("tracked_cities")
    .select("id, city_name, country_code, latitude, longitude")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function pollWeather() {
  const timestamp = new Date().toISOString();
  console.log(`[worker] poll started at ${timestamp}`);

  const cities = await loadTrackedCities();

  if (cities.length === 0) {
    console.log("[worker] no tracked cities found");
    return;
  }

  const rows = await Promise.all(
    cities.map(async (city) => {
      const payload = await fetchCurrentWeather(city);
      const current = payload.current ?? {};
      const weatherCode = parseNullableNumber(current.weather_code);

      return {
        id: city.id,
        city_name: city.city_name,
        country_code: city.country_code,
        latitude: city.latitude,
        longitude: city.longitude,
        temperature_c: parseNullableNumber(current.temperature_2m),
        apparent_temperature_c: parseNullableNumber(current.apparent_temperature),
        wind_speed_kmh: parseNullableNumber(current.wind_speed_10m),
        weather_code: weatherCode,
        weather_label: labelWeather(weatherCode, current.is_day === 1),
        is_day: current.is_day === 1,
        observed_at: current.time ? new Date(current.time).toISOString() : null,
        updated_at: new Date().toISOString(),
      };
    }),
  );

  await upsertSnapshots(rows);
  console.log(`[worker] upserted ${rows.length} weather rows`);
}

async function run() {
  await pollWeather();

  setInterval(() => {
    pollWeather().catch((error) => {
      console.error("[worker] poll failed", error);
    });
  }, POLL_INTERVAL_MS);
}

run().catch((error) => {
  console.error("[worker] fatal startup error", error);
  process.exit(1);
});
