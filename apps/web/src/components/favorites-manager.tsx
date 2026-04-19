"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { FavoriteRow, TrackedCityRow } from "@/lib/types";

export function FavoritesManager() {
  const { user, loading } = useAuth();
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>([]);
  const [trackedCities, setTrackedCities] = useState<TrackedCityRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingCityId, setPendingCityId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrackedCities() {
      const { data } = await supabase
        .from("tracked_cities")
        .select("id, city_name, country_code, latitude, longitude")
        .order("city_name", { ascending: true });

      setTrackedCities((data as TrackedCityRow[]) ?? []);
    }

    loadTrackedCities();
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

  async function toggleFavorite(cityId: string) {
    if (!user) {
      return;
    }

    setPendingCityId(cityId);
    setMessage(null);

    const isFavorite = favoriteCityIds.includes(cityId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("city_id", cityId);

      if (error) {
        setMessage(error.message);
      } else {
        setFavoriteCityIds((current) => current.filter((value) => value !== cityId));
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        city_id: cityId,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setFavoriteCityIds((current) => [...current, cityId]);
      }
    }

    setPendingCityId(null);
  }

  return (
    <section className="grid gap-6 pb-10 pt-4">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-cyan-200/90">
            Personalization
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Build a private city watchlist on top of the public weather feed.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            Every selection writes into `favorites` under your own `auth.uid()`.
            The dashboard then filters the realtime stream into your custom set of
            tracked locations.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-6 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Saved cities
          </p>
          <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-white">
            {favoriteCityIds.length}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Pick the climates you care about most, then jump back to the dashboard.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(184,255,109,0.22)] hover:bg-lime-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          Checking your session...
        </div>
      ) : !user ? (
        <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">Sign in required</p>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            Authentication is required before the app can write user-specific rows
            into `favorites`.
          </p>
          <Link
            href="/sign-in"
            className="mt-5 inline-flex rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          {message ? (
            <p className="rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {message}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {trackedCities.map((city) => {
              const selected = favoriteCityIds.includes(city.id);

              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => toggleFavorite(city.id)}
                  disabled={pendingCityId === city.id}
                  className={`rounded-[2rem] border p-[1px] text-left shadow-[0_18px_45px_rgba(0,0,0,0.22)] ${
                    selected ? "border-cyan-200/30" : "border-white/10"
                  } disabled:opacity-60`}
                >
                  <div
                    className={`h-full rounded-[calc(2rem-1px)] p-5 ${
                      selected
                        ? "bg-[linear-gradient(155deg,rgba(8,41,69,0.95),rgba(9,88,124,0.9))] text-white"
                        : "bg-[rgba(245,250,255,0.92)] text-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                      <p
                          className={`text-[11px] font-bold uppercase tracking-[0.34em] ${
                            selected ? "text-cyan-200/80" : "text-slate-500"
                          }`}
                        >
                          {city.country_code}
                        </p>
                        <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                          {city.city_name}
                        </p>
                      </div>
                      <span className={`text-2xl ${selected ? "text-lime-300" : "text-slate-400"}`}>
                        {selected ? "★" : "☆"}
                      </span>
                    </div>

                    <p
                      className={`mt-5 text-sm leading-7 ${
                        selected ? "text-slate-100" : "text-slate-600"
                      }`}
                    >
                      {selected
                        ? "This city is pinned into your personalized dashboard."
                        : "Click to include this city in your private realtime weather mix."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
