"use client";

import { useEffect, useState } from "react";
import { useUnits, type TempUnit } from "@/components/units-provider";
import {
  answerBike,
  answerCoat,
  answerLaundry,
  answerRun,
  answerUmbrella,
  fetchHourlyForecast,
  type HourlyForecast,
  type ShouldIAnswer,
} from "@/lib/should-i";

type Question = {
  key: string;
  emoji: string;
  label: string;
  answerFn: (forecast: HourlyForecast, unit: TempUnit) => ShouldIAnswer;
};

const QUESTIONS: Question[] = [
  { key: "umbrella", emoji: "☂️", label: "Do I need an umbrella?", answerFn: (f) => answerUmbrella(f) },
  { key: "coat", emoji: "🧥", label: "Do I need a coat?", answerFn: answerCoat },
  { key: "run", emoji: "🏃", label: "Can I go for a run?", answerFn: answerRun },
  { key: "laundry", emoji: "🧺", label: "Can I hang laundry?", answerFn: (f) => answerLaundry(f) },
  { key: "bike", emoji: "🚲", label: "Can I bike today?", answerFn: (f) => answerBike(f) },
];

const verdictStyles: Record<ShouldIAnswer["verdict"], string> = {
  yes: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  no: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  maybe: "border-amber-400/40 bg-amber-400/10 text-amber-100",
};

export function ShouldIAsk({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { unit } = useUnits();
  const [forecast, setForecast] = useState<HourlyForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Question | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHourlyForecast(latitude, longitude)
      .then((data) => {
        if (!cancelled) {
          setForecast(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load forecast");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const answer = selected && forecast ? selected.answerFn(forecast, unit) : null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-6 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">
        Should I...?
      </p>
      <p className="mt-2 text-sm text-slate-300">
        Quick answers based on the next 12 hours of local forecast.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUESTIONS.map((q) => {
          const isActive = selected?.key === q.key;
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => setSelected(q)}
              disabled={loading || !!error}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-cyan-300 bg-cyan-200 text-slate-950"
                  : "border-white/15 bg-white/6 text-white hover:bg-white/12"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="mr-2">{q.emoji}</span>
              {q.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Loading forecast...</p>
      ) : error ? (
        <p className="mt-5 text-sm text-rose-300">Could not load forecast: {error}</p>
      ) : answer ? (
        <div
          className={`mt-5 rounded-[1.5rem] border p-5 ${verdictStyles[answer.verdict]}`}
        >
          <p className="text-xs uppercase tracking-[0.28em] opacity-80">
            {answer.verdict === "yes"
              ? "Yes"
              : answer.verdict === "no"
                ? "No"
                : "Maybe"}
          </p>
          <p className="mt-2 text-xl font-black tracking-[-0.03em]">{answer.headline}</p>
          <p className="mt-2 text-sm leading-6 opacity-90">{answer.detail}</p>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-400">
          Pick a question above to get an answer.
        </p>
      )}
    </div>
  );
}
