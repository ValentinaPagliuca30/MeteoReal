"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cityOptions } from "@/lib/city-options";
import { supabase } from "@/lib/supabase";
import type { WeatherRow } from "@/lib/types";
import { getMiseryInsight } from "@/lib/weather-insights";

function formatTemperature(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${Math.round(value)}°C`;
}

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

function weatherHeroClasses(code: number | null) {
  if (code === null) return "from-sky-900 via-cyan-900 to-blue-900";
  if (code === 0 || code <= 2) return "from-amber-500/90 via-orange-400/80 to-sky-700";
  if ([45, 48].includes(code)) return "from-slate-700 via-zinc-600 to-slate-800";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "from-cyan-700 via-sky-600 to-indigo-700";
  if ([95, 96, 99].includes(code)) return "from-indigo-950 via-slate-800 to-blue-900";
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "from-sky-900 via-blue-700 to-indigo-800";
  }
  return "from-sky-900 via-cyan-900 to-blue-900";
}

export function CityDetail({ cityId }: { cityId: string }) {
  const cityMeta = cityOptions.find((city) => city.id === cityId);
  const [snapshot, setSnapshot] = useState<WeatherRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSnapshot() {
      const { data } = await supabase
        .from("weather_snapshots")
        .select("*")
        .eq("id", cityId)
        .maybeSingle();

      setSnapshot((data as WeatherRow | null) ?? null);
      setLoading(false);
    }

    loadSnapshot();

    const channel = supabase
      .channel(`city-${cityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weather_snapshots", filter: `id=eq.${cityId}` },
        loadSnapshot,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [cityId]);

  const insight = useMemo(() => {
    return snapshot ? getMiseryInsight(snapshot) : null;
  }, [snapshot]);

  if (!cityMeta) {
    return (
      <section className="grid gap-6 pb-10 pt-4">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          Unknown city.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grid gap-6 pb-10 pt-4">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          Loading city detail...
        </div>
      </section>
    );
  }

  if (!snapshot || !insight) {
    return (
      <section className="grid gap-6 pb-10 pt-4">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          No weather row exists yet for this city. Run the worker first.
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6 pb-10 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${weatherHeroClasses(snapshot.weather_code)} p-8 text-white shadow-[0_24px_80px_rgba(2,8,23,0.35)]`}>
          <div className={`weather-overlay opacity-60 ${weatherOverlayClass(snapshot.weather_code)}`} />
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-100/80">
            {snapshot.country_code} Location Report
          </p>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-[-0.05em] sm:text-6xl">
                {snapshot.city_name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-100/88">
                {snapshot.weather_label}. The air feels like {formatTemperature(snapshot.apparent_temperature_c)},
                with wind moving at{" "}
                {snapshot.wind_speed_kmh === null ? "--" : `${Math.round(snapshot.wind_speed_kmh)} km/h`}.
              </p>
            </div>
            <div className="text-6xl">{weatherEmoji(snapshot.weather_code)}</div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100"
            >
              Back to dashboard
            </Link>
            <Link
              href="/my-teams"
              className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white hover:bg-white/12"
            >
              Edit favorites
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-6 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Misery score
          </p>
          <p className="mt-3 text-6xl font-black tracking-[-0.06em] text-white">
            {insight.score}
            <span className="text-2xl text-slate-400">/100</span>
          </p>
          <p className="mt-3 text-xl font-semibold text-cyan-200">{insight.level}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{insight.summary}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(246,250,255,0.92)] p-6 shadow-[0_22px_54px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">
            Current atmosphere
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.4rem] bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Temperature</p>
              <p className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {formatTemperature(snapshot.temperature_c)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.4rem] border border-slate-900/8 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Feels like</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatTemperature(snapshot.apparent_temperature_c)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-900/8 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Wind</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {snapshot.wind_speed_kmh === null
                    ? "--"
                    : `${Math.round(snapshot.wind_speed_kmh)} km/h`}
                </p>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-slate-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Updated</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {new Date(snapshot.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-6 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-lime-200/80">
            Most miserable activities
          </p>
          <div className="mt-5 grid gap-4">
            {insight.activities.map((activity, index) => (
              <div
                key={activity}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
                  Avoid #{index + 1}
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                  {activity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
