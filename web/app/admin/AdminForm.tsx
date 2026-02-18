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

type UploadMode = "single" | "group";

function fileNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export default function AdminForm() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("single");
  const [sections, setSections] = useState<Array<{ _id: string; title: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("");
  const collectionId = "uploads"; // default S3 path: collections/uploads/
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(false);
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
      const { url, key } = await presignRes.json();
      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!putRes.ok) throw new Error("Upload failed");

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
        throw new Error(data.error || "Upload succeeded but failed to create resource in Sanity");
      }

      setMessage({
        type: "ok",
        text: "File uploaded and resource added to Sanity. It will appear in the chosen section.",
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
    }
  }

  async function uploadGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupTitle.trim() || !sectionId) {
      setMessage({ type: "err", text: "Group title and section are required" });
      return;
    }
    if (files.length === 0) {
      setMessage({ type: "err", text: "Choose at least one file" });
      return;
    }
    setMessage(null);
    setLoading(true);
    const resourceIds: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            contentType: f.type || "application/octet-stream",
            collectionId,
          }),
        });
        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }
        const { url, key } = await presignRes.json();
        const putRes = await fetch(url, {
          method: "PUT",
          body: f,
          headers: { "Content-Type": f.type || "application/octet-stream" },
        });
        if (!putRes.ok) throw new Error(`Upload failed for ${f.name}`);

        const createRes = await fetch("/api/admin/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fileNameWithoutExt(f.name) || `Item ${i + 1}`,
            fileType: fileType || undefined,
            s3Key: key,
            sectionId,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || "Failed to create resource");
        }
        const data = await createRes.json();
        if (data.resourceId) resourceIds.push(data.resourceId);
      }

      const groupRes = await fetch("/api/admin/resources/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: groupTitle.trim(),
          sectionId,
          resourceIds,
        }),
      });
      if (!groupRes.ok) {
        const data = await groupRes.json();
        throw new Error(data.error || "Resources created but failed to create group");
      }

      setMessage({
        type: "ok",
        text: `${files.length} file(s) uploaded and grouped as "${groupTitle.trim()}" in the section.`,
      });
      setGroupTitle("");
      setFiles([]);
      setFileType("");
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = mode === "single" ? uploadSingle : uploadGroup;

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
          <span>Group of resources</span>
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
                <option value="">— None (add in Sanity later) —</option>
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
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Group title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g. Easter 2024 Sermon Pack"
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-gray-500">
                This group will appear under the section with this title; all selected files become resources in the group.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Section <span className="text-red-600">*</span>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-onehope-black">
                Files <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:hover:bg-primary-dark"
              />
              {files.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">{files.length} file(s) selected. Each will be a resource in the group.</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-onehope-black">
            File type
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
        </div>
        {message && (
          <p className={message.type === "ok" ? "text-green-700" : "text-red-600"}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={
            loading ||
            (mode === "single" && (!file || !title.trim())) ||
            (mode === "group" && (!groupTitle.trim() || !sectionId || files.length === 0))
          }
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading
            ? mode === "single"
              ? "Uploading & creating resource…"
              : "Uploading group…"
            : mode === "single"
              ? "Upload & add to Sanity"
              : "Upload group & add to section"}
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