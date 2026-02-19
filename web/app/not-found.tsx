import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl text-onehope-black/30" aria-hidden>404</p>
      <h1 className="mt-4 text-2xl font-bold text-onehope-black">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
