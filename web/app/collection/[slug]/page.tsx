import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { getCollectionBySlug, getCollectionById } from "@/lib/sanity";
import ResourceCard from "@/components/ResourceCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <p className="text-gray-600">Sign in to view this collection.</p>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(`/collection/${slug}`)}`} className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const collection = await getCollectionBySlug(slug) || await getCollectionById(slug);
  if (!collection) notFound();

  const title = String(collection.title ?? "Untitled");
  const description = collection.description ? String(collection.description) : undefined;
  const heroImage = collection.heroImage ? String(collection.heroImage) : null;
  const sections = (collection.sections as Array<Record<string, unknown>>) || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        {heroImage && (
          <div className="relative mb-4 aspect-[21/9] w-full overflow-hidden rounded-xl bg-onehope-gray">
            <Image src={heroImage} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-onehope-black">{title}</h1>
        {description && <p className="mt-2 text-lg text-gray-600">{description}</p>}
      </div>

      {sections.map((section: Record<string, unknown>) => {
        const sectionTitle = String(section.title ?? "Resources");
        const groups = (section.groups as Array<Record<string, unknown>>) || [];
        const allResources = (section.allResources as Array<Record<string, unknown>>) || [];
        const idsInGroups = new Set(
          groups.flatMap((g) => ((g.resources as Array<Record<string, unknown>>) || []).map((r) => String(r._id)))
        );
        const standaloneResources = allResources.filter((r) => !idsInGroups.has(String(r._id)));

        return (
          <section
            key={String(section._id)}
            id={`section-${section._id}`}
            className="mb-10 scroll-mt-4"
          >
            <h2 className="mb-4 text-xl font-bold text-onehope-black">{sectionTitle}</h2>
            <div className="space-y-6">
              {groups.map((group: Record<string, unknown>) => {
                const groupResources = (group.resources as Array<Record<string, unknown>>) || [];
                return (
                  <div key={String(group._id)} className="rounded-lg border border-onehope-gray bg-onehope-info/30 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-onehope-black">
                      {String(group.title ?? "Untitled group")}
                    </h3>
                    <div className="space-y-2">
                      {groupResources.map((r: Record<string, unknown>) => (
                        <ResourceCard
                          key={String(r._id)}
                          id={String(r._id)}
                          title={String(r.title ?? "Untitled")}
                          description={r.description ? String(r.description) : undefined}
                          fileType={r.fileType ? String(r.fileType) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {standaloneResources.length > 0 && (
                <div className="space-y-3">
                  {groups.length > 0 && (
                    <h3 className="text-lg font-semibold text-onehope-black">Other resources</h3>
                  )}
                  {standaloneResources.map((r: Record<string, unknown>) => (
                    <ResourceCard
                      key={String(r._id)}
                      id={String(r._id)}
                      title={String(r.title ?? "Untitled")}
                      description={r.description ? String(r.description) : undefined}
                      fileType={r.fileType ? String(r.fileType) : undefined}
                    />
                  ))}
                </div>
              )}
              {groups.length === 0 && standaloneResources.length === 0 && (
                <p className="text-gray-500">No resources in this section.</p>
              )}
            </div>
          </section>
        );
      })}

      {sections.length === 0 && (
        <p className="rounded-lg bg-onehope-info p-6 text-gray-600">
          No sections in this collection yet.
        </p>
      )}
    </div>
  );
}
