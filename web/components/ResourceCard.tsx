"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  /** Show save/unsave when logged in. */
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const router = useRouter();

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  async function handleSaveToggle() {
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

  async function handleDownload() {
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-onehope-gray bg-white p-4 transition-colors hover:border-primary/50 hover:bg-onehope-info/30 sm:flex-row sm:items-center sm:gap-4">
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
      <div className="flex shrink-0 items-center gap-2 sm:flex-shrink-0">
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
    </div>
  );
}
