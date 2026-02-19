import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSectionBySlug, getCollectionsForSection, getResourcesForSection } from "@/lib/sanity";
import { getSavedResourceIdsForUser } from "@/lib/supabase-saved-resources";
import CollectionCard from "@/components/CollectionCard";
import ResourceCard from "@/components/ResourceCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-gray-600">Sign in to view this section.</p>
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(`/section/${slug}`)}`}
          className="mt-4 inline-block text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const section = await getSectionBySlug(slug);
  if (!section) notFound();

  const [collections, resources, savedIds] = await Promise.all([
    getCollectionsForSection(section._id),
    getResourcesForSection(section._id),
    session.user?.email ? getSavedResourceIdsForUser(session.user.email) : Promise.resolve([]),
  ]);

  const title = String(section.title ?? "Untitled");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-onehope-black">{title}</h1>
      </div>

      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-onehope-black">Collections</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collections.map((col) => (
              <CollectionCard
                key={col._id}
                id={col._id}
                title={col.title ?? "Untitled"}
                description={col.description}
                heroImage={col.heroImage ?? null}
                slug={col.slug}
                isSaved={savedIds.includes(col._id)}
              />
            ))}
          </div>
        </section>
      )}

      {resources.length > 0 && (
        <section>
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

      {collections.length === 0 && resources.length === 0 && (
        <div className="rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
          <p className="text-4xl text-onehope-black/40" aria-hidden>▦</p>
          <p className="mt-4 font-medium text-onehope-black">Nothing here yet</p>
          <p className="mt-1 text-gray-600">
            This section doesn&apos;t have any collections or resources yet. Check back soon or browse other sections.
          </p>
        </div>
      )}
    </div>
  );
}
