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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <nav className="mb-6 flex gap-4 border-b border-onehope-gray pb-4">
        <Link
          href="/admin"
          className="font-medium text-onehope-black hover:text-primary"
        >
          Upload
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
