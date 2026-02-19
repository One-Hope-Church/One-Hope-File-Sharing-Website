"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

interface AppShellProps {
  children: React.ReactNode;
  user?: { email: string; role: string } | null;
  showUpload?: boolean;
  sections: Array<{ _id: string; title: string; slug: string }>;
}

export default function AppShell({ children, user, showUpload, sections }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        sections={sections}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-[280px]">
        <TopBar
          user={user}
          showUpload={showUpload}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
