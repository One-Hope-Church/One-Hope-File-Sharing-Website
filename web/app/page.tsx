import Link from "next/link";
import { getSession } from "@/lib/session";
import { getFeaturedCollections } from "@/lib/sanity";
import CollectionCard from "@/components/CollectionCard";

export default async function HomePage() {
  const session = await getSession();
  const collections = await getFeaturedCollections();

  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
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
    <div className="mx-auto max-w-6xl px-6 py-8">
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
        {Array.isArray(collections) && collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c: Record<string, unknown>) => (
              <CollectionCard
                key={String(c._id)}
                id={String(c._id)}
                title={String(c.title || "Untitled")}
                description={c.description ? String(c.description) : undefined}
                heroImage={c.heroImage ? String(c.heroImage) : null}
                slug={c.slug ? String(c.slug) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-onehope-info p-6 text-gray-600">
            No featured collections yet. Add content in Sanity or browse all
            collections when they’re set up.
          </p>
        )}
      </section>
    </div>
  );
}
