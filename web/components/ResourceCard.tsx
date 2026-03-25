"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  thumbnailUrl?: string | null;
  /** S3 object key when this resource has an uploaded file */
  s3Key?: string | null;
  /** External URL when this resource is link-only or has a link (see link-only UX via s3Key) */
  externalUrl?: string | null;
  isSaved?: boolean;
  showSaveButton?: boolean;
}

export default function ResourceCard({
  id,
  title,
  description,
  fileType,
  thumbnailUrl,
  s3Key,
  externalUrl,
  isSaved = false,
  showSaveButton = true,
}: ResourceCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsExternal, setPreviewIsExternal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const router = useRouter();

  const hasFile = Boolean(s3Key?.trim());
  const hasExternal = Boolean(externalUrl?.trim());
  const linkOnly = hasExternal && !hasFile;
  const canEmbedPreview =
    !linkOnly && (fileType === "video" || fileType === "pdf" || fileType === "image");
  const canOpenPreview = linkOnly || canEmbedPreview;

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
    setPreviewIsExternal(false);
    setPreviewOpen(true);
    if (!canOpenPreview) {
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
        setPreviewIsExternal(data.externalLink === true);
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
        window.open(data.url, "_blank", "noopener,noreferrer");
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

  let externalHostname: string | null = null;
  if (previewUrl && previewIsExternal) {
    try {
      externalHostname = new URL(previewUrl).hostname;
    } catch {
      externalHostname = null;
    }
  }

  const icon = linkOnly
    ? "🔗"
    : fileType === "video"
      ? "▶"
      : fileType === "pdf"
        ? "📄"
        : fileType === "zip"
          ? "📦"
          : fileType === "word"
            ? "📝"
            : fileType === "design"
              ? "🎨"
              : "📎";

  return (
    <>
      <button
        type="button"
        onClick={handlePreview}
        className="flex w-full flex-col gap-3 rounded-lg border border-onehope-gray bg-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-onehope-info/30 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-onehope-gray">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- thumbnail is served as a URL
              <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">{icon}</span>
            )}
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
            {downloading
              ? linkOnly
                ? "Opening…"
                : "Downloading…"
              : linkOnly
                ? "Open link"
                : "Download"}
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
              {!canOpenPreview && !previewLoading && (
                <div className="text-center">
                  <p className="text-gray-600">Preview not available for this file type.</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Use the {linkOnly ? "Open link" : "Download"} button.
                  </p>
                </div>
              )}
              {previewUrl && !previewLoading && previewIsExternal && (
                <div className="max-w-md space-y-4 px-4 text-center">
                  <p className="text-onehope-black">
                    This resource opens a page outside this site
                    {externalHostname ? (
                      <>
                        {" "}
                        (<span className="font-medium">{externalHostname}</span>)
                      </>
                    ) : null}
                    .
                  </p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
                  >
                    Open link
                  </a>
                </div>
              )}
              {previewUrl && !previewLoading && !previewIsExternal && (
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
