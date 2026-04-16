import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBA Scoreboard",
  description: "Live sports dashboard scaffold for Vercel, Railway, and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top,#ffe8b4_0%,#f8d99b_20%,#f3b65b_44%,#2e2118_100%)]">
        <AuthProvider>
          <SiteHeader />
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
