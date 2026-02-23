"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Collection = { _id: string; title: string; slug?: string | null; featured: boolean };

export default function FeaturedManageClient({
  collections,
}: {
  collections: Collection[];
}) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, boolean>>(
    Object.fromEntries(collections.map((c) => [c._id, c.featured]))
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function toggleFeatured(c: Collection) {
    const next = !local[c._id];
    setUpdating(c._id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/collections/${encodeURIComponent(c._id)}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLocal((prev) => ({ ...prev, [c._id]: next }));
        router.refresh();
      } else {
        setError((data.error as string) || `Failed to update (${res.status})`);
      }
    } finally {
      setUpdating(null);
    }
  }

  async function refreshCache() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/revalidate-featured", { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        setError("Failed to refresh cache");
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={refreshCache}
          disabled={refreshing}
          className="rounded-lg border border-onehope-gray bg-white px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-gray/30 disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh cache"}
        </button>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {collections.length === 0 ? (
        <p className="rounded-lg bg-onehope-info/30 p-4 text-gray-600">
          No collections yet. Upload and create collections first.
        </p>
      ) : (
        <ul className="space-y-2">
          {collections.map((c) => (
            <li
              key={c._id}
              className="flex items-center justify-between gap-4 rounded-lg border border-onehope-gray bg-white p-3"
            >
              <span className="font-medium text-onehope-black">{c.title}</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={local[c._id] ?? false}
                  onChange={() => toggleFeatured(c)}
                  disabled={updating === c._id}
                  className="h-4 w-4 rounded border-onehope-gray text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                  {updating === c._id ? "Updating…" : "Featured"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
