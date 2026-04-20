"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUnits } from "@/components/units-provider";
import type { WeatherRow } from "@/lib/types";
import { convertTemp } from "@/lib/units";

export function CitySwitcher({
  currentCityId,
  cities,
}: {
  currentCityId: string;
  cities: WeatherRow[];
}) {
  const { unit } = useUnits();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pool = cities.filter((c) => c.id !== currentCityId);

    if (!normalized) {
      return pool.slice(0, 6);
    }

    return pool
      .filter((c) =>
        `${c.city_name} ${c.country_code}`.toLowerCase().includes(normalized),
      )
      .slice(0, 8);
  }, [cities, currentCityId, query]);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-6 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">
        Jump to another city
      </p>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tracked cities..."
        className="mt-4 w-full rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 text-base text-white outline-none placeholder:text-slate-400 focus:border-cyan-300"
      />

      <div className="mt-4 grid gap-2">
        {results.length === 0 ? (
          <p className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
            No matching tracked city.
          </p>
        ) : (
          results.map((city) => (
            <Link
              key={city.id}
              href={`/cities/${city.id}`}
              className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-100 hover:bg-white/10"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {city.city_name}, {city.country_code}
                </span>
                <span className="block text-xs text-slate-400">
                  {city.weather_label ?? "Condition pending"}
                </span>
              </span>
              <span className="text-lg font-bold text-white">
                {city.temperature_c === null
                  ? "--"
                  : `${Math.round(convertTemp(city.temperature_c, unit))}°`}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
