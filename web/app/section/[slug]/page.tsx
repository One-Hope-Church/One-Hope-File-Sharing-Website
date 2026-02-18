import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSectionBySlug, getCollectionsForSection, getStandaloneResourcesForSection } from "@/lib/sanity";
import ResourceCard from "@/components/ResourceCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
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

  const [collections, resources] = await Promise.all([
    getCollectionsForSection(section._id),
    getStandaloneResourcesForSection(section._id),
  ]);

  const title = String(section.title ?? "Untitled");

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-onehope-black">{title}</h1>
      </div>

      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-onehope-black">Collections</h2>
          <ul className="space-y-3">
            {collections.map((col) => (
              <li key={col._id}>
                <Link
                  href={`/collection/${col.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-onehope-gray bg-white p-4 transition-colors hover:border-primary/50 hover:bg-onehope-info/30"
                >
                  <span className="text-2xl" aria-hidden>▦</span>
                  <span className="font-semibold text-onehope-black">{col.title ?? "Untitled"}</span>
                </Link>
              </li>
            ))}
          </ul>
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
              />
            ))}
          </div>
        </section>
      )}

      {collections.length === 0 && resources.length === 0 && (
        <p className="rounded-lg bg-onehope-info p-6 text-gray-600">
          No collections or resources in this section yet.
        </p>
      )}
    </div>
  );
}
