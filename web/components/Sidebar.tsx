"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  sections: Array<{ _id: string; title: string; slug: string }>;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ sections = [], isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/", label: "Home", icon: "⌂" },
    { href: "/myresources", label: "My Resources", icon: "▦" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-full w-[280px] max-w-[85vw] flex-col text-white transition-transform duration-200 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      style={{ backgroundColor: "#0092cc" }}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mb-6 flex items-center justify-between lg:block">
          <Link href="/" className="block" onClick={onClose}>
            <Image
              src="/onehope-logo.png"
              alt="One Hope"
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/90 hover:bg-white/20 lg:hidden"
            aria-label="Close menu"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <span className="text-xl" aria-hidden>{icon}</span>
                {label}
              </Link>
            );
          })}
          {sections.length > 0 && (
            <>
              <div className="my-2 border-t border-white/10" />
              {sections.map((sec) => {
                const href = `/section/${sec.slug}`;
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={sec._id}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] transition-colors ${
                      active ? "bg-white/20 text-white" : "hover:bg-sidebar-hover hover:text-white"
                    }`}
                  >
                    <span className="text-xl" aria-hidden>▦</span>
                    {sec.title || "Untitled section"}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
