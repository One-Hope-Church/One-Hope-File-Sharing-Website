"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

const FILE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "word", label: "Word" },
  { value: "design", label: "Adobe Design (PS/AI/INDD)" },
  { value: "other", label: "Other" },
];

type Collection = {
  _id: string;
  title: string;
  slug?: string | null;
  description?: string;
  heroImage?: string | null;
};
type Resource = {
  _id: string;
  title?: string;
  description?: string;
  fileType?: string;
  externalUrl?: string;
  s3Key?: string;
};

function fileNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

function looksLikeHttpUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function suggestFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["mp4", "mov", "webm", "m4v", "avi", "mkv"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  if (["doc", "docx", "rtf", "odt"].includes(ext)) return "word";
  if (["psd", "ai", "eps", "indd", "xd", "fig"].includes(ext)) return "design";
  if (["zip"].includes(ext)) return "zip";
  return "";
}

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
  const [editExternalUrl, setEditExternalUrl] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedCollection = collections.find((c) => c._id === collectionId) ?? null;
  const [collectionDescDraft, setCollectionDescDraft] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const uploadsFolder = "uploads";

  const [addFileEntries, setAddFileEntries] = useState<Array<{ file: File; fileType: string; title: string }>>(
    []
  );
  const [addExternalEntries, setAddExternalEntries] = useState<Array<{ title: string; url: string }>>([]);
  const [addLinkTitle, setAddLinkTitle] = useState("");
  const [addLinkUrl, setAddLinkUrl] = useState("");
  const [addUploading, setAddUploading] = useState(false);
  const [addUploadProgress, setAddUploadProgress] = useState<number | null>(null);
  const [addUploadStatus, setAddUploadStatus] = useState("");

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

  useEffect(() => {
    // Keep textarea in sync with currently selected collection.
    setCollectionDescDraft(selectedCollection?.description ?? "");
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setAddFileEntries([]);
    setAddExternalEntries([]);
    setAddLinkTitle("");
    setAddLinkUrl("");
    setAddUploadProgress(null);
    setAddUploadStatus("");
  }, [collectionId, collections, selectedCollection?.description]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function startEdit(r: Resource) {
    setEditingId(r._id);
    setEditTitle(r.title ?? "");
    setEditDesc(r.description ?? "");
    setEditFileType(r.fileType ?? "");
    setEditExternalUrl(r.externalUrl ?? "");
  }

  async function saveEdit() {
    if (!editingId) return;
    setMessage(null);
    try {
      const body: Record<string, string | undefined> = {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        fileType: editFileType || undefined,
      };
      if (editExternalUrl.trim()) {
        if (!looksLikeHttpUrl(editExternalUrl)) {
          setMessage({ type: "err", text: "External URL must be http or https" });
          return;
        }
        body.externalUrl = editExternalUrl.trim();
      }
      const res = await fetch(`/api/admin/collection-resources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      setResources((prev) =>
        prev.map((r) =>
          r._id === editingId
            ? {
                ...r,
                title: editTitle.trim(),
                description: editDesc.trim() || undefined,
                fileType: editFileType || undefined,
                ...(editExternalUrl.trim()
                  ? { externalUrl: editExternalUrl.trim() }
                  : {}),
              }
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

  async function deleteResource(id: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/collection-resources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      setResources((prev) => prev.filter((r) => r._id !== id));
      setDeletingId(null);
      setMessage({ type: "ok", text: "File removed from collection." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Delete failed" });
    }
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

  async function uploadWithProgress(
    url: string,
    file: File,
    onProgress: (pct: number) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => resolve(new Response(xhr.responseText, { status: xhr.status }));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
  }

  async function saveCollectionDescription() {
    if (!collectionId) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: collectionDescDraft }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update description");
      }
      setMessage({ type: "ok", text: "Collection description updated." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to update description" });
    }
  }

  async function uploadCover() {
    if (!collectionId || !coverFile) {
      setMessage({ type: "err", text: "Select a cover image first." });
      return;
    }
    setMessage(null);
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.set("collectionId", collectionId);
      formData.set("image", coverFile);
      const res = await fetch("/api/admin/collection-cover", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      setMessage({ type: "ok", text: "Collection cover photo updated." });
      setCoverFile(null);
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setCoverUploading(false);
    }
  }

  const onCoverDrop = useCallback((acceptedFiles: File[]) => {
    setCoverFile(acceptedFiles[0] ?? null);
  }, []);

  const coverDropzone = useDropzone({
    onDrop: onCoverDrop,
    multiple: false,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  const onAddDrop = useCallback((acceptedFiles: File[]) => {
    const newEntries = acceptedFiles.map((f) => ({
      file: f,
      fileType: suggestFileType(f.name) || "other",
      title: fileNameWithoutExt(f.name),
    }));
    setAddFileEntries((prev) => [...prev, ...newEntries]);
  }, []);

  const addDropzone = useDropzone({
    onDrop: onAddDrop,
    multiple: true,
  });

  async function uploadAddFiles() {
    if (!collectionId) {
      setMessage({ type: "err", text: "Choose a collection first." });
      return;
    }
    if (addFileEntries.length === 0 && addExternalEntries.length === 0) {
      setMessage({ type: "err", text: "Add at least one file or external link." });
      return;
    }

    setMessage(null);
    setAddUploading(true);
    setAddUploadProgress(0);
    setAddUploadStatus("");

    const collectionResourceIds: string[] = [];
    try {
      for (let i = 0; i < addFileEntries.length; i++) {
        const entry = addFileEntries[i];
        const f = entry.file;
        const ft = entry.fileType || undefined;

        setAddUploadStatus(`Uploading file ${i + 1} of ${addFileEntries.length}…`);
        setAddUploadProgress(0);

        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            contentType: f.type || "application/octet-stream",
            collectionId: uploadsFolder,
          }),
        });
        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to get upload URL");
        }
        const { url, key } = await presignRes.json();

        const putRes = await uploadWithProgress(url, f, setAddUploadProgress);
        if (!putRes.ok) throw new Error(`Upload failed for ${f.name}`);

        const title = entry.title?.trim() || fileNameWithoutExt(f.name) || `Item ${i + 1}`;
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            fileType: ft,
            s3Key: key,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create collection item");
        }
        const data = await createRes.json().catch(() => ({}));
        if (data.collectionResourceId) collectionResourceIds.push(data.collectionResourceId);
      }

      for (let i = 0; i < addExternalEntries.length; i++) {
        const row = addExternalEntries[i];
        if (!looksLikeHttpUrl(row.url)) {
          throw new Error(`Invalid URL for “${row.title}”`);
        }
        setAddUploadStatus(`Adding link ${i + 1} of ${addExternalEntries.length}…`);
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.title.trim() || `Link ${i + 1}`,
            fileType: "other",
            externalUrl: row.url.trim(),
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create link item");
        }
        const data = await createRes.json().catch(() => ({}));
        if (data.collectionResourceId) collectionResourceIds.push(data.collectionResourceId);
      }

      const appendRes = await fetch("/api/admin/collections/append-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, resourceIds: collectionResourceIds }),
      });
      const appendData = await appendRes.json().catch(() => ({}));
      if (!appendRes.ok) {
        throw new Error(appendData.error ?? "Files uploaded but failed to add to collection");
      }

      const n = addFileEntries.length + addExternalEntries.length;
      setMessage({ type: "ok", text: `${n} item(s) added to the collection.` });
      setAddFileEntries([]);
      setAddExternalEntries([]);
      setAddUploadProgress(null);
      setAddUploadStatus("");
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setAddUploading(false);
      setAddUploadProgress(null);
      setAddUploadStatus("");
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
            setDeletingId(null);
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

      {collectionId && (
        <div className="space-y-4 rounded-lg border border-onehope-gray bg-white p-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-onehope-black">Collection settings</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-onehope-black">Collection photo</label>
                <div className="space-y-2">
                  {(coverPreviewUrl || selectedCollection?.heroImage) && (
                    <img
                      src={coverPreviewUrl ?? selectedCollection?.heroImage ?? ""}
                      alt="Collection cover preview"
                      className="h-24 w-24 rounded object-cover"
                    />
                  )}
                  <div
                    {...coverDropzone.getRootProps()}
                    className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors ${
                      coverDropzone.isDragActive ? "border-primary bg-primary/10" : "border-onehope-gray hover:border-primary/50"
                    }`}
                  >
                    <input {...coverDropzone.getInputProps()} />
                    {coverDropzone.isDragActive ? (
                      <p className="text-primary">Drop the cover image here…</p>
                    ) : (
                      <p className="text-gray-600">
                        Drag and drop a new cover, or click to select
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={uploadCover}
                    disabled={coverUploading || !coverFile}
                    className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {coverUploading ? "Uploading…" : coverFile ? "Update cover photo" : "Select an image"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-onehope-black">
                  Collection description
                </label>
                <textarea
                  value={collectionDescDraft}
                  onChange={(e) => setCollectionDescDraft(e.target.value)}
                  rows={4}
                  placeholder="Describe this collection…"
                  className="w-full rounded-lg border border-onehope-gray px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={saveCollectionDescription}
                  disabled={coverUploading || addUploading}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  Save description
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-onehope-black">Add new files to this collection</h3>
            <div
              {...addDropzone.getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                addDropzone.isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-onehope-gray hover:border-primary/50"
              }`}
            >
              <input {...addDropzone.getInputProps()} />
              {addDropzone.isDragActive ? (
                <p className="text-primary">Drop file(s) here…</p>
              ) : (
                <p className="text-gray-600">
                  Drag file(s) here one at a time, or click to select
                </p>
              )}
            </div>

            {addFileEntries.length > 0 && (
              <div className="space-y-2">
                {addFileEntries.map((entry, i) => (
                  <div
                    key={`${i}-${entry.file.name}`}
                    className="flex flex-col gap-2 rounded-lg border border-onehope-gray bg-onehope-info/20 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 truncate text-xs text-gray-600">
                        File: {entry.file.name}
                      </span>
                      <select
                        value={entry.fileType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAddFileEntries((prev) =>
                            prev.map((p, j) => (j === i ? { ...p, fileType: v } : p))
                          );
                        }}
                        className="rounded border border-onehope-gray bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {FILE_TYPES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Display name
                      </label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAddFileEntries((prev) =>
                            prev.map((p, j) => (j === i ? { ...p, title: v } : p))
                          );
                        }}
                        className="mt-0.5 w-full rounded border border-onehope-gray bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddFileEntries((prev) => prev.filter((_, j) => j !== i))}
                        className="rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addUploading && (
              <div className="rounded-lg bg-onehope-info/20 p-3 text-sm text-gray-700">
                {addUploadStatus}
                {typeof addUploadProgress === "number" && (
                  <div className="mt-1 text-gray-600">{addUploadProgress}%</div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-onehope-gray bg-onehope-info/10 p-3">
              <p className="text-sm font-medium text-onehope-black">External links</p>
              <p className="mt-1 text-xs text-gray-600">
                Add any https URL (videos, docs, forms) without uploading a file.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="block text-xs text-gray-600">Display name</label>
                  <input
                    type="text"
                    value={addLinkTitle}
                    onChange={(e) => setAddLinkTitle(e.target.value)}
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1 text-sm"
                    placeholder="Title"
                  />
                </div>
                <div className="min-w-0 flex-[2]">
                  <label className="block text-xs text-gray-600">URL</label>
                  <input
                    type="url"
                    value={addLinkUrl}
                    onChange={(e) => setAddLinkUrl(e.target.value)}
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1 text-sm"
                    placeholder="https://…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!looksLikeHttpUrl(addLinkUrl)) {
                      setMessage({ type: "err", text: "Enter a valid http or https URL" });
                      return;
                    }
                    setAddExternalEntries((prev) => [
                      ...prev,
                      { title: addLinkTitle.trim() || "External link", url: addLinkUrl.trim() },
                    ]);
                    setAddLinkTitle("");
                    setAddLinkUrl("");
                    setMessage(null);
                  }}
                  className="rounded border border-onehope-gray bg-white px-3 py-1.5 text-sm hover:bg-onehope-info/30"
                >
                  Queue link
                </button>
              </div>
              {addExternalEntries.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {addExternalEntries.map((row, i) => (
                    <li
                      key={`${i}-${row.url}`}
                      className="flex items-center justify-between gap-2 rounded border border-onehope-gray bg-white px-2 py-1"
                    >
                      <span className="min-w-0 truncate">
                        {row.title} — {row.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddExternalEntries((prev) => prev.filter((_, j) => j !== i))}
                        className="shrink-0 text-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={uploadAddFiles}
              disabled={addUploading || (addFileEntries.length === 0 && addExternalEntries.length === 0)}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {addUploading
                ? "Uploading…"
                : `Add ${addFileEntries.length + addExternalEntries.length} item(s)`}
            </button>
          </div>
        </div>
      )}

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
                  <div>
                    <label className="block text-xs text-gray-600">External URL (optional)</label>
                    <input
                      type="url"
                      value={editExternalUrl}
                      onChange={(e) => setEditExternalUrl(e.target.value)}
                      placeholder="https://…"
                      className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1 text-sm"
                    />
                  </div>
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
                    {r.externalUrl && !r.s3Key && (
                      <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary-dark">
                        link
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30"
                    >
                      Edit
                    </button>
                    {deletingId === r._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => deleteResource(r._id)}
                          className="rounded border border-red-600 bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="rounded border border-onehope-gray px-2 py-1 text-sm hover:bg-onehope-info/30"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(r._id)}
                        className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
