"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

interface TopBarProps {
  userDisplay?: string | null;
  onMenuClick?: () => void;
}

export default function TopBar({ userDisplay, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInputRef.current?.value?.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-onehope-gray bg-white px-4 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-onehope-black hover:bg-onehope-gray/50 lg:hidden"
        aria-label="Open menu"
      >
        <span className="text-2xl" aria-hidden>☰</span>
      </button>
      <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <label className="sr-only" htmlFor="search">
          Search collections and resources
        </label>
        <input
          ref={searchInputRef}
          id="search"
          name="q"
          type="search"
          placeholder="What can I help you find?"
          defaultValue=""
          className="min-w-0 max-w-md flex-1 rounded-lg border border-onehope-gray bg-onehope-info/50 px-3 py-2 text-sm text-onehope-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:px-4 sm:text-base"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark sm:px-4"
        >
          Search
        </button>
      </form>
      {userDisplay && (
        <span
          className="hidden max-w-[180px] truncate text-sm text-onehope-black sm:inline"
          title={userDisplay}
        >
          {userDisplay}
        </span>
      )}
    </header>
  );
}
