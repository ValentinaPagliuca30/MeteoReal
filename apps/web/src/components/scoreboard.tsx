"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { teamOptions } from "@/lib/team-options";
import { supabase } from "@/lib/supabase";
import type { FavoriteRow, GameRow } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

type GameSection = "live" | "upcoming" | "completed";

function normalizeTeamKey(value: string) {
  return value.trim().toLowerCase();
}

function inferSection(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("final") ||
    normalized.includes("completed") ||
    normalized.includes("postponed")
  ) {
    return "completed" satisfies GameSection;
  }

  if (
    normalized.includes("scheduled") ||
    normalized.includes("pre") ||
    normalized.includes("upcoming") ||
    normalized.includes("tip")
  ) {
    return "upcoming" satisfies GameSection;
  }

  return "live" satisfies GameSection;
}

function findFavoriteMatch(teamName: string, favorites: string[]) {
  const directMatch = favorites.includes(teamName);

  if (directMatch) {
    return true;
  }

  const teamMeta = teamOptions.find(
    (option) =>
      normalizeTeamKey(option.abbr) === normalizeTeamKey(teamName) ||
      normalizeTeamKey(option.name) === normalizeTeamKey(teamName),
  );

  if (!teamMeta) {
    return false;
  }

  return favorites.some(
    (favorite) =>
      normalizeTeamKey(favorite) === normalizeTeamKey(teamMeta.abbr) ||
      normalizeTeamKey(favorite) === normalizeTeamKey(teamMeta.name),
  );
}

function sectionLabel(section: GameSection, game: GameRow) {
  if (section === "completed") {
    return "Final";
  }

  if (section === "upcoming") {
    return game.game_clock || game.status;
  }

  return game.game_clock || game.status;
}

function TeamLogo({
  src,
  label,
}: {
  src?: string;
  label: string;
}) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-950 text-sm font-black text-stone-50">
        {label.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`${label} logo`}
      width={48}
      height={48}
      className="h-12 w-12 rounded-2xl border border-stone-900/10 bg-white object-contain p-2"
    />
  );
}

export function Scoreboard() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    async function loadGames() {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error) {
        setGames((data as GameRow[]) ?? []);
      }

      setLoadingGames(false);
    }

    loadGames();

    const channel = supabase
      .channel("games")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => {
          loadGames();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setFavorites([]);
        return;
      }

      setLoadingFavorites(true);

      const { data, error } = await supabase
        .from("favorites")
        .select("team_abbr")
        .eq("user_id", user.id);

      if (!error) {
        setFavorites(((data as FavoriteRow[]) ?? []).map((row) => row.team_abbr));
      }

      setLoadingFavorites(false);
    }

    loadFavorites();
  }, [user]);

  const filteredGames = useMemo(() => {
    if (!user || favorites.length === 0) {
      return games;
    }

    return games.filter(
      (game) =>
        findFavoriteMatch(game.home_team, favorites) ||
        findFavoriteMatch(game.away_team, favorites),
    );
  }, [favorites, games, user]);

  const sections = useMemo(() => {
    const grouped: Record<GameSection, GameRow[]> = {
      live: [],
      upcoming: [],
      completed: [],
    };

    for (const game of filteredGames) {
      grouped[inferSection(game.status)].push(game);
    }

    return grouped;
  }, [filteredGames]);

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] border border-stone-900/10 bg-stone-50/80 p-7 shadow-[0_18px_60px_rgba(34,22,8,0.15)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
          Scoreboard
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-950">
          Live games stream into one shared state.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
          The worker writes current scores into Supabase, and this page updates
          whenever `games` changes. Logged-out users see all games. Logged-in
          users see only matchups involving their favorite teams.
        </p>
      </div>

      {loadingGames ? (
        <div className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-8 text-stone-700">
          Loading games...
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-8 text-stone-700">
          {user
            ? "No games match your selected teams yet. Add or change favorites in My Teams."
            : "No games yet. Once the worker writes rows into `games`, they will appear here automatically."}
        </div>
      ) : (
        <>
          {(
            [
              { id: "live", title: "Live" },
              { id: "upcoming", title: "Upcoming" },
              { id: "completed", title: "Completed" },
            ] as const
          ).map((section) => (
            <div key={section.id} className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-700">
                    {section.title}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {sections[section.id].length} game
                    {sections[section.id].length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {sections[section.id].length === 0 ? (
                <div className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-6 text-stone-600">
                  No {section.title.toLowerCase()} games in this view.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {sections[section.id].map((game) => {
                    const homeFavorite = findFavoriteMatch(game.home_team, favorites);
                    const awayFavorite = findFavoriteMatch(game.away_team, favorites);

                    return (
                      <article
                        key={game.id}
                        className="rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(160deg,rgba(255,251,235,0.96),rgba(255,237,213,0.9))] p-6 shadow-[0_15px_40px_rgba(34,22,8,0.12)]"
                      >
                        <div className="flex items-center justify-between text-sm text-stone-600">
                          <div className="flex items-center gap-2">
                            {section.id === "live" ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            ) : null}
                            <span>{game.status}</span>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ${
                              section.id === "completed"
                                ? "bg-stone-950 text-stone-50"
                                : "bg-white/80 text-stone-700"
                            }`}
                          >
                            {sectionLabel(section.id, game)}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4">
                          {[
                            {
                              side: "away",
                              team: game.away_team,
                              score: game.scores?.away ?? 0,
                              favorite: awayFavorite,
                              logo: game.logos?.away,
                            },
                            {
                              side: "home",
                              team: game.home_team,
                              score: game.scores?.home ?? 0,
                              favorite: homeFavorite,
                              logo: game.logos?.home,
                            },
                          ].map((entry) => (
                            <div
                              key={`${game.id}-${entry.side}`}
                              className="flex items-center justify-between rounded-3xl border border-stone-900/8 bg-white/75 px-4 py-4"
                            >
                              <div className="flex items-center gap-3">
                                <TeamLogo src={entry.logo} label={entry.team} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg font-bold text-stone-950">
                                      {entry.team}
                                    </p>
                                    <span className="text-xl text-amber-500">
                                      {entry.favorite ? "★" : ""}
                                    </span>
                                  </div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                                    {entry.side}
                                  </p>
                                </div>
                              </div>
                              <span className="text-3xl font-black text-stone-950">
                                {entry.score}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <div className="rounded-[2rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-50">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
          Favorites status
        </p>
        <p className="mt-3 text-base text-stone-200">
          {user
            ? loadingFavorites
              ? "Loading your teams..."
              : `You are following ${favorites.length} team${
                  favorites.length === 1 ? "" : "s"
                }.`
            : "Sign in to save favorites and highlight them on the scoreboard."}
        </p>
      </div>
    </section>
  );
}
