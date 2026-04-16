"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/my-teams", label: "My Teams" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.push("/");
  }

  return (
    <header className="border-b border-stone-900/10 bg-stone-950/90 text-stone-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300">
            NBA Scoreboard
          </p>
          <p className="mt-1 text-sm text-stone-300">
            Auth, favorites, and realtime scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-amber-300 text-stone-950"
                      : "text-stone-200 hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {loading ? (
            <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-300">
              Checking session...
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className="max-w-44 truncate text-sm text-stone-200">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                pathname === "/sign-in"
                  ? "bg-amber-300 text-stone-950"
                  : "border border-white/10 bg-white/5 text-stone-100 hover:bg-white/10"
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
