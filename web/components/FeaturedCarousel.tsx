"use client";

import { useState, useEffect, useCallback } from "react";
import CollectionCard from "@/components/CollectionCard";

const ROTATE_INTERVAL_MS = 15000;

interface FeaturedCarouselProps {
  collections: Array<Record<string, unknown>>;
  savedIds: string[];
}

export default function FeaturedCarousel({ collections, savedIds }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % collections.length) + collections.length) % collections.length);
    },
    [collections.length]
  );

  const goNext = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  useEffect(() => {
    if (collections.length <= 1) return;
    const id = setInterval(goNext, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [collections.length, currentIndex, goNext]);

  if (collections.length === 0) return null;

  const c = collections[currentIndex] as Record<string, unknown> | undefined;
  if (!c) return null;

  const id = String(c._id ?? "");
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl">
        <CollectionCard
          key={id}
          id={id}
          title={String(c.title ?? "Untitled")}
          description={c.description ? String(c.description) : undefined}
          heroImage={c.heroImage ? String(c.heroImage) : null}
          slug={c.slug ? String(c.slug) : undefined}
          isSaved={savedIds.includes(id)}
          layout="horizontal"
        />
      </div>

      {collections.length > 1 && (
        <>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-lg p-2 text-onehope-black/70 hover:bg-onehope-gray/50 hover:text-onehope-black"
              aria-label="Previous featured"
            >
              <span className="text-xl">‹</span>
            </button>
            <div className="flex gap-1.5" role="tablist" aria-label="Featured slides">
              {collections.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Go to featured ${i + 1} of ${collections.length}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-colors ${
                    i === currentIndex ? "w-6 bg-primary" : "w-2 bg-onehope-gray/60 hover:bg-onehope-gray"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg p-2 text-onehope-black/70 hover:bg-onehope-gray/50 hover:text-onehope-black"
              aria-label="Next featured"
            >
              <span className="text-xl">›</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
