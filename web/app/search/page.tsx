import Link from "next/link";
import { getSession } from "@/lib/session";
import { searchContent } from "@/lib/sanity";
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
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
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
  const { collections, resources } = query ? await searchContent(query) : { collections: [], resources: [] };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-onehope-black">Search</h1>
      {!query ? (
        <p className="mt-2 text-gray-600">
          Enter a search term in the bar above to find collections and resources by title or description.
        </p>
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
                  />
                ))}
              </div>
            </section>
          )}

          {query && collections.length === 0 && resources.length === 0 && (
            <p className="mt-8 rounded-lg bg-onehope-info p-6 text-gray-600">
              No collections or resources match &quot;{query}&quot;. Try different words.
            </p>
          )}
        </>
      )}
    </div>
  );
}
