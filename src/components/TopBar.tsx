"use client";

import { IconSidebar } from "./icons";

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  title,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  title: string;
}) {
  return (
    <header className="min-h-14 shrink-0 flex items-center gap-3 px-3 sm:px-4 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2.5 sm:pt-0 sm:pb-0 border-b border-[var(--border)] bg-[var(--surface-translucent)] backdrop-blur-xl">
      {!sidebarOpen && (
        <button
          onClick={onToggleSidebar}
          aria-label="Show sidebar"
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <IconSidebar className="w-[19px] h-[19px]" />
        </button>
      )}
      <h1 className="text-[15px] font-medium text-[var(--text-primary)] truncate">{title}</h1>
    </header>
  );
}
