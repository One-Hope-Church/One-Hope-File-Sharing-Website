import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { getSectionsForSidebar, getAllCollections } from "@/lib/sanity";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "One Hope Resources",
  description: "One Hope Church file sharing and resources",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const showUpload = session.user?.role === "admin";

  const [sections, collections] = await Promise.all([
    getSectionsForSidebar(),
    getAllCollections(),
  ]);
  const defaultCollectionSlug =
    Array.isArray(collections) && collections.length > 0 && collections[0]?.slug
      ? String(collections[0].slug)
      : undefined;

  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-onehope-black antialiased">
        <div className="flex min-h-screen">
          <Sidebar sections={sections} defaultCollectionSlug={defaultCollectionSlug} />
          <div className="flex flex-1 flex-col pl-[280px]">
            <TopBar user={session.user} showUpload={showUpload} />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
