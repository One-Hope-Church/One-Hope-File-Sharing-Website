"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FILE_TYPES = [
  { value: "", label: "Select type" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "other", label: "Other" },
];

type UploadMode = "single" | "group" | "append";

/** Suggest file type from file extension so PDFs/videos show correct icon. */
function suggestFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["mp4", "mov", "webm", "m4v", "avi", "mkv"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "image";
  return "";
}

function fileNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

/** Upload file to URL with progress. Returns response. */
function uploadWithProgress(
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
    xhr.onload = () =>
      resolve(new Response(xhr.responseText, { status: xhr.status }));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

const COVER_SIZE_GUIDE = "Square 1:1, 1200×1200 px recommended (min 800×800). JPEG, PNG, or WebP, max 5 MB.";

type CollectionOption = { _id: string; title: string; slug?: string | null };

export default function AdminForm({
  collections = [],
}: {
  collections?: CollectionOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("single");
  const [sections, setSections] = useState<Array<{ _id: string; title: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [fileEntries, setFileEntries] = useState<Array<{ file: File; fileType: string; title: string }>>([]);
  const [title, setTitle] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [description, setDescription] = useState("");
  const uploadsFolder = "uploads";
  const [sectionId, setSectionId] = useState("");
  const [appendCollectionId, setAppendCollectionId] = useState("");
  const [appendFileEntries, setAppendFileEntries] = useState<Array<{ file: File; fileType: string; title: string }>>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/sections")
      .then((res) => (res.ok ? res.json() : []))
      .then(setSections)
      .catch(() => setSections([]));
  }, []);

  async function uploadSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setMessage({ type: "err", text: "Title and file are required" });
      return;
    }
    setMessage(null);
    setLoading(true);
    setUploadStatus("Getting upload URL…");
    setUploadProgress(0);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          collectionId: uploadsFolder,
        }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }
      const { url, key } = await presignRes.json();
      setUploadStatus("Uploading…");
      const putRes = await uploadWithProgress(url, file, setUploadProgress);
      if (!putRes.ok) throw new Error("Upload failed");

      setUploadStatus("Creating resource…");
      setUploadProgress(null);
      const createRes = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fileType: fileType || undefined,
          s3Key: key,
          sectionId: sectionId || undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Upload succeeded but failed to save resource");
      }

      setMessage({
        type: "ok",
        text: "File uploaded and resource added. It will appear in the chosen section.",
      });
      setFile(null);
      setTitle("");
      setDescription("");
      setFileType("");
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  }

  async function uploadGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupTitle.trim() || !sectionId) {
      setMessage({ type: "err", text: "Collection title and section are required" });
      return;
    }
    if (fileEntries.length === 0) {
      setMessage({ type: "err", text: "Choose at least one file" });
      return;
    }
    setMessage(null);
    setLoading(true);
    const collectionResourceIds: string[] = [];
    try {
      for (let i = 0; i < fileEntries.length; i++) {
        setUploadStatus(`Uploading file ${i + 1} of ${fileEntries.length}…`);
        setUploadProgress(0);
        const { file: f, fileType: ft } = fileEntries[i];
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
          const data = await presignRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }
        const { url, key } = await presignRes.json();
        const putRes = await uploadWithProgress(url, f, setUploadProgress);
        if (!putRes.ok) throw new Error(`Upload failed for ${f.name}`);

        setUploadProgress(null);
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: (fileEntries[i].title?.trim() || fileNameWithoutExt(f.name) || `Item ${i + 1}`),
            fileType: ft || undefined,
            s3Key: key,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || "Failed to create collection item");
        }
        const data = await createRes.json();
        if (data.collectionResourceId) collectionResourceIds.push(data.collectionResourceId);
      }

      const collectionRes = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: groupTitle.trim(),
          sectionId,
          collectionResourceIds,
        }),
      });
      if (!collectionRes.ok) {
        const data = await collectionRes.json();
        throw new Error(data.error || "Resources created but failed to create the collection");
      }
      const collectionData = await collectionRes.json();
      const newCollectionId = collectionData.collectionId;

      let successText = `Collection "${groupTitle.trim()}" created with ${fileEntries.length} resource(s).`;
      if (coverImage && newCollectionId) {
        const coverForm = new FormData();
        coverForm.set("collectionId", newCollectionId);
        coverForm.set("image", coverImage);
        const coverRes = await fetch("/api/admin/collection-cover", {
          method: "POST",
          body: coverForm,
        });
        if (coverRes.ok) {
          successText += " Cover photo set.";
        } else {
          const coverData = await coverRes.json();
          successText += ` (Cover upload failed: ${coverData.error ?? "unknown"})`;
        }
      }

      setMessage({ type: "ok", text: successText });
      setGroupTitle("");
      setFileEntries([]);
      setCoverImage(null);
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  }

  async function uploadAppend(e: React.FormEvent) {
    e.preventDefault();
    if (!appendCollectionId || appendFileEntries.length === 0) {
      setMessage({ type: "err", text: "Select a collection and at least one file" });
      return;
    }
    setMessage(null);
    setLoading(true);
    const collectionResourceIds: string[] = [];
    try {
      for (let i = 0; i < appendFileEntries.length; i++) {
        setUploadStatus(`Uploading file ${i + 1} of ${appendFileEntries.length}…`);
        setUploadProgress(0);
        const { file: f, fileType: ft } = appendFileEntries[i];
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
          const data = await presignRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }
        const { url, key } = await presignRes.json();
        const putRes = await uploadWithProgress(url, f, setUploadProgress);
        if (!putRes.ok) throw new Error(`Upload failed for ${f.name}`);

        setUploadProgress(null);
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: (appendFileEntries[i].title?.trim() || fileNameWithoutExt(f.name) || `Item ${i + 1}`),
            fileType: ft || undefined,
            s3Key: key,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || "Failed to create collection item");
        }
        const data = await createRes.json();
        if (data.collectionResourceId) collectionResourceIds.push(data.collectionResourceId);
      }

      const appendRes = await fetch("/api/admin/collections/append-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: appendCollectionId,
          resourceIds: collectionResourceIds,
        }),
      });
      if (!appendRes.ok) {
        const data = await appendRes.json();
        throw new Error(data.error || "Files uploaded but failed to add to collection");
      }

      setMessage({ type: "ok", text: `${appendFileEntries.length} file(s) added to the collection.` });
      setAppendCollectionId("");
      setAppendFileEntries([]);
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
      setUploadProgress(null);
      setUploadStatus("");
    }
  }

  const handleSubmit =
    mode === "single" ? uploadSingle : mode === "group" ? uploadGroup : uploadAppend;

  return (
    <>
      <div className="mb-6 flex gap-4 border-b border-onehope-gray pb-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "single"}
            onChange={() => setMode("single")}
            className="text-primary"
          />
          <span>Single resource</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "group"}
            onChange={() => setMode("group")}
            className="text-primary"
          />
          <span>New collection (multiple resources)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "append"}
            onChange={() => setMode("append")}
            className="text-primary"
          />
          <span>Add to existing collection</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "single" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Service Flow PDF"
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short description for the resource card"
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Add to section (optional)
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— None (add later) —</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                File <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setFileType(f ? suggestFileType(f.name) : "");
                }}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                File type for this resource
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {FILE_TYPES.map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose PDF, Video, or Image so it displays with the right icon on the site.
              </p>
            </div>
          </>
        ) : mode === "append" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Collection to add to <span className="text-red-600">*</span>
              </label>
              <select
                value={appendCollectionId}
                onChange={(e) => setAppendCollectionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Choose collection —</option>
                {collections.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select an existing collection. Uploaded files will be appended to it.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Files <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setAppendFileEntries(
                    selected.map((f) => ({
                      file: f,
                      fileType: suggestFileType(f.name),
                      title: fileNameWithoutExt(f.name),
                    }))
                  );
                }}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
              />
              {appendFileEntries.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-onehope-black">
                    Set display name and file type for each item:
                  </p>
                  {appendFileEntries.map((entry, i) => (
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
                            setAppendFileEntries((prev) =>
                              prev.map((p, j) => (j === i ? { ...p, fileType: v } : p))
                            );
                          }}
                          className="rounded border border-onehope-gray bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {FILE_TYPES.filter((o) => o.value !== "").map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Display name</label>
                        <input
                          type="text"
                          value={entry.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAppendFileEntries((prev) =>
                              prev.map((p, j) => (j === i ? { ...p, title: v } : p))
                            );
                          }}
                          placeholder={fileNameWithoutExt(entry.file.name)}
                          className="mt-0.5 w-full rounded border border-onehope-gray bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Collection title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g. Easter 2024 Sermon Pack"
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-gray-500">
                A new collection will be created with this title. All selected files become resources in the collection.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Parent section <span className="text-red-600">*</span>
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                required={mode === "group"}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Choose section —</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                The collection will appear under this section in the sidebar.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Files <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setFileEntries(
                    selected.map((f) => ({
                      file: f,
                      fileType: suggestFileType(f.name),
                      title: fileNameWithoutExt(f.name),
                    }))
                  );
                }}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
              />
              {fileEntries.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-onehope-black">
                    Set display name and file type for each item:
                  </p>
                  {fileEntries.map((entry, i) => (
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
                            setFileEntries((prev) =>
                              prev.map((p, j) => (j === i ? { ...p, fileType: v } : p))
                            );
                          }}
                          className="rounded border border-onehope-gray bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {FILE_TYPES.filter((o) => o.value !== "").map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Display name</label>
                        <input
                          type="text"
                          value={entry.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFileEntries((prev) =>
                              prev.map((p, j) => (j === i ? { ...p, title: v } : p))
                            );
                          }}
                          placeholder={fileNameWithoutExt(entry.file.name)}
                          className="mt-0.5 w-full rounded border border-onehope-gray bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-onehope-gray bg-onehope-info/10 p-4">
              <h3 className="text-sm font-semibold text-onehope-black">
                Optional: set cover photo for this collection
              </h3>
              <p className="mt-1 text-sm text-gray-600">{COVER_SIZE_GUIDE}</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                className="mt-2 w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white file:hover:bg-primary-dark"
              />
              {coverImage && (
                <p className="mt-1 text-xs text-gray-500">
                  Cover: {coverImage.name}
                </p>
              )}
            </div>
          </>
        )}
        {message && (
          <div
            role="alert"
            className={`rounded-lg p-3 ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}
          >
            {message.text}
          </div>
        )}
        {uploadStatus && (
          <div className="rounded-lg border border-onehope-gray bg-onehope-info/20 p-3">
            <p className="text-sm font-medium text-onehope-black">{uploadStatus}</p>
            {uploadProgress != null && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-onehope-gray">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={
            loading ||
            (mode === "single" && (!file || !title.trim())) ||
            (mode === "group" && (!groupTitle.trim() || !sectionId || fileEntries.length === 0)) ||
            (mode === "append" && (!appendCollectionId || appendFileEntries.length === 0))
          }
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading
            ? mode === "single"
              ? "Uploading & creating resource…"
              : mode === "append"
                ? "Adding to collection…"
                : "Creating collection…"
            : mode === "single"
              ? "Upload & add resource"
              : mode === "append"
                ? "Add files to collection"
                : "Create collection"}
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