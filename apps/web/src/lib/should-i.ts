import type { TempUnit } from "@/components/units-provider";
import { convertTemp } from "@/lib/units";

export type HourlyForecast = {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  weather_code: number[];
};

export type ShouldIAnswer = {
  verdict: "yes" | "no" | "maybe";
  headline: string;
  detail: string;
};

function t(celsius: number, unit: TempUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}°${unit}`;
}

export async function fetchHourlyForecast(
  latitude: number,
  longitude: number,
): Promise<HourlyForecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "hourly",
    "temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
  );
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }
  const payload = await response.json();
  return payload.hourly as HourlyForecast;
}

function hoursAhead(forecast: HourlyForecast, hours: number) {
  const now = Date.now();
  const end = now + hours * 3_600_000;
  const indices: number[] = [];

  forecast.time.forEach((iso, index) => {
    const t = new Date(iso).getTime();
    if (t >= now - 30 * 60_000 && t <= end) {
      indices.push(index);
    }
  });

  return indices;
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function answerUmbrella(forecast: HourlyForecast): ShouldIAnswer {
  const indices = hoursAhead(forecast, 12);
  const wetHours = indices.filter((i) => forecast.precipitation[i] >= 0.2);

  if (wetHours.length === 0) {
    return {
      verdict: "no",
      headline: "Leave the umbrella at home",
      detail: "No rain expected in the next 12 hours.",
    };
  }

  const first = wetHours[0];
  const totalMm = wetHours
    .reduce((sum, i) => sum + forecast.precipitation[i], 0)
    .toFixed(1);

  return {
    verdict: "yes",
    headline: "Take an umbrella",
    detail: `Rain starts around ${formatHour(forecast.time[first])} (~${totalMm}mm expected over ${wetHours.length}h).`,
  };
}

export function answerCoat(forecast: HourlyForecast, unit: TempUnit): ShouldIAnswer {
  const indices = hoursAhead(forecast, 12);
  if (indices.length === 0) {
    return { verdict: "maybe", headline: "Forecast not loaded", detail: "Try again in a moment." };
  }

  const temps = indices.map((i) => forecast.apparent_temperature[i]);
  const minTemp = Math.min(...temps);
  const minIdx = indices[temps.indexOf(minTemp)];

  if (minTemp <= 5) {
    return {
      verdict: "yes",
      headline: "Wear a warm coat",
      detail: `Feels like ${t(minTemp, unit)} around ${formatHour(forecast.time[minIdx])}. Scarf recommended.`,
    };
  }
  if (minTemp <= 12) {
    return {
      verdict: "yes",
      headline: "A coat is a good idea",
      detail: `Feels like ${t(minTemp, unit)} around ${formatHour(forecast.time[minIdx])}.`,
    };
  }
  if (minTemp <= 18) {
    return {
      verdict: "maybe",
      headline: "A light jacket will do",
      detail: `Coolest point feels like ${t(minTemp, unit)}.`,
    };
  }
  return {
    verdict: "no",
    headline: "Skip the coat",
    detail: `Stays warm — feels like ${t(minTemp, unit)} at coolest.`,
  };
}

export function answerRun(forecast: HourlyForecast, unit: TempUnit): ShouldIAnswer {
  const indices = hoursAhead(forecast, 14);
  const candidates = indices.filter((i) => {
    const temp = forecast.apparent_temperature[i];
    const rain = forecast.precipitation[i];
    const wind = forecast.wind_speed_10m[i];
    return rain < 0.2 && wind < 28 && temp >= 8 && temp <= 27;
  });

  if (candidates.length === 0) {
    return {
      verdict: "no",
      headline: "Not a great running day",
      detail: "Rain, strong wind, or extreme temperatures in the next 14 hours.",
    };
  }

  const startIdx = candidates[0];
  let endIdx = startIdx;
  for (let i = 1; i < candidates.length; i += 1) {
    if (candidates[i] === candidates[i - 1] + 1) {
      endIdx = candidates[i];
    } else {
      break;
    }
  }

  const startTemp = forecast.apparent_temperature[startIdx];
  return {
    verdict: "yes",
    headline: "Go for that run",
    detail: `Best window ${formatHour(forecast.time[startIdx])}–${formatHour(forecast.time[endIdx])}, feels like ${t(startTemp, unit)}.`,
  };
}

export function answerLaundry(forecast: HourlyForecast): ShouldIAnswer {
  const indices = hoursAhead(forecast, 12);
  let bestRun = 0;
  let currentRun = 0;
  let bestStart = -1;
  let currentStart = -1;

  indices.forEach((i) => {
    const dry = forecast.precipitation[i] < 0.1;
    if (dry) {
      if (currentRun === 0) currentStart = i;
      currentRun += 1;
      if (currentRun > bestRun) {
        bestRun = currentRun;
        bestStart = currentStart;
      }
    } else {
      currentRun = 0;
    }
  });

  if (bestRun < 5) {
    return {
      verdict: "no",
      headline: "Not today — bring the drying rack inside",
      detail: "Not enough rain-free hours to dry clothes outdoors.",
    };
  }

  const endIdx = bestStart + bestRun - 1;
  const avgWind =
    indices.slice(indices.indexOf(bestStart), indices.indexOf(endIdx) + 1)
      .reduce((sum, i) => sum + forecast.wind_speed_10m[i], 0) / bestRun;

  return {
    verdict: "yes",
    headline: "Hang the laundry out",
    detail: `Dry window ${formatHour(forecast.time[bestStart])}–${formatHour(forecast.time[endIdx])}, light breeze around ${Math.round(avgWind)} km/h.`,
  };
}

export function answerBike(forecast: HourlyForecast): ShouldIAnswer {
  const indices = hoursAhead(forecast, 8);
  if (indices.length === 0) {
    return { verdict: "maybe", headline: "Forecast not loaded", detail: "Try again in a moment." };
  }

  const maxWind = Math.max(...indices.map((i) => forecast.wind_speed_10m[i]));
  const rainyHours = indices.filter((i) => forecast.precipitation[i] >= 0.3);

  if (rainyHours.length >= 2) {
    return {
      verdict: "no",
      headline: "Skip the bike today",
      detail: `Rain expected for ${rainyHours.length} of the next ${indices.length} hours.`,
    };
  }
  if (maxWind >= 35) {
    return {
      verdict: "no",
      headline: "Too windy for the bike",
      detail: `Gusts up to ${Math.round(maxWind)} km/h.`,
    };
  }
  if (rainyHours.length === 1 || maxWind >= 25) {
    return {
      verdict: "maybe",
      headline: "Ridable, but be careful",
      detail: `Some wind (${Math.round(maxWind)} km/h) or light showers possible.`,
    };
  }
  return {
    verdict: "yes",
    headline: "Perfect day to bike",
    detail: `Light wind (${Math.round(maxWind)} km/h) and no rain in the next 8 hours.`,
  };
}
