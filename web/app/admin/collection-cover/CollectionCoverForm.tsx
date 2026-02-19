"use client";

import { useState } from "react";

const COVER_SIZE_GUIDE = {
  recommended: "1200 × 1200 px",
  min: "800 × 800 px",
  format: "Square (1:1)",
  formats: "JPEG, PNG, or WebP",
  maxSize: "5 MB",
};

type Collection = { _id: string; title: string; slug?: string | null };

export default function CollectionCoverForm({
  collections,
}: {
  collections: Collection[];
}) {
  const [collectionId, setCollectionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!collectionId || !file) {
      setMessage({ type: "err", text: "Select a collection and an image." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("collectionId", collectionId);
      formData.set("image", file);
      const res = await fetch("/api/admin/collection-cover", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setMessage({ type: "ok", text: "Cover photo updated for this collection." });
      setFile(null);
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-onehope-black">
          Collection <span className="text-red-600">*</span>
        </label>
        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— Choose a collection —</option>
          {collections.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title ?? "Untitled"}
              {c.slug ? ` (/${c.slug})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-onehope-gray bg-onehope-info/20 p-4">
        <h3 className="text-sm font-semibold text-onehope-black">Cover photo sizing guide</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>
            <strong>Shape:</strong> {COVER_SIZE_GUIDE.format} — square works best on cards and headers.
          </li>
          <li>
            <strong>Recommended size:</strong> {COVER_SIZE_GUIDE.recommended} — sharp on all devices.
          </li>
          <li>
            <strong>Minimum:</strong> {COVER_SIZE_GUIDE.min} — avoid going smaller or the image may look blurry.
          </li>
          <li>
            <strong>Formats:</strong> {COVER_SIZE_GUIDE.formats}. Max {COVER_SIZE_GUIDE.maxSize}.
          </li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-onehope-black">
          Cover image <span className="text-red-600">*</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
        />
        {file && (
          <p className="mt-1 text-sm text-gray-500">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-lg p-3 ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !collectionId || !file}
        className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? "Uploading…" : "Upload cover photo"}
      </button>
    </form>
  );
}
