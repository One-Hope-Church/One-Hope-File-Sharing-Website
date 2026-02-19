import { getSession } from "@/lib/session";
import Link from "next/link";
import { getSavedResourceIdsForUser } from "@/lib/supabase-saved-resources";
import { getRecentDownloadIdsForUser } from "@/lib/supabase-download-log";
import { getSavedItemsByIds, getResourcesByIds } from "@/lib/sanity";
import ResourceCard from "@/components/ResourceCard";
import SavedCollectionCard from "@/components/SavedCollectionCard";

const COLLECTIONS_PER_PAGE = 5;
const MAX_RECENT_DOWNLOADS = 6;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyResourcesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-gray-600">Sign in to see your resources.</p>
        <Link href="/signin?callbackUrl=/myresources" className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const [savedIds, recentDownloadIds] = await Promise.all([
    session.user?.email ? getSavedResourceIdsForUser(session.user.email) : Promise.resolve([]),
    session.user?.email ? getRecentDownloadIdsForUser(session.user.email) : Promise.resolve([]),
  ]);
  const items = savedIds.length > 0 ? await getSavedItemsByIds(savedIds) : [];
  const recentDownloadsRaw =
    recentDownloadIds.length > 0 ? await getResourcesByIds(recentDownloadIds) : [];
  const recentDownloads = recentDownloadsRaw.slice(0, MAX_RECENT_DOWNLOADS);
  const collections = items.filter(
    (i) => String(i._type) === "resourceCollection"
  ) as Array<Record<string, unknown>>;
  const resources = items.filter(
    (i) =>
      String(i._type) === "resource" || String(i._type) === "collectionResource"
  ) as Array<Record<string, unknown>>;

  const collectionsPage = Math.max(1, parseInt((await searchParams).page ?? "1", 10) || 1);
  const totalCollectionPages = Math.ceil(collections.length / COLLECTIONS_PER_PAGE);
  const paginatedCollections = collections.slice(
    (collectionsPage - 1) * COLLECTIONS_PER_PAGE,
    collectionsPage * COLLECTIONS_PER_PAGE
  );

  const hasItems =
    collections.length > 0 || resources.length > 0 || recentDownloads.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-bold text-onehope-black">My Resources</h1>
      <p className="mt-2 text-gray-600">
        Recently downloaded files, plus collections and resources you&apos;ve saved. Use the Save button on any collection or resource to add it here.
      </p>

      {hasItems ? (
        <div className="mt-8 space-y-6">
          {collections.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-onehope-black">Saved collections</h2>
              <div className="space-y-3">
                {paginatedCollections.map((c: Record<string, unknown>) => (
                  <SavedCollectionCard
                    key={String(c._id)}
                    id={String(c._id)}
                    title={String(c.title ?? "Untitled")}
                    description={c.description ? String(c.description) : undefined}
                    heroImage={c.heroImage ? String(c.heroImage) : null}
                    slug={c.slug ? String(c.slug) : undefined}
                  />
                ))}
              </div>
              {totalCollectionPages > 1 && (
                <nav
                  className="mt-4 flex items-center justify-center gap-2"
                  aria-label="Saved collections pagination"
                >
                  {collectionsPage > 1 ? (
                    <Link
                      href={`/myresources?page=${collectionsPage - 1}`}
                      className="rounded-lg border border-onehope-gray px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-info/50"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-onehope-gray/50 px-4 py-2 text-sm text-gray-400">
                      Previous
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    Page {collectionsPage} of {totalCollectionPages}
                  </span>
                  {collectionsPage < totalCollectionPages ? (
                    <Link
                      href={`/myresources?page=${collectionsPage + 1}`}
                      className="rounded-lg border border-onehope-gray px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-info/50"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-onehope-gray/50 px-4 py-2 text-sm text-gray-400">
                      Next
                    </span>
                  )}
                </nav>
              )}
            </section>
          )}
          {recentDownloads.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-onehope-black">
                Recently downloaded
              </h2>
              <div className="space-y-3">
                {recentDownloads.map((r: Record<string, unknown>) => (
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
          {resources.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-onehope-black">Saved resources</h2>
              <div className="space-y-3">
                {resources.map((r: Record<string, unknown>) => (
                  <ResourceCard
                    key={String(r._id)}
                    id={String(r._id)}
                    title={String(r.title ?? "Untitled")}
                    description={r.description ? String(r.description) : undefined}
                    fileType={r.fileType ? String(r.fileType) : undefined}
                    isSaved={true}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
          <p className="text-4xl text-onehope-black/40" aria-hidden>▦</p>
          <p className="mt-4 font-medium text-onehope-black">No saved items yet</p>
          <p className="mt-1 text-gray-600">
            Browse sections, collections, or search to find resources and collections, then click Save to add them here.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go to Featured Resources
          </Link>
        </div>
      )}
    </div>
  );
}
