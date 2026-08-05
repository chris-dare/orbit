"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Attachment } from "@/lib/types";
import { AttachmentChip } from "./AttachmentChip";
import { ModelSwitcher } from "./ModelSwitcher";
import { IconArrowUp, IconMic, IconPlus, IconStop, IconWaveform } from "./icons";

const DICTATION_WORDS = "What time zone is Kyoto in during November".split(" ");

let attachmentId = 0;

export function Composer({
  onSend,
  onVoice,
  isGenerating,
  onStop,
  model,
  onModelChange,
}: {
  onSend: (text: string, attachments: Attachment[]) => void;
  onVoice: () => void;
  isGenerating: boolean;
  onStop: () => void;
  model: string;
  onModelChange: (id: string) => void;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dictating, setDictating] = useState(false);
  const dictationIndex = useRef(0);
  const dictationBase = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dictating) return;
    dictationIndex.current = 0;
    dictationBase.current = value ? value.trimEnd() + " " : "";

    const interval = setInterval(() => {
      if (dictationIndex.current >= DICTATION_WORDS.length) {
        setDictating(false);
        return;
      }
      dictationIndex.current += 1;
      setValue(dictationBase.current + DICTATION_WORDS.slice(0, dictationIndex.current).join(" "));
    }, 260);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictating]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next = Array.from(files).map((file) => ({
      id: `att-${attachmentId++}`,
      name: file.name,
      size: file.size,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const submit = () => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || isGenerating) return;
    // Object URLs are handed off to the sent message, so they are not revoked here.
    onSend(text, attachments);
    setValue("");
    setAttachments([]);
    setDictating(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const iconButton =
    "shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 [transition-timing-function:var(--ease-spring)]";

  const canSend = value.trim().length > 0 || attachments.length > 0;

  return (
    <div className="px-3 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-6 pt-2">
      <div className="max-w-[720px] mx-auto">
        <div className="flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-[28px] px-1.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.15)] transition-shadow focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_-10px_rgba(10,132,255,0.35)]">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2.5 pt-2.5 pb-0.5 animate-[fadeIn_0.2s_ease]">
              {attachments.map((a) => (
                <AttachmentChip key={a.id} attachment={a} onRemove={removeAttachment} />
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={dictating ? "Listening…" : "Message"}
            className="w-full resize-none bg-transparent outline-none text-[16px] leading-6 px-2.5 pt-2.5 pb-1 max-h-40 placeholder:text-[var(--text-tertiary)]"
          />

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add attachment"
              type="button"
              className={`${iconButton} text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]`}
            >
              <IconPlus className="w-[18px] h-[18px]" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-0.5 shrink-0">
              <ModelSwitcher value={model} onChange={onModelChange} />

              {isGenerating ? (
                <button
                  onClick={onStop}
                  aria-label="Stop generating"
                  type="button"
                  className={`${iconButton} bg-[var(--text-primary)] text-[var(--bg)]`}
                >
                  <IconStop className="w-[15px] h-[15px]" />
                </button>
              ) : canSend ? (
                <button
                  onClick={submit}
                  aria-label="Send message"
                  type="button"
                  className={`${iconButton} bg-[var(--accent)] text-white`}
                >
                  <IconArrowUp className="w-[17px] h-[17px]" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setDictating((v) => !v)}
                    aria-label={dictating ? "Stop dictation" : "Dictate"}
                    aria-pressed={dictating}
                    type="button"
                    className={`${iconButton} relative ${
                      dictating
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    {dictating && (
                      <span className="absolute inset-1.5 rounded-full bg-[var(--accent-soft)] animate-ping" />
                    )}
                    <IconMic className="w-[19px] h-[19px] relative" />
                  </button>
                  <button
                    onClick={onVoice}
                    aria-label="Start voice mode"
                    type="button"
                    className={`${iconButton} bg-[var(--accent)] text-white`}
                  >
                    <IconWaveform className="w-[19px] h-[19px]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[12px] text-[var(--text-tertiary)] mt-2.5">
          Responses may be inaccurate. Verify important information.
        </p>
      </div>
    </div>
  );
}
