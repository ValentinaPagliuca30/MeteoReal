"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useUnits } from "@/components/units-provider";
import { cityOptions, getAccentForCity } from "@/lib/city-options";
import { supabase } from "@/lib/supabase";
import type { FavoriteRow, WeatherRow } from "@/lib/types";
import { formatTemp } from "@/lib/units";

function weatherEmoji(code: number | null) {
  if (code === null) return "•";
  if (code === 0) return "☀";
  if (code <= 3) return "⛅";
  if (code <= 55) return "🌫";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄";
  if (code <= 86) return "🌦";
  return "⛈";
}

function weatherOverlayClass(code: number | null) {
  if (code === null) return "";
  if (code === 0 || code <= 2) return "weather-sun";
  if ([45, 48].includes(code)) return "weather-fog";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "weather-snow";
  if ([95, 96, 99].includes(code)) return "weather-storm";
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "weather-rain";
  }
  return "";
}

export function Scoreboard() {
  const { user } = useAuth();
  const { unit } = useUnits();
  const [snapshots, setSnapshots] = useState<WeatherRow[]>([]);
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSnapshots() {
      const { data } = await supabase
        .from("weather_snapshots")
        .select("*")
        .order("city_name", { ascending: true });

      setSnapshots((data as WeatherRow[]) ?? []);
      setLoading(false);
    }

    loadSnapshots();

    const channel = supabase
      .channel("weather_snapshots")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weather_snapshots" },
        loadSnapshots,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setFavoriteCityIds([]);
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select("city_id")
        .eq("user_id", user.id);

      setFavoriteCityIds(((data as FavoriteRow[]) ?? []).map((row) => row.city_id));
    }

    loadFavorites();
  }, [user]);

  const visibleSnapshots = useMemo(() => {
    if (!user || favoriteCityIds.length === 0) {
      return snapshots;
    }

    return snapshots.filter((row) => favoriteCityIds.includes(row.id));
  }, [favoriteCityIds, snapshots, user]);

  const filteredSnapshots = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return visibleSnapshots;
    }

    return visibleSnapshots.filter((row) =>
      `${row.city_name} ${row.country_code}`.toLowerCase().includes(normalized),
    );
  }, [searchQuery, visibleSnapshots]);

  const citySuggestions = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (normalized.length < 2) {
      return [];
    }

    return cityOptions
      .filter((city) =>
        `${city.name} ${city.country}`.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [searchQuery]);

  async function addTrackedCity(city: (typeof cityOptions)[number]) {
    const existing = snapshots.find((row) => row.id === city.id);

    if (existing) {
      setSearchMessage(`${city.name} is already on the dashboard.`);
      return;
    }

    const { error } = await supabase.from("tracked_cities").insert({
      id: city.id,
      city_name: city.name,
      country_code: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    });

    if (error) {
      setSearchMessage(error.message);
      return;
    }

    setSearchMessage(`${city.name} added. Wait one worker poll and it will appear.`);
    setSearchQuery("");
  }

  function weatherCardClasses(code: number | null) {
    if (code === null) return "from-sky-100 via-white to-slate-100";
    if (code === 0 || code <= 2) return "from-yellow-100 via-amber-50 to-orange-100";
    if ([45, 48].includes(code)) return "from-slate-200 via-gray-100 to-zinc-200";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "from-cyan-50 via-sky-50 to-blue-100";
    if ([95, 96, 99].includes(code)) return "from-indigo-200 via-slate-100 to-blue-200";
    if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return "from-sky-100 via-blue-50 to-indigo-100";
    }
    return "from-sky-100 via-white to-slate-100";
  }

  return (
    <section className="grid gap-6 pb-10 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="animate-fade-up relative overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-[linear-gradient(135deg,rgba(7,24,42,0.92),rgba(18,45,76,0.9)_48%,rgba(10,111,143,0.82))] p-8 shadow-[0_24px_80px_rgba(2,8,23,0.38)]">
          <div className="absolute -right-12 top-10 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-lime-300/10 blur-3xl" />

          <p className="relative text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-100/80">
            Realtime Weather Dashboard
          </p>
          <h1 className="relative mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            Atmospheric UI for a live, multi-service weather system.
          </h1>
          <p className="relative mt-5 max-w-2xl text-base leading-8 text-slate-200/90">
            Open-Meteo feeds a Railway worker, Supabase stores the latest city
            state, and Realtime pushes fresh conditions directly into this interface.
          </p>

          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link
              href="/my-teams"
              className="rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_rgba(121,227,255,0.28)] hover:bg-cyan-100"
            >
              Curate city list
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white hover:bg-white/12"
            >
              Manage account
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="animate-fade-up-delay-1 rounded-[2rem] border border-white/10 bg-[rgba(9,19,35,0.76)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Feed status
            </p>
            <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-white">
              {snapshots.length}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              active weather rows currently mirrored from Supabase.
            </p>
          </div>

          <div className="animate-fade-up-delay-2 rounded-[2rem] border border-white/10 bg-[rgba(9,19,35,0.76)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Personalization
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {user
                ? favoriteCityIds.length > 0
                  ? `${visibleSnapshots.length} saved cities in view`
                  : "Signed in, all cities visible"
                : "Public dashboard mode"}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {user
                ? "Favorites are stored in Supabase and filtered client-side in realtime."
                : "Sign in to turn this global weather board into a private watchlist."}
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-up rounded-[1.75rem] border border-white/10 bg-[rgba(9,19,35,0.76)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <label className="grid gap-2 text-sm font-medium text-slate-300">
          Search curated cities
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search among the curated city list..."
            className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-base text-white outline-none placeholder:text-slate-400 focus:border-cyan-300"
          />
        </label>
        {searchMessage ? (
          <p className="mt-3 text-sm text-cyan-100">{searchMessage}</p>
        ) : null}
        {searchQuery.trim().length >= 2 ? (
          <div className="mt-3 grid gap-2">
            {citySuggestions.length === 0 ? (
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                No matching city in the curated list.
              </div>
            ) : (
              citySuggestions.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => addTrackedCity(city)}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-100 hover:bg-white/10"
                >
                  <span className="block text-sm font-semibold">
                    {city.name}, {city.country}
                  </span>
                  <span className="block text-xs text-slate-400">
                    Click to add this city to the tracked weather board
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(9,19,35,0.76)] p-8 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          Loading weather snapshots...
        </div>
      ) : filteredSnapshots.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(9,19,35,0.76)] p-8 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No cities match this search yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSnapshots.map((snapshot) => {
            const isFavorite = favoriteCityIds.includes(snapshot.id);

            return (
              <Link
                key={snapshot.id}
                href={`/cities/${snapshot.id}`}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${getAccentForCity(snapshot.id)} p-[1px] shadow-[0_22px_54px_rgba(0,0,0,0.22)] hover:shadow-[0_28px_70px_rgba(0,0,0,0.26)]`}
              >
                <div className={`relative h-full rounded-[calc(2rem-1px)] bg-gradient-to-b ${weatherCardClasses(snapshot.weather_code)} p-6 text-slate-950`}>
                  <div className={`weather-overlay ${weatherOverlayClass(snapshot.weather_code)}`} />
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/40 blur-2xl transition duration-300 group-hover:scale-125" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">
                        {snapshot.country_code}
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                        {snapshot.city_name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-700">
                        {snapshot.weather_label ?? "Condition pending"}
                      </p>
                    </div>
                    <div className="text-5xl">{weatherEmoji(snapshot.weather_code)}</div>
                  </div>

                  <div className="relative mt-8 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Temperature
                      </p>
                      <p className="mt-2 text-6xl font-black tracking-[-0.06em] text-slate-950">
                        {formatTemp(snapshot.temperature_c, unit)}
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-950/10 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800">
                      {snapshot.is_day ? "Day cycle" : "Night cycle"}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-[1.25rem] border border-slate-900/6 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                        Feels like
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {formatTemp(snapshot.apparent_temperature_c, unit)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-900/6 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                        Wind
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {snapshot.wind_speed_kmh === null
                          ? "--"
                          : `${Math.round(snapshot.wind_speed_kmh)} km/h`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm text-slate-700">
                    <span className={isFavorite ? "font-semibold text-sky-900" : ""}>
                      {isFavorite ? "Saved favorite" : "Public city"}
                    </span>
                    <span>
                      Updated{" "}
                      {snapshot.updated_at
                        ? new Date(snapshot.updated_at).toLocaleTimeString()
                        : "--"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
