"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SavedCollectionCardProps {
  id: string;
  title: string;
  description?: string;
  heroImage?: string | null;
  slug?: string;
}

export default function SavedCollectionCard({
  id,
  title,
  description,
  heroImage,
  slug,
}: SavedCollectionCardProps) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const href = slug ? `/collection/${slug}` : `/collection/${id}`;

  async function handleRemove() {
    setSaving(true);
    try {
      const res = await fetch(`/api/my-resources?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-onehope-gray bg-white p-4 transition-colors hover:border-primary/50 hover:bg-onehope-info/30">
      <Link href={href} className="flex h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-onehope-gray">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-onehope-black/30">
            ▦
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href}>
          <h4 className="font-semibold text-onehope-black hover:text-primary">{title}</h4>
        </Link>
        {description && (
          <p className="mt-0.5 truncate text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleRemove}
          disabled={saving}
          className="rounded-lg border border-onehope-gray px-3 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-info/50 disabled:opacity-50"
          title="Remove from My Resources"
        >
          {saving ? "…" : "Remove"}
        </button>
        <Link
          href={href}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          View
        </Link>
      </div>
    </div>
  );
}
