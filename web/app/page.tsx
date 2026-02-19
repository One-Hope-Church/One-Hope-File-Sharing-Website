import Link from "next/link";
import { getSession } from "@/lib/session";
import { getFeaturedCollectionsForHome, getRecentlyAddedCollections } from "@/lib/sanity";
import { getSavedResourceIdsForUser } from "@/lib/supabase-saved-resources";
import CollectionCard from "@/components/CollectionCard";

export default async function HomePage() {
  const session = await getSession();
  const [featuredCollections, recentCollections, savedIds] = await Promise.all([
    getFeaturedCollectionsForHome(6),
    getRecentlyAddedCollections(6),
    session.user?.email ? getSavedResourceIdsForUser(session.user.email) : Promise.resolve([]),
  ]);

  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-onehope-black">
          Welcome to One Hope Resources
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Sign in with your email to browse and download resources.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-onehope-black">
          Welcome to One Hope Resources
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse collections and download what you need.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-onehope-black">
          Featured Resources
        </h2>
        {Array.isArray(featuredCollections) && featuredCollections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCollections.map((c: Record<string, unknown>) => (
              <CollectionCard
                key={String(c._id)}
                id={String(c._id)}
                title={String(c.title || "Untitled")}
                description={c.description ? String(c.description) : undefined}
                heroImage={c.heroImage ? String(c.heroImage) : null}
                slug={c.slug ? String(c.slug) : undefined}
                isSaved={savedIds.includes(String(c._id))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
            <p className="text-4xl text-onehope-black/40" aria-hidden>▦</p>
            <p className="mt-4 font-medium text-onehope-black">No featured collections yet</p>
            <p className="mt-1 text-gray-600">
              Browse sections in the sidebar to find collections, or check back soon as new content is added.
            </p>
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-2xl font-bold text-onehope-black">
          Recently Added
        </h2>
        {Array.isArray(recentCollections) && recentCollections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentCollections.map((c: Record<string, unknown>) => (
              <CollectionCard
                key={String(c._id)}
                id={String(c._id)}
                title={String(c.title || "Untitled")}
                description={c.description ? String(c.description) : undefined}
                heroImage={c.heroImage ? String(c.heroImage) : null}
                slug={c.slug ? String(c.slug) : undefined}
                isSaved={savedIds.includes(String(c._id))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
            <p className="text-4xl text-onehope-black/40" aria-hidden>▦</p>
            <p className="mt-4 font-medium text-onehope-black">No recent collections yet</p>
            <p className="mt-1 text-gray-600">
              New collections will appear here as they&apos;re added.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
