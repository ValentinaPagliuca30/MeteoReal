"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useUnits } from "@/components/units-provider";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/my-teams", label: "Cities" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { unit, toggle } = useUnits();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 px-5 pt-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-[rgba(7,16,30,0.52)] px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="animate-float-soft flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#79e3ff,#b8ff6d)] text-xl shadow-[0_12px_26px_rgba(121,227,255,0.28)]">
            ☁
          </div>
          <div>
            <p className="text-lg font-black tracking-[-0.04em] text-white">
              Meteo Real
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/5 p-1 sm:flex">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    active
                      ? "bg-cyan-200 text-slate-950 shadow-[0_6px_20px_rgba(121,227,255,0.3)]"
                      : "text-slate-200 hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}`}
            title={`Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}`}
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            <span className={unit === "C" ? "text-cyan-200" : "text-slate-400"}>°C</span>
            <span className="text-slate-500">/</span>
            <span className={unit === "F" ? "text-cyan-200" : "text-slate-400"}>°F</span>
          </button>

          {loading ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Checking session...
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className="max-w-40 truncate text-sm text-slate-200">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_8px_24px_rgba(184,255,109,0.26)] hover:bg-lime-200 disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                pathname === "/sign-in"
                  ? "bg-lime-300 text-slate-950 shadow-[0_8px_24px_rgba(184,255,109,0.26)]"
                  : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              }`}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
