"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
];

type Collection = { _id: string; title: string; slug?: string | null };
type Resource = { _id: string; title?: string; description?: string; fileType?: string };

export default function CollectionManageClient({
  collections,
}: {
  collections: Collection[];
}) {
  const router = useRouter();
  const [collectionId, setCollectionId] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFileType, setEditFileType] = useState("");

  useEffect(() => {
    if (!collectionId) {
      setResources([]);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/collections/${collectionId}/resources`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setResources(data?.resources ?? []);
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [collectionId]);

  function startEdit(r: Resource) {
    setEditingId(r._id);
    setEditTitle(r.title ?? "");
    setEditDesc(r.description ?? "");
    setEditFileType(r.fileType ?? "");
  }

  async function saveEdit() {
    if (!editingId) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/collection-resources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim() || undefined,
          fileType: editFileType || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      setResources((prev) =>
        prev.map((r) =>
          r._id === editingId
            ? { ...r, title: editTitle.trim(), description: editDesc.trim() || undefined, fileType: editFileType || undefined }
            : r
        )
      );
      setMessage({ type: "ok", text: "Updated." });
      setEditingId(null);
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
    }
  }

  async function moveUp(i: number) {
    if (i <= 0) return;
    await reorder(i, i - 1);
  }

  async function moveDown(i: number) {
    if (i >= resources.length - 1) return;
    await reorder(i, i + 1);
  }

  async function reorder(from: number, to: number) {
    const next = [...resources];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    const ids = next.map((r) => r._id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/collections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, resourceIds: ids }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Reorder failed");
      }
      setResources(next);
      setMessage({ type: "ok", text: "Order updated." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Reorder failed" });
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-onehope-black">Collection</label>
        <select
          value={collectionId}
          onChange={(e) => {
            setCollectionId(e.target.value);
            setEditingId(null);
          }}
          className="mt-1 w-full max-w-md rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— Choose collection —</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-lg p-3 ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      {loading && <p className="text-gray-600">Loading…</p>}

      {!loading && collectionId && resources.length === 0 && (
        <p className="rounded-lg bg-onehope-info/30 p-4 text-gray-600">
          This collection has no resources yet.
        </p>
      )}

      {!loading && resources.length > 0 && (
        <ul className="space-y-2">
          {resources.map((r, i) => (
            <li
              key={r._id}
              className="flex items-center gap-2 rounded-lg border border-onehope-gray bg-white p-3"
            >
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === resources.length - 1}
                  className="rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30 disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
              {editingId === r._id ? (
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded border border-onehope-gray px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded border border-onehope-gray px-2 py-1 text-sm"
                  />
                  <select
                    value={editFileType}
                    onChange={(e) => setEditFileType(e.target.value)}
                    className="rounded border border-onehope-gray px-2 py-1 text-sm"
                  >
                    <option value="">— File type —</option>
                    {FILE_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-dark"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-onehope-gray px-3 py-1 text-sm hover:bg-onehope-info/30"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-onehope-black">{r.title || "Untitled"}</span>
                    {r.description && (
                      <span className="ml-2 text-sm text-gray-600">— {r.description}</span>
                    )}
                    {r.fileType && (
                      <span className="ml-2 rounded bg-onehope-gray/50 px-1.5 py-0.5 text-xs">
                        {r.fileType}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="shrink-0 rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30"
                  >
                    Edit
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
