"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        setMessage("Account created. You are signed in.");
        router.push("/my-teams");
      } else {
        setMessage("Account created. Check your email for a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Signed in successfully.");
        router.push("/my-teams");
      }
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[rgba(7,16,30,0.76)] p-8 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-200/90">
          Signed in
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">
          You are already authenticated.
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-300">
          Logged in as <span className="font-semibold text-white">{user.email}</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/my-teams"
            className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-lime-200"
          >
            Go to My Cities
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-6 pb-10 pt-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,24,42,0.92),rgba(18,45,76,0.88)_48%,rgba(10,111,143,0.78))] p-8 text-white shadow-[0_24px_80px_rgba(2,8,23,0.35)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-cyan-100/80">
          Access
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Enter the control layer for your private weather feed.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-slate-100/88">
          Use Supabase Auth to create an account, sign in, and persist your own
          set of followed cities inside the `favorites` table.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[rgba(246,250,255,0.9)] p-6 shadow-[0_22px_54px_rgba(0,0,0,0.22)]">
        <div className="mb-6 inline-flex gap-2 rounded-full border border-slate-950/8 bg-slate-950/5 p-1">
          {[
            { id: "sign-in", label: "Log In" },
            { id: "sign-up", label: "Sign Up" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id as Mode)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                mode === tab.id
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[1.25rem] border border-slate-900/8 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[1.25rem] border border-slate-900/8 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-cyan-400"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(121,227,255,0.22)] hover:bg-cyan-100 disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : mode === "sign-in"
                ? "Log In"
                : "Create Account"}
          </button>

          {message ? (
            <p className="rounded-[1.25rem] border border-slate-900/8 bg-white px-4 py-3 text-sm text-slate-700">
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
