"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Conversation, DateGroup } from "@/lib/types";
import {
  IconMoreHorizontal,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSidebar,
  IconTrash,
} from "./icons";

const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "Previous 7 Days"];

export function Sidebar({
  open,
  inert,
  onToggle,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
  conversations,
  activeId,
}: {
  /** `null` leaves the drawer to CSS: shut on mobile, open from `md:` up. That
   *  is the state the server can render correctly, so nothing animates into
   *  place on hydration. A boolean is an explicit user choice. */
  open: boolean | null;
  inert: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  conversations: Conversation[];
  activeId: string;
}) {
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuFor) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuFor]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((c) => c.group === group),
    })).filter((g) => g.items.length > 0);
  }, [query, conversations]);

  return (
    <>
      {open === true && (
        <button
          aria-label="Close sidebar"
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        // Hidden purely visually, so without this every control inside stays
        // focusable and in the accessibility tree while the drawer is shut.
        inert={inert}
        className={`fixed inset-y-0 left-0 z-40 w-[84vw] max-w-[300px] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] md:static md:z-auto md:max-w-none md:shrink-0 md:overflow-hidden md:transition-[width] ${
          open === null
            ? "-translate-x-full md:translate-x-0 md:w-[272px]"
            : open
              ? "translate-x-0 md:w-[272px]"
              : "-translate-x-full md:w-0"
        }`}
      >
        <div className="w-[84vw] max-w-[300px] md:w-[272px] h-full flex flex-col bg-[var(--surface-translucent)] backdrop-blur-xl backdrop-saturate-[1.8] border-r border-[var(--border)]">
          <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] md:pt-5 pb-3">
            <button
              onClick={onToggle}
              aria-label="Hide sidebar"
              type="button"
              className="p-1.5 -ml-1.5 rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <IconSidebar className="w-[19px] h-[19px]" />
            </button>
            <button
              onClick={onNewChat}
              aria-label="New conversation"
              type="button"
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <IconPlus className="w-[19px] h-[19px]" />
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] bg-black/[0.05] dark:bg-white/[0.09] border border-black/[0.04] dark:border-white/[0.07] focus-within:bg-black/[0.07] dark:focus-within:bg-white/[0.13] focus-within:border-[var(--accent)]/40 transition-colors">
              <IconSearch className="w-[15px] h-[15px] text-[var(--text-tertiary)] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 pb-4">
            {grouped.length === 0 && (
              <p className="px-2.5 pt-6 text-[13.5px] text-[var(--text-tertiary)] text-center">
                No conversations found
              </p>
            )}

            {grouped.map(({ group, items }) => (
              <div key={group}>
                <p className="px-2.5 pt-3 pb-1.5 text-[11px] font-semibold tracking-wide text-[var(--text-tertiary)] uppercase">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {items.map((c) => (
                    <li key={c.id} className="group relative">
                      {renamingId === c.id ? (
                        <input
                          value={renameDraft}
                          autoFocus
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => {
                            onRename(c.id, renameDraft);
                            setRenamingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onRename(c.id, renameDraft);
                              setRenamingId(null);
                            }
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full px-2.5 py-2 rounded-[10px] bg-[var(--surface)] border border-[var(--accent)] outline-none text-[14.5px] md:text-[13.5px] text-[var(--text-primary)]"
                        />
                      ) : (
                      <button
                        onClick={() => onSelect(c.id)}
                        type="button"
                        className={`w-full text-left pl-2.5 pr-9 py-2.5 md:py-2 rounded-[10px] transition-colors ${
                          c.id === activeId
                            ? "bg-[var(--accent-soft)]"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <p
                          className={`text-[14.5px] md:text-[13.5px] leading-tight truncate ${
                            c.id === activeId
                              ? "text-[var(--accent)] font-medium"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {c.title}
                        </p>
                        <p className="text-[12.5px] md:text-[12px] text-[var(--text-tertiary)] mt-0.5">
                          {c.timestamp}
                        </p>
                      </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor((v) => (v === c.id ? null : c.id));
                        }}
                        aria-label="More options"
                        type="button"
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-opacity ${
                          menuFor === c.id ? "opacity-100 bg-black/[0.06] dark:bg-white/[0.1]" : "opacity-0 group-hover:opacity-100 md:opacity-0"
                        }`}
                      >
                        <IconMoreHorizontal className="w-[16px] h-[16px]" />
                      </button>

                      {menuFor === c.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-1.5 top-[calc(100%-4px)] z-10 w-40 py-1 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] animate-[fadeIn_0.15s_ease]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setRenameDraft(c.title);
                              setRenamingId(c.id);
                              setMenuFor(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                          >
                            <IconPencil className="w-[14px] h-[14px] text-[var(--text-secondary)]" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(c.id);
                              setMenuFor(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13.5px] text-[#ff453a] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                          >
                            <IconTrash className="w-[14px] h-[14px]" />
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-3 border-t border-[var(--border)] flex items-center gap-2">
            <button
              type="button"
              className="flex-1 flex items-center gap-2.5 px-1.5 py-1.5 rounded-[10px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6]" />
              <span className="text-[13.5px] text-[var(--text-secondary)] truncate">Chris Dare</span>
            </button>
            <button
              aria-label="Settings"
              type="button"
              className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <IconSettings className="w-[17px] h-[17px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
