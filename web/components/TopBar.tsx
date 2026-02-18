"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopBarProps {
  user?: { email: string; role: string } | null;
  showUpload?: boolean;
}

export default function TopBar({ user, showUpload }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-onehope-gray bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <label className="sr-only" htmlFor="search">
          Search
        </label>
        <input
          id="search"
          type="search"
          placeholder="What can I help you find?"
          className="max-w-md flex-1 rounded-lg border border-onehope-gray bg-onehope-info/50 px-4 py-2 text-onehope-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-3">
        {showUpload && (
          <Link
            href="/admin"
            className="rounded-lg border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Upload
          </Link>
        )}
        {user ? (
          <>
            <span className="text-sm text-onehope-black" title={user.email}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-onehope-gray bg-white px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-gray"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/signin"
            className="rounded-lg border-2 border-primary bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-onehope-info"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
