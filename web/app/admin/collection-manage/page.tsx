import { getAllCollections } from "@/lib/sanity";
import CollectionManageClient from "./CollectionManageClient";

export default async function CollectionManagePage() {
  const collectionsRaw = await getAllCollections();
  const collections = Array.isArray(collectionsRaw)
    ? collectionsRaw.map((c) => ({
        _id: String(c._id),
        title: String(c.title ?? "Untitled"),
        slug: c.slug != null ? String(c.slug) : null,
      }))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-onehope-black">Manage collections</h1>
      <p className="mt-2 text-gray-600">
        Reorder resources or edit titles and descriptions.
      </p>
      <CollectionManageClient collections={collections} />
    </div>
  );
}
