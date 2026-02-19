import Link from "next/link";
import { getSession } from "@/lib/session";
import { searchContent } from "@/lib/sanity";
import { getSavedResourceIdsForUser } from "@/lib/supabase-saved-resources";
import CollectionCard from "@/components/CollectionCard";
import ResourceCard from "@/components/ResourceCard";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const session = await getSession();

  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-gray-600">Sign in to search resources.</p>
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`)}`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const query = (q ?? "").trim();
  const [searchResult, savedIds] = await Promise.all([
    query ? searchContent(query) : Promise.resolve({ collections: [], resources: [] }),
    session.user?.email ? getSavedResourceIdsForUser(session.user.email) : Promise.resolve([]),
  ]);
  const { collections, resources } = searchResult;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-bold text-onehope-black">Search</h1>
      {!query ? (
        <div className="mt-6 rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
          <p className="text-4xl text-onehope-black/40" aria-hidden>🔍</p>
          <p className="mt-4 font-medium text-onehope-black">Search collections and resources</p>
          <p className="mt-1 text-gray-600">
            Use the search bar above to find collections and resources by title or description.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-gray-600">
            Results for <strong>&quot;{query}&quot;</strong>
          </p>

          {collections.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-onehope-black">Collections</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {collections.map((c: Record<string, unknown>) => (
                  <li key={String(c._id)}>
                    <CollectionCard
                      id={String(c._id)}
                      title={String(c.title ?? "Untitled")}
                      description={c.description ? String(c.description) : undefined}
                      heroImage={c.heroImage ? String(c.heroImage) : null}
                      slug={c.slug ? String(c.slug) : undefined}
                      isSaved={savedIds.includes(String(c._id))}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {resources.length > 0 && (
            <section className={collections.length > 0 ? "mt-10" : "mt-8"}>
              <h2 className="mb-4 text-xl font-bold text-onehope-black">Resources</h2>
              <div className="space-y-3">
                {resources.map((r: Record<string, unknown>) => (
                  <ResourceCard
                    key={String(r._id)}
                    id={String(r._id)}
                    title={String(r.title ?? "Untitled")}
                    description={r.description ? String(r.description) : undefined}
                    fileType={r.fileType ? String(r.fileType) : undefined}
                    isSaved={savedIds.includes(String(r._id))}
                  />
                ))}
              </div>
            </section>
          )}

          {query && collections.length === 0 && resources.length === 0 && (
            <div className="mt-8 rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
              <p className="text-4xl text-onehope-black/40" aria-hidden>🔍</p>
              <p className="mt-4 font-medium text-onehope-black">No results for &quot;{query}&quot;</p>
              <p className="mt-1 text-gray-600">
                Try different keywords or browse sections and collections from the sidebar.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
