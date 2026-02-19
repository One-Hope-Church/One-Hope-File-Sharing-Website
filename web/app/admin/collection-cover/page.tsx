import Link from "next/link";
import { getAllCollections } from "@/lib/sanity";
import CollectionCoverForm from "./CollectionCoverForm";

export default async function CollectionCoverPage() {
  const collections = await getAllCollections();
  const list = Array.isArray(collections)
    ? collections.map((c) => ({
        _id: String(c._id),
        title: String(c.title ?? "Untitled"),
        slug: c.slug != null ? String(c.slug) : null,
      }))
    : [];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-onehope-black">Collection cover photo</h1>
      <p className="mt-2 text-gray-600">
        Upload a square cover image for a collection. It appears on the collection page and on cards
        (e.g. home page). Use the sizing guide below for best results.
      </p>
      {list.length === 0 ? (
        <p className="mt-6 rounded-lg bg-onehope-info p-4 text-gray-600">
          No collections yet. Create a collection first.
        </p>
      ) : (
        <CollectionCoverForm collections={list} />
      )}
      <p className="mt-6">
        <Link href="/admin" className="text-primary hover:underline">
          ← Back to Upload
        </Link>
      </p>
    </div>
  );
}
