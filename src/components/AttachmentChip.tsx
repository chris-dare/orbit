"use client";

import Image from "next/image";
import { Attachment } from "@/lib/types";
import { IconClose, IconDocument } from "./icons";

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="group/chip relative flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-[10px] bg-black/[0.04] dark:bg-white/[0.07] border border-[var(--border)] max-w-[220px]">
      <span className="shrink-0 w-7 h-7 rounded-[7px] overflow-hidden flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.08]">
        {attachment.previewUrl ? (
          <Image
            src={attachment.previewUrl}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="w-full h-full object-cover"
          />
        ) : (
          <IconDocument className="w-[15px] h-[15px] text-[var(--text-secondary)]" />
        )}
      </span>

      <span className="min-w-0">
        <span className="block text-[12.5px] text-[var(--text-primary)] truncate">
          {attachment.name}
        </span>
        <span className="block text-[11px] text-[var(--text-tertiary)]">
          {formatSize(attachment.size)}
        </span>
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(attachment.id)}
          aria-label={`Remove ${attachment.name}`}
          className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[var(--text-secondary)] text-[var(--surface)] flex items-center justify-center opacity-0 group-hover/chip:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <IconClose className="w-[10px] h-[10px]" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
