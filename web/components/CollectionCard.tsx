"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CollectionCardProps {
  id: string;
  title: string;
  description?: string;
  heroImage?: string | null;
  slug?: string;
  isSaved?: boolean;
  showSaveButton?: boolean;
}

export default function CollectionCard({
  id,
  title,
  description,
  heroImage,
  slug,
  isSaved = false,
  showSaveButton = true,
}: CollectionCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const router = useRouter();
  const href = slug ? `/collection/${slug}` : `/collection/${id}`;

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  async function handleSaveToggle(e: React.MouseEvent) {
    e.preventDefault();
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

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-onehope-gray bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-onehope-gray">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-onehope-black/30">
            ▦
          </div>
        )}
        {showSaveButton && (
          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={saving}
            className="absolute right-2 top-2 rounded-lg border border-white/80 bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-50"
            title={saved ? "Remove from My Resources" : "Save to My Resources"}
          >
            {saved ? "✓ Saved" : "Save"}
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-onehope-black group-hover:text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
