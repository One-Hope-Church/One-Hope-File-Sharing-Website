"use client";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
}

export default function ResourceCard({
  id,
  title,
  description,
  fileType,
}: ResourceCardProps) {
  function handleDownload() {
    window.open(`/api/resources/download?id=${encodeURIComponent(id)}`, "_blank");
  }

  const icon = fileType === "video" ? "▶" : fileType === "pdf" ? "📄" : "📎";

  return (
    <div className="flex items-center gap-4 rounded-lg border border-onehope-gray bg-white p-4 transition-colors hover:border-primary/50 hover:bg-onehope-info/30">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-onehope-gray text-2xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-onehope-black">{title}</h4>
        {description && (
          <p className="mt-0.5 truncate text-sm text-gray-600">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Download
      </button>
    </div>
  );
}
