"use client";

import { Message, ToolCall } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { IconAlert, IconCheck, IconChevronDown, IconCopy, IconGlobe, IconPencil, IconRefresh } from "./icons";
import { Markdown } from "./Markdown";
import { AttachmentChip } from "./AttachmentChip";

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full bg-[var(--text-tertiary)] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function ToolCallCard({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = call.status === "running";

  return (
    <div className="w-full max-w-[420px] rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden animate-[fadeIn_0.3s_ease]">
      <button
        type="button"
        onClick={() => !isRunning && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left ${
          isRunning ? "cursor-default" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        }`}
      >
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            isRunning ? "bg-[var(--accent-soft)]" : "bg-black/[0.05] dark:bg-white/[0.08]"
          }`}
        >
          {isRunning ? (
            <span className="w-3 h-3 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          ) : (
            <IconGlobe className="w-[13px] h-[13px] text-[var(--text-secondary)]" />
          )}
        </span>

        <span className="flex-1 min-w-0 text-[14.5px] text-[var(--text-primary)] truncate">
          {isRunning ? call.runningLabel : call.label}
        </span>

        {isRunning ? (
          <IconCheck className="w-[14px] h-[14px] text-transparent shrink-0" />
        ) : (
          <IconChevronDown
            className={`w-[14px] h-[14px] text-[var(--text-tertiary)] shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {!isRunning && expanded && (
        <div className="px-3.5 pb-3 pt-0.5 animate-[fadeIn_0.2s_ease]">
          <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)] border-t border-[var(--border)] pt-2.5">
            {call.detail}
          </p>
        </div>
      )}
    </div>
  );
}

function ReasoningBlock({ message }: { message: Message }) {
  const streaming = message.reasoningStatus === "streaming";
  const [expanded, setExpanded] = useState(true);
  const wasStreaming = useRef(streaming);

  useEffect(() => {
    if (wasStreaming.current && !streaming) setExpanded(false);
    wasStreaming.current = streaming;
  }, [streaming]);

  if (!message.reasoning) return null;

  return (
    <div className="w-full max-w-[480px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[13.5px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {streaming && (
          <span className="w-3 h-3 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
        )}
        <span>{streaming ? "Thinking…" : `Thought for ${message.reasoningSeconds ?? 1}s`}</span>
        <IconChevronDown
          className={`w-[12px] h-[12px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <p className="mt-1.5 pl-3 border-l-2 border-[var(--border)] text-[13.5px] leading-relaxed text-[var(--text-tertiary)] animate-[fadeIn_0.2s_ease]">
          {message.reasoning}
        </p>
      )}
    </div>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      aria-label="Copy message"
      className={`w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors ${className ?? ""}`}
    >
      {copied ? (
        <IconCheck className="w-[13px] h-[13px] text-[var(--accent)]" />
      ) : (
        <IconCopy className="w-[13px] h-[13px]" />
      )}
    </button>
  );
}

function ErrorCard({ onRetry, disabled }: { onRetry: () => void; disabled: boolean }) {
  return (
    <div className="flex items-start gap-2.5 w-full max-w-[440px] px-3.5 py-3 rounded-[14px] border border-[#ff453a]/25 bg-[#ff453a]/[0.07] animate-[fadeIn_0.3s_ease]">
      <IconAlert className="w-[17px] h-[17px] shrink-0 mt-px text-[#ff453a]" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug text-[var(--text-primary)]">
          The response stopped before it finished.
        </p>
        <p className="text-[12.5px] leading-snug text-[var(--text-secondary)] mt-0.5">
          Check your connection and try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="shrink-0 px-2.5 py-1 rounded-full text-[12.5px] font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-40 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function Bubble({
  message,
  canRegenerate,
  disabled,
  onEditSubmit,
  onRegenerate,
}: {
  message: Message;
  canRegenerate: boolean;
  disabled: boolean;
  onEditSubmit: (id: string, text: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const hasText = message.content.length > 0;
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const showThinking = message.status === "thinking" && !hasToolCalls && !message.reasoning;
  const isSettled = !message.status || message.status === "done";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const submitEdit = () => {
    const text = draft.trim();
    if (text && text !== message.content) onEditSubmit(message.id, text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex justify-end animate-[fadeIn_0.2s_ease]">
        <div className="flex flex-col gap-2 items-end w-full max-w-[min(640px,92%)] sm:max-w-[min(640px,88%)]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={Math.min(6, Math.max(2, draft.split("\n").length))}
            className="w-full resize-none rounded-[18px] border border-[var(--accent)] bg-[var(--surface)] px-4 py-2.5 text-[16px] leading-relaxed text-[var(--text-primary)] outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(message.content);
                setEditing(false);
              }}
              className="px-3 py-1.5 rounded-full text-[13.5px] font-medium text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              className="px-3.5 py-1.5 rounded-full text-[13.5px] font-medium bg-[var(--accent)] text-white transition-transform active:scale-95"
            >
              Save & submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"} animate-[fadeIn_0.35s_ease]`}>
      <div
        className={`flex flex-col gap-2 min-w-0 max-w-[min(640px,92%)] sm:max-w-[min(640px,88%)] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {!isUser && <ReasoningBlock message={message} />}
        {message.toolCalls?.map((call) => <ToolCallCard key={call.id} call={call} />)}

        {message.attachments && message.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isUser ? "justify-end" : ""}`}>
            {message.attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} />
            ))}
          </div>
        )}

        {(hasText || showThinking) && (
          <div
            className={`min-w-0 max-w-full px-4 py-2.5 text-[16px] leading-relaxed ${
              isUser
                ? "bg-[var(--accent)] text-white rounded-[20px] rounded-br-[6px]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {showThinking ? (
              <ThinkingDots />
            ) : isUser ? (
              message.content
            ) : (
              <Markdown streaming={message.status === "streaming"}>{message.content}</Markdown>
            )}
          </div>
        )}

        {message.status === "error" && (
          <ErrorCard onRetry={() => onRegenerate(message.id)} disabled={disabled} />
        )}

        {hasText && isSettled && (
          <div
            className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
              isUser ? "pr-1" : "pl-1"
            }`}
          >
            <CopyButton text={message.content} />
            {isUser && !disabled && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit message"
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              >
                <IconPencil className="w-[13px] h-[13px]" />
              </button>
            )}
            {!isUser && canRegenerate && !disabled && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                aria-label="Regenerate response"
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              >
                <IconRefresh className="w-[13px] h-[13px]" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  isGenerating,
  onEditSubmit,
  onRegenerate,
}: {
  messages: Message[];
  isGenerating: boolean;
  onEditSubmit: (id: string, text: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  const lastCount = useRef(messages.length);
  /**
   * Whether the view should follow new content. Only genuine user intent
   * (wheel, drag, keyboard) unpins it — never a programmatic scroll, whose
   * intermediate positions would otherwise read as "the user scrolled away".
   */
  const pinned = useRef(true);
  const touchY = useRef(0);

  const distanceFromBottom = () => {
    const el = scrollRef.current;
    if (!el) return 0;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    // Scroll the container to its true bottom rather than into view of a
    // marker, which would leave the list's bottom padding as a resting gap.
    el?.scrollTo({ top: el.scrollHeight, behavior });
  };

  const unpin = () => {
    if (distanceFromBottom() > 24) pinned.current = false;
  };

  const onScroll = () => {
    const d = distanceFromBottom();
    if (d < 24) pinned.current = true; // scrolled back down: resume following
    setShowJump(!pinned.current && d > 120);
  };

  useEffect(() => {
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    // A brand-new message always pulls you down and re-pins; token-by-token
    // growth only follows if you hadn't scrolled away.
    if (grew) {
      pinned.current = true;
      setShowJump(false);
      scrollToBottom("smooth");
    } else if (pinned.current) {
      scrollToBottom("auto");
    }
  }, [messages]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        role="log"
        aria-label="Conversation"
        // role="log" already implies aria-live="polite"; stating it again adds
        // nothing. aria-busy is what matters: a reply arrives one word at a
        // time, and without this every tick queues its own announcement, so the
        // reply gets read back incrementally instead of once when it settles.
        aria-busy={isGenerating}
        // Makes the transcript reachable by keyboard, which it has to be to
        // scroll — and without which the ArrowUp/PageUp handler below can
        // never fire.
        tabIndex={0}
        onScroll={onScroll}
        onWheel={(e) => {
          if (e.deltaY < 0) unpin();
        }}
        onTouchStart={(e) => {
          touchY.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          // finger travelling down the screen means scrolling up through history
          if (e.touches[0].clientY > touchY.current) unpin();
          touchY.current = e.touches[0].clientY;
        }}
        onKeyDown={(e) => {
          if (["ArrowUp", "PageUp", "Home"].includes(e.key)) unpin();
        }}
        className="h-full overflow-y-auto"
      >
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-4 sm:gap-5">
          {messages.map((m) => (
            <Bubble
              key={m.id}
              message={m}
              canRegenerate={m.id === lastAssistantId}
              disabled={isGenerating}
              onEditSubmit={onEditSubmit}
              onRegenerate={onRegenerate}
            />
          ))}
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          aria-label="Scroll to latest"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors animate-[fadeIn_0.2s_ease]"
        >
          <IconChevronDown className="w-[17px] h-[17px]" />
        </button>
      )}
    </div>
  );
}
