import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { getCollectionBySlug, getCollectionById } from "@/lib/sanity";
import { getSavedResourceIdsForUser } from "@/lib/supabase-saved-resources";
import ResourceCard from "@/components/ResourceCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-gray-600">Sign in to view this collection.</p>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(`/collection/${slug}`)}`} className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const [bySlug, byId, savedIds] = await Promise.all([
    getCollectionBySlug(slug),
    getCollectionById(slug),
    session.user?.email ? getSavedResourceIdsForUser(session.user.email) : Promise.resolve([]),
  ]);
  const collection = bySlug ?? byId;
  if (!collection) notFound();

  const title = String(collection.title ?? "Untitled");
  const description = collection.description ? String(collection.description) : undefined;
  const heroImage = collection.heroImage ? String(collection.heroImage) : null;
  const resources = (collection.resources as Array<Record<string, unknown>>) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8">
        {heroImage && (
          <div className="relative mb-4 aspect-[21/9] w-full overflow-hidden rounded-xl bg-onehope-gray">
            <Image src={heroImage} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-onehope-black">{title}</h1>
        {description && <p className="mt-2 text-lg text-gray-600">{description}</p>}
      </div>

      {resources.length > 0 ? (
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
      ) : (
        <div className="rounded-xl border border-onehope-gray bg-onehope-info/30 p-8 text-center">
          <p className="text-4xl text-onehope-black/40" aria-hidden>📎</p>
          <p className="mt-4 font-medium text-onehope-black">No resources yet</p>
          <p className="mt-1 text-gray-600">
            This collection doesn&apos;t have any files yet. Admins can add resources when creating a new collection.
          </p>
        </div>
      )}
    </div>
  );
}
