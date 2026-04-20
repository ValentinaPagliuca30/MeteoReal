import type { TempUnit } from "@/components/units-provider";

export function convertTemp(celsius: number, unit: TempUnit): number {
  return unit === "F" ? celsius * (9 / 5) + 32 : celsius;
}

export function formatTemp(celsius: number | null, unit: TempUnit): string {
  if (celsius === null) return "--";
  return `${Math.round(convertTemp(celsius, unit))}°${unit}`;
}
