import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { UnitsProvider } from "@/components/units-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Pulse",
  description: "Realtime weather dashboard with Next.js, Railway, and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <UnitsProvider>
            <SiteHeader />
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-8 lg:px-10">
              {children}
            </div>
          </UnitsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
