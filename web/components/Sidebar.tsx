"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = [
  { href: "https://onehopechurch.com", label: "About", icon: "ℹ" },
  { href: "https://onehopechurch.com/contact", label: "Contact", icon: "✉" },
  { href: "https://onehopechurch.com/privacy", label: "Privacy", icon: "📄" },
];

interface SidebarProps {
  sections: Array<{ _id: string; title: string; slug: string }>;
}

export default function Sidebar({ sections = [] }: SidebarProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/", label: "Home", icon: "⌂" },
    { href: "/myresources", label: "My Resources", icon: "▦" },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-[280px] flex-col bg-sidebar text-sidebar-text">
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-6">
          <Link href="/" className="text-lg font-semibold text-white">
            One Hope Resources
          </Link>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] transition-colors ${
                  active
                    ? "bg-primary/20 text-white"
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
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[16px] transition-colors ${
                      active ? "bg-primary/20 text-white" : "hover:bg-sidebar-hover hover:text-white"
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
        <div className="mt-auto border-t border-white/10 pt-4">
          {footerLinks.map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] hover:bg-sidebar-hover hover:text-white"
            >
              <span aria-hidden>{icon}</span>
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
