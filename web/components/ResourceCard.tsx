"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  isSaved?: boolean;
  showSaveButton?: boolean;
}

export default function ResourceCard({
  id,
  title,
  description,
  fileType,
  isSaved = false,
  showSaveButton = true,
}: ResourceCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const router = useRouter();

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  async function handleSaveToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!showSaveButton) return;
    setSaving(true);
    try {
      if (saved) {
        const res = await fetch(`/api/my-resources?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSaved(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/my-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: id }),
        });
        if (res.ok) {
          setSaved(true);
          router.refresh();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setError(null);
    setPreviewUrl(null);
    setPreviewOpen(true);
    if (!canPreview) {
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/resources/preview?id=${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.url === "string") {
        setPreviewUrl(data.url);
      } else {
        const msg =
          res.status === 401
            ? "Please sign in to preview."
            : res.status === 404
              ? "Resource not found."
              : (data.error as string) || "Preview not available.";
        setError(msg);
      }
    } catch {
      setError("Preview failed. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/resources/download?id=${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.url === "string") {
        window.open(data.url, "_blank");
        return;
      }
      const msg =
        res.status === 401
          ? "Please sign in to download."
          : res.status === 404
            ? "Resource not found."
            : res.status === 503
              ? "Download is temporarily unavailable."
              : (data.error as string) || `Download failed (${res.status}). Please try again.`;
      setError(msg);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const icon = fileType === "video" ? "▶" : fileType === "pdf" ? "📄" : "📎";
  const canPreview = fileType === "video" || fileType === "pdf" || fileType === "image";

  return (
    <>
      <button
        type="button"
        onClick={handlePreview}
        className="flex w-full flex-col gap-3 rounded-lg border border-onehope-gray bg-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-onehope-info/30 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-onehope-gray text-2xl">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-onehope-black">{title}</h4>
            {description && (
              <p className="mt-0.5 truncate text-sm text-gray-600">{description}</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 sm:flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {showSaveButton && (
            <button
              type="button"
              onClick={handleSaveToggle}
              disabled={saving}
              className="rounded-lg border border-onehope-gray px-3 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-info/50 disabled:opacity-50"
              title={saved ? "Remove from My Resources" : "Save to My Resources"}
            >
              {saved ? "✓ Saved" : "Save"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </button>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-onehope-gray bg-white px-4 py-3">
              <h2 id="preview-title" className="truncate font-semibold text-onehope-black">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-2 text-onehope-black hover:bg-onehope-gray/50"
                aria-label="Close preview"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="flex max-h-[calc(90vh-60px)] min-h-[200px] items-center justify-center overflow-auto bg-gray-100 p-4">
              {previewLoading && (
                <p className="text-gray-600">Loading preview…</p>
              )}
              {error && !previewLoading && (
                <p className="text-center text-red-600">{error}</p>
              )}
              {!canPreview && !previewLoading && (
                <div className="text-center">
                  <p className="text-gray-600">Preview not available for this file type.</p>
                  <p className="mt-2 text-sm text-gray-500">Use the Download button to get the file.</p>
                </div>
              )}
              {previewUrl && !previewLoading && (
                <>
                  {fileType === "pdf" && (
                    <iframe
                      src={previewUrl}
                      title={title}
                      className="h-[70vh] w-full rounded border-0"
                    />
                  )}
                  {fileType === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL
                    <img
                      src={previewUrl}
                      alt={title}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  )}
                  {fileType === "video" && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-[70vh] max-w-full rounded"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
