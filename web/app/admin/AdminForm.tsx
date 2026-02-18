"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [collectionId, setCollectionId] = useState("uploads");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "err", text: "Choose a file" });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          collectionId,
        }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }
      const { url } = await presignRes.json();
      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error("Upload failed");
      setMessage({ type: "ok", text: `Uploaded: ${file.name}` });
      setFile(null);
      setTitle("");
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleUpload} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-onehope-black">
            Collection folder
          </label>
          <input
            type="text"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            placeholder="uploads"
            className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-onehope-black">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-onehope-black">
            File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
          />
        </div>
        {message && (
          <p className={message.type === "ok" ? "text-green-700" : "text-red-600"}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>
      <p className="mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          ← Back
        </button>
      </p>
    </>
  );
}
