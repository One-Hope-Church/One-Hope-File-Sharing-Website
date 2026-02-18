import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllCollections } from "@/lib/sanity";
import AdminForm from "./AdminForm";

export default async function AdminUploadPage() {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    redirect("/");
  }

  const collectionsRaw = await getAllCollections();
  const collections = Array.isArray(collectionsRaw)
    ? collectionsRaw.map((c) => ({
        _id: String(c._id),
        title: String(c.title ?? "Untitled"),
        slug: c.slug != null ? String(c.slug) : null,
      }))
    : [];

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-2xl font-bold text-onehope-black">Upload file</h1>
      <p className="mt-2 text-gray-600">
        Upload a file to S3. It will be stored under the collection folder you choose. You can add metadata (e.g. in Sanity) later.
      </p>
      <AdminForm collections={collections} />
    </div>
  );
}
