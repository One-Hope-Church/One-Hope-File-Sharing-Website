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

  async function toggleFeatured(c: Collection) {
    const next = !local[c._id];
    setUpdating(c._id);
    try {
      const res = await fetch(`/api/admin/collections/${encodeURIComponent(c._id)}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (res.ok) {
        setLocal((prev) => ({ ...prev, [c._id]: next }));
        router.refresh();
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="mt-6">
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
