"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

const FILE_TYPES = [
  { value: "", label: "Select type" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "word", label: "Word" },
  { value: "design", label: "Adobe Design (PS/AI/INDD)" },
  { value: "zip", label: "ZIP" },
  { value: "other", label: "Other" },
];

type UploadMode = "single" | "group" | "append";

/** Suggest file type from file extension so PDFs/videos show correct icon. */
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
  const [singleSource, setSingleSource] = useState<"file" | "link">("file");
  const [externalUrlInput, setExternalUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [fileEntries, setFileEntries] = useState<Array<{ file: File; fileType: string; title: string }>>([]);
  const [title, setTitle] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [description, setDescription] = useState("");
  const uploadsFolder = "uploads";
  const [sectionId, setSectionId] = useState("");
  const [appendCollectionId, setAppendCollectionId] = useState("");
  const [appendFileEntries, setAppendFileEntries] = useState<Array<{ file: File; fileType: string; title: string }>>([]);
  const [groupExternalEntries, setGroupExternalEntries] = useState<Array<{ title: string; url: string }>>([]);
  const [appendExternalEntries, setAppendExternalEntries] = useState<Array<{ title: string; url: string }>>([]);
  const [groupLinkTitle, setGroupLinkTitle] = useState("");
  const [groupLinkUrl, setGroupLinkUrl] = useState("");
  const [appendLinkTitle, setAppendLinkTitle] = useState("");
  const [appendLinkUrl, setAppendLinkUrl] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [resourceThumbnailImage, setResourceThumbnailImage] = useState<File | null>(null);
  const [resourceThumbnailPreviewUrl, setResourceThumbnailPreviewUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (coverImage) {
      const url = URL.createObjectURL(coverImage);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreviewUrl(null);
  }, [coverImage]);

  useEffect(() => {
    if (!resourceThumbnailImage) {
      setResourceThumbnailPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(resourceThumbnailImage);
    setResourceThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resourceThumbnailImage]);

  const onSingleDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0] ?? null;
    setFile(f);
    setFileType(f ? suggestFileType(f.name) : "");
  }, []);
  const singleDrop = useDropzone({ onDrop: onSingleDrop, multiple: false });

  const onAppendDrop = useCallback((acceptedFiles: File[]) => {
    const newEntries = acceptedFiles.map((f) => ({
      file: f,
      fileType: suggestFileType(f.name),
      title: fileNameWithoutExt(f.name),
    }));
    setAppendFileEntries((prev) => [...prev, ...newEntries]);
  }, []);
  const appendDrop = useDropzone({ onDrop: onAppendDrop, multiple: true });

  const onGroupDrop = useCallback((acceptedFiles: File[]) => {
    const newEntries = acceptedFiles.map((f) => ({
      file: f,
      fileType: suggestFileType(f.name),
      title: fileNameWithoutExt(f.name),
    }));
    setFileEntries((prev) => [...prev, ...newEntries]);
  }, []);
  const groupDrop = useDropzone({ onDrop: onGroupDrop, multiple: true });

  const onCoverDrop = useCallback((acceptedFiles: File[]) => {
    setCoverImage(acceptedFiles[0] ?? null);
  }, []);
  const coverDrop = useDropzone({
    onDrop: onCoverDrop,
    multiple: false,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
  });

  async function uploadSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: "err", text: "Title is required" });
      return;
    }
    if (singleSource === "file" && !file) {
      setMessage({ type: "err", text: "Choose a file or switch to external link" });
      return;
    }
    if (singleSource === "link" && !looksLikeHttpUrl(externalUrlInput)) {
      setMessage({ type: "err", text: "Enter a valid http or https URL" });
      return;
    }
    setMessage(null);
    setLoading(true);
    setUploadStatus("");
    setUploadProgress(0);
    try {
      let thumbnailAssetId: string | undefined = undefined;
      if (resourceThumbnailImage) {
        setUploadStatus("Uploading cover photo…");
        const thumbForm = new FormData();
        thumbForm.set("image", resourceThumbnailImage);
        const thumbRes = await fetch("/api/admin/resource-thumbnail", {
          method: "POST",
          body: thumbForm,
        });
        const thumbData = await thumbRes.json().catch(() => ({}));
        if (!thumbRes.ok) {
          throw new Error(thumbData.error ?? "Thumbnail upload failed");
        }
        if (typeof thumbData.assetId === "string") {
          thumbnailAssetId = thumbData.assetId;
        }
      }

      let s3Key: string | undefined;
      if (singleSource === "file" && file) {
        setUploadStatus("Getting upload URL…");
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
        s3Key = key;
        setUploadProgress(null);
      }

      setUploadStatus("Creating resource…");

      const createRes = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          fileType: fileType || (singleSource === "link" ? "other" : undefined),
          thumbnailAssetId,
          ...(s3Key ? { s3Key } : {}),
          ...(singleSource === "link" ? { externalUrl: externalUrlInput.trim() } : {}),
          sectionId: sectionId || undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to save resource");
      }

      setMessage({
        type: "ok",
        text:
          singleSource === "link"
            ? "External link resource added. It will appear in the chosen section."
            : "File uploaded and resource added. It will appear in the chosen section.",
      });
      setFile(null);
      setTitle("");
      setDescription("");
      setFileType("");
      setExternalUrlInput("");
      setSingleSource("file");
      setResourceThumbnailImage(null);
      setResourceThumbnailPreviewUrl(null);
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
    if (fileEntries.length === 0 && groupExternalEntries.length === 0) {
      setMessage({ type: "err", text: "Add at least one file or external link" });
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

      for (let i = 0; i < groupExternalEntries.length; i++) {
        const { title: linkTitle, url } = groupExternalEntries[i];
        if (!looksLikeHttpUrl(url)) {
          throw new Error(`Invalid URL for “${linkTitle || `Link ${i + 1}`}”`);
        }
        setUploadStatus(`Adding external link ${i + 1} of ${groupExternalEntries.length}…`);
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: linkTitle.trim() || `Link ${i + 1}`,
            fileType: "other",
            externalUrl: url.trim(),
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || "Failed to create link item");
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
          description: collectionDescription.trim() || undefined,
        }),
      });
      if (!collectionRes.ok) {
        const data = await collectionRes.json();
        throw new Error(data.error || "Resources created but failed to create the collection");
      }
      const collectionData = await collectionRes.json();
      const newCollectionId = collectionData.collectionId;

      const totalItems = fileEntries.length + groupExternalEntries.length;
      let successText = `Collection "${groupTitle.trim()}" created with ${totalItems} resource(s).`;
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
      setCollectionDescription("");
      setFileEntries([]);
      setGroupExternalEntries([]);
      setGroupLinkTitle("");
      setGroupLinkUrl("");
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
    if (!appendCollectionId || (appendFileEntries.length === 0 && appendExternalEntries.length === 0)) {
      setMessage({ type: "err", text: "Select a collection and add at least one file or external link" });
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

      for (let i = 0; i < appendExternalEntries.length; i++) {
        const { title: linkTitle, url } = appendExternalEntries[i];
        if (!looksLikeHttpUrl(url)) {
          throw new Error(`Invalid URL for “${linkTitle || `Link ${i + 1}`}”`);
        }
        setUploadStatus(`Adding external link ${i + 1} of ${appendExternalEntries.length}…`);
        const createRes = await fetch("/api/admin/collection-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: linkTitle.trim() || `Link ${i + 1}`,
            fileType: "other",
            externalUrl: url.trim(),
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || "Failed to create link item");
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

      const appended = appendFileEntries.length + appendExternalEntries.length;
      setMessage({ type: "ok", text: `${appended} item(s) added to the collection.` });
      setAppendCollectionId("");
      setAppendFileEntries([]);
      setAppendExternalEntries([]);
      setAppendLinkTitle("");
      setAppendLinkUrl("");
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
            <div className="space-y-2">
              <span className="block text-sm font-medium text-onehope-black">Resource source</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="singleSource"
                  checked={singleSource === "file"}
                  onChange={() => setSingleSource("file")}
                  className="text-primary"
                />
                <span>Upload file</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="singleSource"
                  checked={singleSource === "link"}
                  onChange={() => setSingleSource("link")}
                  className="text-primary"
                />
                <span>External link (any https URL)</span>
              </label>
            </div>
            {singleSource === "file" ? (
              <div>
                <label className="block text-sm font-medium text-onehope-black">
                  File <span className="text-red-600">*</span>
                </label>
                <div
                  {...singleDrop.getRootProps()}
                  className={`mt-1 w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    singleDrop.isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-onehope-gray hover:border-primary/50"
                  }`}
                >
                  <input {...singleDrop.getInputProps()} />
                  {singleDrop.isDragActive ? (
                    <p className="text-primary">Drop the file here…</p>
                  ) : (
                    <p className="text-gray-600">
                      Drag and drop a file here, or click to select
                      {file && <span className="block mt-1 text-sm text-onehope-black">✓ {file.name}</span>}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-onehope-black">
                  URL <span className="text-red-600">*</span>
                </label>
                <input
                  type="url"
                  value={externalUrlInput}
                  onChange={(e) => setExternalUrlInput(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Vimeo, Figma, Google Docs, Typeform, your church site, etc.
                </p>
              </div>
            )}
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
                Choose PDF, Video, Image, or Other so the card shows the right icon (external links often use Other).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Optional: cover photo (thumbnail) for this resource
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setResourceThumbnailImage(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white file:hover:bg-primary-dark"
              />
              {resourceThumbnailPreviewUrl && resourceThumbnailImage && (
                <div className="mt-3 space-y-2 rounded-lg border border-onehope-gray bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview uses blob URL */}
                  <img
                    src={resourceThumbnailPreviewUrl}
                    alt="Resource thumbnail preview"
                    className="h-20 w-20 rounded object-cover"
                  />
                  <p className="text-sm text-onehope-black">
                    ✓ {resourceThumbnailImage.name}
                  </p>
                </div>
              )}
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
                Files <span className="text-gray-500">(optional if you add links below)</span>
              </label>
              <div
                {...appendDrop.getRootProps()}
                className={`mt-1 w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  appendDrop.isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-onehope-gray hover:border-primary/50"
                }`}
              >
                <input {...appendDrop.getInputProps()} />
                {appendDrop.isDragActive ? (
                  <p className="text-primary">Drop file(s) here…</p>
                ) : (
                  <p className="text-gray-600">
                    Drag and drop files here one at a time, or click to select
                    {appendFileEntries.length > 0 && (
                      <span className="block mt-1 text-sm text-onehope-black">
                        ✓ {appendFileEntries.length} file(s) selected
                      </span>
                    )}
                  </p>
                )}
              </div>
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
            <div className="rounded-lg border border-onehope-gray bg-onehope-info/10 p-4">
              <h3 className="text-sm font-semibold text-onehope-black">External links</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add Vimeo, docs, or any https URL as collection items (in addition to files above).
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="block text-xs font-medium text-gray-600">Display name</label>
                  <input
                    type="text"
                    value={appendLinkTitle}
                    onChange={(e) => setAppendLinkTitle(e.target.value)}
                    placeholder="e.g. Message video"
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="min-w-0 flex-[2]">
                  <label className="block text-xs font-medium text-gray-600">URL</label>
                  <input
                    type="url"
                    value={appendLinkUrl}
                    onChange={(e) => setAppendLinkUrl(e.target.value)}
                    placeholder="https://…"
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!looksLikeHttpUrl(appendLinkUrl)) {
                      setMessage({ type: "err", text: "Enter a valid http or https URL first" });
                      return;
                    }
                    setAppendExternalEntries((prev) => [
                      ...prev,
                      { title: appendLinkTitle.trim() || "External link", url: appendLinkUrl.trim() },
                    ]);
                    setAppendLinkTitle("");
                    setAppendLinkUrl("");
                    setMessage(null);
                  }}
                  className="rounded-lg border border-onehope-gray bg-white px-3 py-2 text-sm font-medium hover:bg-onehope-info/30"
                >
                  Add link
                </button>
              </div>
              {appendExternalEntries.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {appendExternalEntries.map((row, i) => (
                    <li
                      key={`${i}-${row.url}`}
                      className="flex items-center justify-between gap-2 rounded border border-onehope-gray bg-white px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{row.title}</span>{" "}
                        <span className="text-gray-500">{row.url}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAppendExternalEntries((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="shrink-0 text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
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
                Collection description (optional)
              </label>
              <textarea
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                rows={2}
                placeholder="Short description for the collection"
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
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
                Files <span className="text-gray-500">(optional if you add external links)</span>
              </label>
              <div
                {...groupDrop.getRootProps()}
                className={`mt-1 w-full cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  groupDrop.isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-onehope-gray hover:border-primary/50"
                }`}
              >
                <input {...groupDrop.getInputProps()} />
                {groupDrop.isDragActive ? (
                  <p className="text-primary">Drop file(s) here…</p>
                ) : (
                  <p className="text-gray-600">
                    Drag and drop files here one at a time, or click to select
                    {fileEntries.length > 0 && (
                      <span className="block mt-1 text-sm text-onehope-black">
                        ✓ {fileEntries.length} file(s) selected
                      </span>
                    )}
                  </p>
                )}
              </div>
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
              <h3 className="text-sm font-semibold text-onehope-black">External links</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add https links as collection items (in addition to files above).
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="block text-xs font-medium text-gray-600">Display name</label>
                  <input
                    type="text"
                    value={groupLinkTitle}
                    onChange={(e) => setGroupLinkTitle(e.target.value)}
                    placeholder="e.g. Registration form"
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="min-w-0 flex-[2]">
                  <label className="block text-xs font-medium text-gray-600">URL</label>
                  <input
                    type="url"
                    value={groupLinkUrl}
                    onChange={(e) => setGroupLinkUrl(e.target.value)}
                    placeholder="https://…"
                    className="mt-0.5 w-full rounded border border-onehope-gray px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!looksLikeHttpUrl(groupLinkUrl)) {
                      setMessage({ type: "err", text: "Enter a valid http or https URL first" });
                      return;
                    }
                    setGroupExternalEntries((prev) => [
                      ...prev,
                      { title: groupLinkTitle.trim() || "External link", url: groupLinkUrl.trim() },
                    ]);
                    setGroupLinkTitle("");
                    setGroupLinkUrl("");
                    setMessage(null);
                  }}
                  className="rounded-lg border border-onehope-gray bg-white px-3 py-2 text-sm font-medium hover:bg-onehope-info/30"
                >
                  Add link
                </button>
              </div>
              {groupExternalEntries.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {groupExternalEntries.map((row, i) => (
                    <li
                      key={`${i}-${row.url}`}
                      className="flex items-center justify-between gap-2 rounded border border-onehope-gray bg-white px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{row.title}</span>{" "}
                        <span className="text-gray-500">{row.url}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setGroupExternalEntries((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="shrink-0 text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-onehope-gray bg-onehope-info/10 p-4">
              <h3 className="text-sm font-semibold text-onehope-black">
                Optional: set cover photo for this collection
              </h3>
              <p className="mt-1 text-sm text-gray-600">{COVER_SIZE_GUIDE}</p>
              <div
                {...coverDrop.getRootProps()}
                className={`mt-2 cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  coverImage
                    ? "border-green-500 bg-green-50"
                    : coverDrop.isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-onehope-gray hover:border-primary/50"
                }`}
              >
                <input {...coverDrop.getInputProps()} />
                {coverDrop.isDragActive ? (
                  <p className="text-sm text-primary">Drop the image here…</p>
                ) : coverImage && coverPreviewUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700">✓ Cover photo set</p>
                    <div className="mx-auto flex max-w-[200px] items-center gap-3 rounded-lg border border-green-200 bg-white p-2">
                      <img
                        src={coverPreviewUrl}
                        alt="Cover preview"
                        className="h-20 w-20 shrink-0 rounded object-cover"
                      />
                      <span className="truncate text-sm text-onehope-black">{coverImage.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">Click or drop a new image to replace</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Drag and drop an image here, or click to select (JPEG, PNG, WebP)
                  </p>
                )}
              </div>
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
            (mode === "single" &&
              (!title.trim() ||
                (singleSource === "file" && !file) ||
                (singleSource === "link" && !looksLikeHttpUrl(externalUrlInput)))) ||
            (mode === "group" &&
              (!groupTitle.trim() ||
                !sectionId ||
                (fileEntries.length === 0 && groupExternalEntries.length === 0))) ||
            (mode === "append" &&
              (!appendCollectionId ||
                (appendFileEntries.length === 0 && appendExternalEntries.length === 0)))
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
              ? singleSource === "link"
                ? "Add resource"
                : "Upload & add resource"
              : mode === "append"
                ? `Add ${appendFileEntries.length + appendExternalEntries.length} item(s)`
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