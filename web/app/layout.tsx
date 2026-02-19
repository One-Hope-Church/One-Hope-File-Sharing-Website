import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { getSectionsForSidebar } from "@/lib/sanity";
import { getUserProfile, isProfileComplete } from "@/lib/supabase-users";
import AppShell from "@/components/AppShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "One Hope Resources",
  description: "One Hope Church file sharing and resources",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon-512.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, sections] = await Promise.all([
    getSession(),
    getSectionsForSidebar(),
  ]);
  const showUpload = session.user?.role === "admin";
  let userDisplay: string | null = null;
  if (session.user?.email) {
    const profile = await getUserProfile(session.user.email);
    const first = (profile?.first_name ?? "").trim();
    userDisplay = isProfileComplete(profile) && first
      ? `Hello, ${first}`
      : session.user.email;
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-onehope-black antialiased">
        <AppShell user={session.user} userDisplay={userDisplay} showUpload={showUpload} sections={sections}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
