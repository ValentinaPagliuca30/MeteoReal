export type WeatherRow = {
  id: string;
  city_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  temperature_c: number | null;
  apparent_temperature_c: number | null;
  wind_speed_kmh: number | null;
  weather_code: number | null;
  weather_label: string | null;
  is_day: boolean | null;
  observed_at: string | null;
  updated_at: string;
};

export type FavoriteRow = {
  city_id: string;
};

export type TrackedCityRow = {
  id: string;
  city_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

export type GeocodingResult = {
  id: number;
  name: string;
  country_code: string;
  country?: string;
  latitude: number;
  longitude: number;
  admin1?: string;
};
