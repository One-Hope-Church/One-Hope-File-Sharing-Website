import Link from "next/link";
import Image from "next/image";

interface CollectionCardProps {
  id: string;
  title: string;
  description?: string;
  heroImage?: string | null;
  slug?: string;
}

export default function CollectionCard({
  id,
  title,
  description,
  heroImage,
  slug,
}: CollectionCardProps) {
  const href = slug ? `/collection/${slug}` : `/collection/${id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-onehope-gray bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
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
