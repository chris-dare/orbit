"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { Attachment, Conversation, Message, ToolCall } from "@/lib/types";
import { conversations as seedConversations } from "@/lib/mock";
import { useClientValue, useMediaQuery } from "@/lib/client-only";

const NEW_CHAT_ID = "new";

const titleFrom = (text: string) =>
  text.trim().split("\n")[0].slice(0, 42) || "New conversation";

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

const REASONING_TEXT =
  "The user wants a focused, opinionated answer about motion in Apple's design language — I should reference restraint and purposeful animation rather than generic marketing language, and keep it to a couple of sentences.";

const ASSISTANT_REPLY = `Apple's guidance on motion comes down to one idea: **animation should explain a change, not decorate it.** Every transition ought to answer "where did this come from, and where did it go?"

### What that looks like in practice

- **Motion carries continuity.** A sheet slides up from the control that opened it, so the origin is never ambiguous.
- **Duration stays short.** Most system transitions land between \`0.2s\` and \`0.35s\` — long enough to read, short enough to stay out of the way.
- **Easing is asymmetric.** Things accelerate out and decelerate in, the way physical objects do.
- **Nothing moves without cause.** Ambient or looping animation is reserved for status, never ornament.

The spring curve used throughout this interface follows the same principle:

\`\`\`css
:root {
  /* Slight overshoot, then settle — reads as physical, not bouncy */
  --ease-spring: cubic-bezier(0.34, 1.32, 0.42, 1);
}

.sheet {
  transition: transform 0.3s var(--ease-spring);
}
\`\`\`

One caveat worth building in from the start: all of this must collapse gracefully when someone has **Reduce Motion** enabled. Treat that as a first-class state, not an afterthought.`;

const TOOL_CALL: Omit<ToolCall, "status"> = {
  id: "tool-1",
  label: "Searched the web for Apple design language",
  runningLabel: "Searching the web…",
  detail:
    'Query: "Apple Human Interface Guidelines conversational UI"\nFound 4 relevant sources on typography, materials, and motion.',
};

export default function Home() {
  // The sidebar follows the viewport until the user says otherwise. A choice
  // only holds at the width it was made at, so crossing the breakpoint falls
  // back to the viewport default — otherwise closing the drawer once on a
  // phone would pin it shut for the rest of the session, including on desktop.
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sidebarPref, setSidebarPref] = useState<{ open: boolean; atDesktop: boolean } | null>(
    null
  );
  // null means "no choice applies here" — the sidebar is left to CSS, so the
  // server can emit correct markup and desktop doesn't paint it collapsed and
  // then slide it open on hydration.
  const sidebarChoice = sidebarPref && sidebarPref.atDesktop === isDesktop ? sidebarPref.open : null;
  const sidebarOpen = sidebarChoice ?? isDesktop;
  const setSidebarOpen = (open: boolean) => setSidebarPref({ open, atDesktop: isDesktop });
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [threads, setThreads] = useState<Record<string, Message[]>>(() =>
    Object.fromEntries(seedConversations.map((c) => [c.id, c.messages]))
  );
  const [activeId, setActiveId] = useState<string>(NEW_CHAT_ID);
  const activeIdRef = useRef(activeId);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Depends on the viewer's local clock, so it can only be resolved in the
  // browser; the server renders nothing rather than a mismatched greeting.
  const greeting = useClientValue(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    return `Good ${period}, Chris`;
  }, "");
  const [model, setModel] = useState("pro");
  const genRef = useRef<{
    timeouts: ReturnType<typeof setTimeout>[];
    interval?: ReturnType<typeof setInterval>;
    reasoningStart?: number;
  }>({ timeouts: [] });

  const messages = threads[activeId] ?? [];

  /** Writes into a specific conversation, so an in-flight turn keeps
   *  targeting its own thread even if the user navigates away. */
  const writeThread =
    (convId: string) =>
    (updater: Message[] | ((prev: Message[]) => Message[])) =>
      setThreads((prev) => ({
        ...prev,
        [convId]: typeof updater === "function" ? updater(prev[convId] ?? []) : updater,
      }));

  const setMessages = writeThread(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const clearGeneration = () => {
    genRef.current.timeouts.forEach(clearTimeout);
    genRef.current.timeouts = [];
    clearInterval(genRef.current.interval);
  };

  useEffect(() => clearGeneration, []);

  const closeSidebarOnMobile = () => {
    if (!isDesktop) setSidebarOpen(false);
  };

  /** Settles whatever is mid-flight so a thread is never left mid-stream. */
  const finalizeInFlight = (convId: string) => {
    writeThread(convId)((prev) =>
      prev.map((m) => {
        if (m.status !== "thinking" && m.status !== "streaming") return m;
        return {
          ...m,
          status: m.content ? "done" : "error",
          reasoningStatus: m.reasoningStatus === "streaming" ? "done" : m.reasoningStatus,
          reasoningSeconds:
            m.reasoningStatus === "streaming" && genRef.current.reasoningStart
              ? Math.max(1, Math.round((Date.now() - genRef.current.reasoningStart) / 1000))
              : m.reasoningSeconds,
          toolCalls: m.toolCalls?.map((t) => ({ ...t, status: "done" })),
        };
      })
    );
  };

  const handleNewChat = () => {
    clearGeneration();
    if (isGenerating) finalizeInFlight(activeIdRef.current);
    setIsGenerating(false);
    setThreads((prev) => ({ ...prev, [NEW_CHAT_ID]: [] }));
    setActiveId(NEW_CHAT_ID);
    activeIdRef.current = NEW_CHAT_ID;
    closeSidebarOnMobile();
  };

  const handleSelectConversation = (id: string) => {
    if (id === activeId) {
      closeSidebarOnMobile();
      return;
    }
    clearGeneration();
    if (isGenerating) finalizeInFlight(activeIdRef.current);
    setIsGenerating(false);
    setActiveId(id);
    activeIdRef.current = id;
    closeSidebarOnMobile();
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setThreads((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (id === activeId) {
      clearGeneration();
      setIsGenerating(false);
      setActiveId(NEW_CHAT_ID);
      activeIdRef.current = NEW_CHAT_ID;
    }
  };

  const handleRenameConversation = (id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: clean } : c)));
  };

  const handleStop = () => {
    clearGeneration();
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.status !== "thinking" && m.status !== "streaming") return m;
        const reasoningStatus = m.reasoningStatus === "streaming" ? "done" : m.reasoningStatus;
        const reasoningSeconds =
          m.reasoningStatus === "streaming" && genRef.current.reasoningStart
            ? Math.max(1, Math.round((Date.now() - genRef.current.reasoningStart) / 1000))
            : m.reasoningSeconds;
        return {
          ...m,
          status: "done",
          reasoningStatus,
          reasoningSeconds,
          toolCalls: m.toolCalls?.map((t) => ({ ...t, status: "done" })),
        };
      })
    );
  };

  const streamWords = (
    text: string,
    delayMs: number,
    onTick: (partial: string, done: boolean) => void,
    onComplete: () => void
  ) => {
    const words = text.split(" ");
    let i = 0;
    genRef.current.interval = setInterval(() => {
      i++;
      const done = i >= words.length;
      onTick(words.slice(0, i).join(" "), done);
      if (done) {
        clearInterval(genRef.current.interval);
        onComplete();
      }
    }, delayMs);
  };

  const runAssistantTurn = (base: Message[], forceFail = false) => {
    const replyId = nextId();
    const convId = activeIdRef.current;
    const write = writeThread(convId);
    genRef.current.timeouts = [];
    genRef.current.reasoningStart = Date.now();

    write([
      ...base,
      { id: replyId, role: "assistant", content: "", status: "thinking", reasoning: "", reasoningStatus: "streaming" },
    ]);
    setIsGenerating(true);

    streamWords(
      REASONING_TEXT,
      22,
      (partial) => {
        write((prev) => prev.map((m) => (m.id === replyId ? { ...m, reasoning: partial } : m)));
      },
      () => {
        const seconds = Math.max(1, Math.round((Date.now() - (genRef.current.reasoningStart ?? Date.now())) / 1000));
        write((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, reasoningStatus: "done", reasoningSeconds: seconds } : m
          )
        );

        const t1 = setTimeout(() => {
          write((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, toolCalls: [{ ...TOOL_CALL, status: "running" }] } : m
            )
          );

          const t2 = setTimeout(() => {
            write((prev) =>
              prev.map((m) =>
                m.id === replyId
                  ? { ...m, toolCalls: m.toolCalls?.map((t) => ({ ...t, status: "done" })) }
                  : m
              )
            );

            const t3 = setTimeout(() => {
              write((prev) =>
                prev.map((m) => (m.id === replyId ? { ...m, status: "streaming" } : m))
              );
              const words = ASSISTANT_REPLY.split(" ");
              // Cut the stream off partway to exercise the failure path.
              const failAt = Math.floor(words.length * 0.35);

              streamWords(
                ASSISTANT_REPLY,
                45,
                (partial, done) => {
                  const wordsSoFar = partial.split(" ").length;
                  if (forceFail && wordsSoFar >= failAt) {
                    clearInterval(genRef.current.interval);
                    write((prev) =>
                      prev.map((m) =>
                        m.id === replyId ? { ...m, content: partial, status: "error" } : m
                      )
                    );
                    setIsGenerating(false);
                    return;
                  }
                  write((prev) =>
                    prev.map((m) =>
                      m.id === replyId ? { ...m, content: partial, status: done ? "done" : "streaming" } : m
                    )
                  );
                },
                () => setIsGenerating(false)
              );
            }, 400);
            genRef.current.timeouts.push(t3);
          }, 1000);
          genRef.current.timeouts.push(t2);
        }, 300);
        genRef.current.timeouts.push(t1);
      }
    );
  };

  const handleSend = (text: string, attachments: Attachment[] = []) => {
    const userMsg: Message = {
      id: nextId(),
      role: "user",
      content: text,
      attachments: attachments.length ? attachments : undefined,
    };
    if (activeId === NEW_CHAT_ID) {
      const convId = `c-${Date.now()}`;
      setConversations((prev) => [
        { id: convId, title: titleFrom(text), timestamp: "Now", group: "Today", messages: [] },
        ...prev,
      ]);
      setThreads((prev) => ({ ...prev, [convId]: [], [NEW_CHAT_ID]: [] }));
      setActiveId(convId);
      // set synchronously so the turn below targets the new thread
      activeIdRef.current = convId;
    }

    runAssistantTurn([...messages, userMsg], /fail|error/i.test(text));
  };

  const handleEditSubmit = (id: string, text: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) return;
    clearGeneration();
    const base = messages.slice(0, index);
    runAssistantTurn([...base, { id: nextId(), role: "user", content: text }]);
  };

  const handleRegenerate = (id: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) return;
    clearGeneration();
    runAssistantTurn(messages.slice(0, index));
  };

  return (
    <div className="flex h-dvh w-full">
      <Sidebar
        open={sidebarChoice}
        inert={!sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        conversations={conversations}
        activeId={activeId}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar
          sidebarOpen={sidebarChoice}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={conversations.find((c) => c.id === activeId)?.title ?? "New conversation"}
        />

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[8vh] animate-[fadeIn_0.4s_ease]">
            <p className="text-[22px] sm:text-[28px] font-medium text-[var(--text-primary)] mb-6 text-center">
              {greeting || " "}
            </p>
            <div className="w-full">
              <Composer
                onSend={handleSend}
                onVoice={() => setVoiceOpen(true)}
                isGenerating={isGenerating}
                onStop={handleStop}
                model={model}
                onModelChange={setModel}
              />
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              isGenerating={isGenerating}
              onEditSubmit={handleEditSubmit}
              onRegenerate={handleRegenerate}
            />
            <Composer
              onSend={handleSend}
              onVoice={() => setVoiceOpen(true)}
              isGenerating={isGenerating}
              onStop={handleStop}
              model={model}
              onModelChange={setModel}
            />
          </>
        )}
      </main>

      {voiceOpen && <VoiceOverlay onClose={() => setVoiceOpen(false)} />}
    </div>
  );
}
