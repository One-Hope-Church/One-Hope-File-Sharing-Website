import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-6 flex flex-wrap gap-3 border-b border-onehope-gray pb-4 sm:gap-4">
        <Link
          href="/admin"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Upload
        </Link>
        <Link
          href="/admin/collection-manage"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Manage collections
        </Link>
        <Link
          href="/admin/featured"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Featured
        </Link>
        <Link
          href="/admin/collection-cover"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Collection cover
        </Link>
        <Link
          href="/admin/users"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Users
        </Link>
      </nav>
      {children}
    </div>
  );
}
