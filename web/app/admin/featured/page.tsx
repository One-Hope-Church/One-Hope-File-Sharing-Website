import { getAllCollections } from "@/lib/sanity";
import FeaturedManageClient from "./FeaturedManageClient";

export default async function AdminFeaturedPage() {
  const collectionsRaw = await getAllCollections();
  const collections = Array.isArray(collectionsRaw)
    ? collectionsRaw.map((c) => ({
        _id: String(c._id),
        title: String(c.title ?? "Untitled"),
        slug: c.slug != null ? String(c.slug) : null,
        featured: Boolean(c.featured),
      }))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-onehope-black">Featured collections</h1>
      <p className="mt-2 text-gray-600">
        Mark collections to feature on the home page. Up to 6 rotate each day.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        If you deleted a featured collection and it still appears on the homepage, click Refresh cache.
      </p>
      <FeaturedManageClient collections={collections} />
    </div>
  );
}
