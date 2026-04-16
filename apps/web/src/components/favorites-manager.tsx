"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { teamOptions } from "@/lib/team-options";
import type { FavoriteRow, GameRow } from "@/lib/types";

export function FavoritesManager() {
  const { user, loading } = useAuth();
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingTeam, setPendingTeam] = useState<string | null>(null);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    async function loadGames() {
      const { data } = await supabase
        .from("games")
        .select("*")
        .order("updated_at", { ascending: false });

      setGames((data as GameRow[]) ?? []);
    }

    loadGames();
  }, []);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setFavoriteTeams([]);
        return;
      }

      setLoadingFavorites(true);

      const { data, error } = await supabase
        .from("favorites")
        .select("team_abbr")
        .eq("user_id", user.id);

      if (!error) {
        setFavoriteTeams(((data as FavoriteRow[]) ?? []).map((row) => row.team_abbr));
      }

      setLoadingFavorites(false);
    }

    loadFavorites();
  }, [user]);

  const availableTeams = useMemo(() => {
    const fromGames = new Set<string>();

    for (const game of games) {
      fromGames.add(game.home_team);
      fromGames.add(game.away_team);
    }

    if (fromGames.size === 0) {
      return teamOptions;
    }

    return teamOptions.filter((team) => fromGames.has(team.abbr));
  }, [games]);

  async function toggleFavorite(teamAbbr: string) {
    if (!user) {
      return;
    }

    setPendingTeam(teamAbbr);
    setMessage(null);

    const isFavorite = favoriteTeams.includes(teamAbbr);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("team_abbr", teamAbbr);

      if (error) {
        setMessage(error.message);
      } else {
        setFavoriteTeams((current) => current.filter((team) => team !== teamAbbr));
      }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        team_abbr: teamAbbr,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setFavoriteTeams((current) => [...current, teamAbbr]);
      }
    }

    setPendingTeam(null);
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] border border-stone-900/10 bg-stone-50/80 p-7 shadow-[0_18px_60px_rgba(34,22,8,0.15)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
          My Teams
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-950">
          Pick the teams you want highlighted everywhere.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
          Your choices are saved to the `favorites` table in Supabase and scoped
          to your account through RLS.
        </p>
      </div>

      {loading ? (
        <div className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-8 text-stone-700">
          Checking your session...
        </div>
      ) : !user ? (
        <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 text-stone-700">
          <p className="text-lg font-semibold text-stone-950">
            Sign in to save favorites.
          </p>
          <p className="mt-3 leading-7">
            You need an authenticated account before this page can write to
            `favorites`.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(160deg,rgba(255,251,235,0.96),rgba(255,237,213,0.9))] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-600">
                  Saved favorites
                </p>
                <p className="mt-2 text-3xl font-black text-stone-950">
                  {loadingFavorites ? "..." : favoriteTeams.length}
                </p>
              </div>
              <div className="rounded-3xl bg-stone-950 px-5 py-4 text-stone-50">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                  Requirement
                </p>
                <p className="mt-2 text-lg font-semibold">
                  Pick at least 3 teams to follow.
                </p>
              </div>
            </div>

            {favoriteTeams.length < 3 ? (
              <p className="mt-5 rounded-2xl border border-amber-300/50 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-950">
                Pick at least 3 teams to follow.
              </p>
            ) : (
              <p className="mt-5 rounded-2xl border border-emerald-300/50 bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-950">
                You are following enough teams to personalize the full dashboard.
              </p>
            )}

            {message ? (
              <p className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-100 px-4 py-3 text-sm text-rose-900">
                {message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTeams.map((team) => {
              const selected = favoriteTeams.includes(team.abbr);

              return (
                <button
                  key={team.abbr}
                  type="button"
                  onClick={() => toggleFavorite(team.abbr)}
                  disabled={pendingTeam === team.abbr}
                  className={`rounded-[1.75rem] border p-5 text-left transition ${
                    selected
                      ? "border-amber-400 bg-stone-950 text-stone-50 shadow-[0_14px_36px_rgba(34,22,8,0.25)]"
                      : "border-stone-900/10 bg-white/75 text-stone-950 hover:border-stone-900/20 hover:bg-white"
                  } disabled:opacity-60`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                        {team.abbr}
                      </p>
                      <p
                        className={`mt-2 text-xl font-bold ${
                          selected ? "text-stone-50" : "text-stone-950"
                        }`}
                      >
                        {team.name}
                      </p>
                    </div>
                    <span className="text-2xl text-amber-400">
                      {selected ? "★" : "☆"}
                    </span>
                  </div>
                  <p
                    className={`mt-5 text-sm ${
                      selected ? "text-stone-300" : "text-stone-600"
                    }`}
                  >
                    {selected ? "Saved to Supabase favorites." : "Click to follow this team."}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
