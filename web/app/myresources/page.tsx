import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function MyResourcesPage() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <p className="text-gray-600">Sign in to see your resources.</p>
        <Link href="/signin?callbackUrl=/myresources" className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-onehope-black">My Resources</h1>
      <p className="mt-2 text-gray-600">
        Bookmarked or recently viewed resources will appear here. This section can be wired to cookies or a database later.
      </p>
      <p className="mt-6 rounded-lg bg-onehope-info p-4 text-gray-600">
        No saved resources yet. Browse <Link href="/" className="text-primary hover:underline">Featured Resources</Link> to get started.
      </p>
    </div>
  );
}
