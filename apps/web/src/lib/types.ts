export type GameRow = {
  id: string;
  home_team: string;
  away_team: string;
  scores: {
    home?: number;
    away?: number;
  } | null;
  status: string;
  game_clock: string | null;
  logos: {
    home?: string;
    away?: string;
  } | null;
  updated_at: string;
};

export type FavoriteRow = {
  team_abbr: string;
};
