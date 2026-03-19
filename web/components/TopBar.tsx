"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";

interface TopBarProps {
  userDisplay?: string | null;
  onMenuClick?: () => void;
}

function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const debounced = useCallback(
    (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return debounced;
}

type SearchResult = {
  collections: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
};

export default function TopBar({ userDisplay, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/search" ? searchParams.get("q") ?? "" : "";

  const [query, setQuery] = useState(urlQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setResults({ collections: data.collections ?? [], resources: data.resources ?? [] });
        setDropdownOpen(true);
      } else {
        setResults(null);
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useDebouncedCallback(fetchResults, 300);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (v.trim().length < 2) {
      setResults(null);
      setDropdownOpen(false);
    } else {
      debouncedFetch(v);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDropdownOpen(false);
    setResults(null);
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleResultClick() {
    setDropdownOpen(false);
    setResults(null);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const hasResults =
    results &&
    (results.collections.length > 0 || results.resources.length > 0);
  const showDropdown = dropdownOpen && (loading || results !== null);

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
      <div ref={containerRef} className="relative flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <label className="sr-only" htmlFor="search">
            Search collections and resources
          </label>
          <input
            id="search"
            name="q"
            type="search"
            placeholder="What can I help you find?"
            value={query}
            onChange={handleChange}
            onFocus={() => query.trim().length >= 2 && results && setDropdownOpen(true)}
            autoComplete="off"
            className="min-w-0 max-w-md flex-1 rounded-lg border border-onehope-gray bg-onehope-info/50 px-3 py-2 text-sm text-onehope-black placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:px-4 sm:text-base"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark sm:px-4"
          >
            Search
          </button>
        </form>

        {showDropdown && (
          <div className="absolute left-0 right-12 top-full z-30 mt-1 max-h-[min(70vh,400px)] overflow-y-auto rounded-lg border border-onehope-gray bg-white shadow-lg sm:right-24">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Searching…
              </div>
            ) : hasResults ? (
              <div className="py-2">
                {results!.collections.length > 0 && (
                  <div className="px-2 pb-1">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Collections
                    </p>
                    {results!.collections.map((c: Record<string, unknown>) => {
                      const id = String(c._id ?? "");
                      const slug = c.slug ? String(c.slug) : id;
                      const href = `/collection/${slug}`;
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleResultClick}
                          className="block rounded-lg px-3 py-2 text-sm text-onehope-black hover:bg-onehope-gray/50"
                        >
                          {String(c.title ?? "Untitled")}
                        </Link>
                      );
                    })}
                  </div>
                )}
                {results!.resources.length > 0 && (
                  <div className="px-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Resources
                    </p>
                    {results!.resources.map((r: Record<string, unknown>) => {
                      const id = String(r._id ?? "");
                      return (
                        <Link
                          key={id}
                          href={`/search?q=${encodeURIComponent(query.trim())}`}
                          onClick={handleResultClick}
                          className="block rounded-lg px-3 py-2 text-sm text-onehope-black hover:bg-onehope-gray/50"
                        >
                          {String(r.title ?? "Untitled")}
                        </Link>
                      );
                    })}
                  </div>
                )}
                <Link
                  href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search"}
                  onClick={handleResultClick}
                  className="mt-2 block border-t border-onehope-gray px-4 py-2 text-center text-sm font-medium text-primary hover:bg-onehope-gray/30"
                >
                  View all results
                </Link>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No results. Try different keywords.
              </div>
            )}
          </div>
        )}
      </div>
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
