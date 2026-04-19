import type { WeatherRow } from "@/lib/types";

export type MiseryInsight = {
  score: number;
  level: string;
  summary: string;
  activities: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildActivities(snapshot: WeatherRow) {
  const activities: string[] = [];
  const temp = snapshot.temperature_c ?? 0;
  const wind = snapshot.wind_speed_kmh ?? 0;
  const code = snapshot.weather_code ?? 0;
  const cold = temp <= 5;
  const hot = temp >= 29;
  const stormy = code >= 95;
  const rainy = [61, 63, 65, 80, 81, 82].includes(code);
  const snowy = [71, 73, 75, 77, 85, 86].includes(code);
  const foggy = [45, 48].includes(code);

  if (stormy) {
    activities.push("Rooftop cocktails during a thunderstorm");
    activities.push("Long umbrella walks with fake confidence");
  }

  if (rainy) {
    activities.push("Open-air brunch with expensive linen clothes");
  }

  if (snowy || cold) {
    activities.push("A lakeside picnic with finger-food and no gloves");
  }

  if (wind >= 25) {
    activities.push("Cycling one-handed while pretending the gusts are charming");
  }

  if (hot) {
    activities.push("Midday black-jeans sightseeing with zero shade");
  }

  if (foggy) {
    activities.push("Scenic skyline photography you planned all week");
  }

  activities.push("Trusting the sky enough to leave your jacket behind");

  return activities.slice(0, 3);
}

export function getMiseryInsight(snapshot: WeatherRow): MiseryInsight {
  const temp = snapshot.temperature_c ?? 18;
  const apparent = snapshot.apparent_temperature_c ?? temp;
  const wind = snapshot.wind_speed_kmh ?? 0;
  const code = snapshot.weather_code ?? 0;

  let score = 10;
  score += Math.max(0, 8 - temp) * 4;
  score += Math.max(0, apparent - 28) * 3;
  score += Math.max(0, wind - 12) * 1.2;

  if ([45, 48].includes(code)) score += 14;
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) score += 20;
  if ([71, 73, 75, 77, 85, 86].includes(code)) score += 24;
  if ([95, 96, 99].includes(code)) score += 34;
  if (snapshot.is_day === false && wind >= 20) score += 8;

  const finalScore = Math.round(clamp(score, 0, 100));

  let level = "Softly inconvenient";
  let summary = "The weather is being mildly dramatic, not destructive.";

  if (finalScore >= 80) {
    level = "Actively miserable";
    summary = "This is hostile-weather theater. Dress defensively and lower your expectations.";
  } else if (finalScore >= 60) {
    level = "Grim";
    summary = "The forecast is workable, but only for people who enjoy complaining outdoors.";
  } else if (finalScore >= 35) {
    level = "Moody";
    summary = "You can go out, but the atmosphere is clearly not collaborating.";
  }

  return {
    score: finalScore,
    level,
    summary,
    activities: buildActivities(snapshot),
  };
}
