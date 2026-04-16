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
      <div className="rounded-[2rem] border border-stone-900/10 bg-white/70 p-8 text-stone-700">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 text-stone-700">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-600">
          Signed in
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-950">
          You are already authenticated.
        </h1>
        <p className="mt-4 text-base leading-8">
          Logged in as <span className="font-semibold">{user.email}</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/my-teams"
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          >
            Go to My Teams
          </Link>
          <Link
            href="/"
            className="rounded-full border border-stone-900/10 bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] border border-stone-900/10 bg-stone-50/80 p-7 shadow-[0_18px_60px_rgba(34,22,8,0.15)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
          Auth
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-950">
          Sign up or log in to save your teams.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
          The app uses Supabase Auth. Once you are signed in, `favorites` writes
          are scoped to your account by RLS.
        </p>
      </div>

      <div className="rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(160deg,rgba(255,251,235,0.96),rgba(255,237,213,0.9))] p-6 shadow-[0_18px_60px_rgba(34,22,8,0.14)]">
        <div className="mb-6 flex gap-2 rounded-full border border-stone-900/10 bg-white/70 p-1">
          {[
            { id: "sign-in", label: "Log In" },
            { id: "sign-up", label: "Sign Up" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id as Mode)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === tab.id
                  ? "bg-stone-950 text-stone-50"
                  : "text-stone-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-stone-900/30"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-stone-900/10 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-stone-900/30"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : mode === "sign-in"
                ? "Log In"
                : "Create Account"}
          </button>

          {message ? (
            <p className="rounded-2xl border border-stone-900/10 bg-white/80 px-4 py-3 text-sm text-stone-700">
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
