"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { IconClose, IconKeyboard } from "./icons";

type VoiceState = "listening" | "thinking" | "speaking";

const USER_UTTERANCE =
  "Give me a one-sentence pitch for a conversational UI inspired by Apple's design language.";
const ASSISTANT_REPLY =
  "An interface that gets out of the way — quiet materials, restrained motion, and type that carries the whole conversation without shouting for attention.";

export function VoiceOverlay({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<VoiceState>("listening");
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");

  useEffect(() => {
    let i = 0;
    const listenTimer = setInterval(() => {
      i++;
      setUserText(USER_UTTERANCE.slice(0, i));
      if (i >= USER_UTTERANCE.length) {
        clearInterval(listenTimer);
        setState("thinking");
        setTimeout(() => {
          setState("speaking");
          let j = 0;
          const speakTimer = setInterval(() => {
            j++;
            setAssistantText(ASSISTANT_REPLY.slice(0, j));
            if (j >= ASSISTANT_REPLY.length) clearInterval(speakTimer);
          }, 22);
        }, 1200);
      }
    }, 28);
    return () => clearInterval(listenTimer);
  }, []);

  const label = state === "listening" ? "Listening…" : state === "thinking" ? "Thinking…" : "Speaking…";
  const userFinalized = state !== "listening";

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-2xl data-[state=open]:animate-[fadeIn_0.25s_ease]" />
        <Dialog.Popup
          className="fixed inset-0 z-50 flex flex-col items-center justify-between outline-none"
          finalFocus={false}
        >
          <Dialog.Title className="sr-only">Voice mode</Dialog.Title>
          <Dialog.Description className="sr-only">
            A live voice conversation. Press Escape or Switch to text to exit.
          </Dialog.Description>

          <div className="w-full flex justify-end px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
            <Dialog.Close
              aria-label="Exit voice mode"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] transition-colors"
            >
              <IconClose className="w-[16px] h-[16px]" />
            </Dialog.Close>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-6 px-6 sm:px-8">
            <div
              className={`relative w-40 h-40 sm:w-52 sm:h-52 rounded-full [animation-timing-function:ease-in-out] ${
                state === "listening"
                  ? "animate-[orb-listen_2.4s_ease-in-out_infinite]"
                  : state === "thinking"
                  ? "animate-[orb-pulse_1s_ease-in-out_infinite]"
                  : "animate-[orb-pulse_1.6s_ease-in-out_infinite]"
              }`}
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, #0a84ff, #5e5ce6, #bf5af2, #ff375f, #0a84ff)",
                WebkitMaskImage: "radial-gradient(circle, black 86%, transparent 100%)",
                maskImage: "radial-gradient(circle, black 86%, transparent 100%)",
                boxShadow: "0 30px 90px -20px rgba(94, 92, 230, 0.55)",
              }}
            >
              <div className="absolute inset-3 rounded-full bg-[var(--bg)]/90 backdrop-blur-xl" />
            </div>

            <p className="text-[13px] font-medium tracking-wide text-[var(--text-tertiary)] uppercase">
              {label}
            </p>

            <div className="flex flex-col items-center gap-4 w-full">
              {userText && (
                <div
                  className={`flex flex-col items-center gap-1.5 transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
                    userFinalized ? "opacity-55 scale-[0.92]" : "opacity-100"
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                    You
                  </span>
                  <p
                    className={`text-center leading-relaxed text-[var(--text-secondary)] max-w-[480px] ${
                      userFinalized
                        ? "text-[14px] sm:text-[15px]"
                        : "text-[16px] sm:text-[19px] text-[var(--text-primary)]"
                    }`}
                  >
                    {userText}
                  </p>
                </div>
              )}

              {(state === "thinking" || state === "speaking") && (
                <div className="flex flex-col items-center gap-1.5 animate-[fadeIn_0.35s_ease]">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[var(--accent)] uppercase">
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2]" />
                    Orbit
                  </span>
                  <p className="max-w-[520px] text-center text-[16px] sm:text-[19px] leading-relaxed text-[var(--text-primary)] font-medium min-h-[1.5em]">
                    {assistantText}
                    {state === "thinking" && (
                      <span className="inline-flex items-center gap-1 align-middle ml-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-[5px] h-[5px] rounded-full bg-[var(--text-tertiary)] animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                          />
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex justify-center pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
            <Dialog.Close className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[13.5px] font-medium text-[var(--text-secondary)] shadow-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-colors">
              <IconKeyboard className="w-[16px] h-[16px]" />
              Switch to text
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
