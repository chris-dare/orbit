"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { IconCheck, IconCopy } from "./icons";

/**
 * While a reply streams in, a fenced code block arrives with its opening ```
 * long before its closing one. Left as-is the parser treats the rest of the
 * message as code. Close the dangling fence so the partial block renders.
 */
function balanceFences(text: string) {
  const fences = (text.match(/^```/gm) ?? []).length;
  return fences % 2 === 1 ? `${text}\n\`\`\`` : text;
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const child = children as React.ReactElement<{ className?: string }> | undefined;
  const language = /language-(\w+)/.exec(child?.props?.className ?? "")?.[1];

  const copy = () => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="my-3 max-w-full rounded-[12px] border border-[var(--border)] overflow-hidden bg-[var(--code-bg)]">
      <div className="flex items-center justify-between pl-3.5 pr-1.5 py-1.5 border-b border-[var(--border)]">
        <span className="text-[11.5px] font-medium tracking-wide text-[var(--text-tertiary)] uppercase">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          {copied ? (
            <>
              <IconCheck className="w-[12px] h-[12px] text-[var(--accent)]" />
              Copied
            </>
          ) : (
            <>
              <IconCopy className="w-[12px] h-[12px]" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre ref={preRef} className="px-3.5 py-3 overflow-x-auto text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function Markdown({ children, streaming }: { children: string; streaming?: boolean }) {
  return (
    <div className="md min-w-0 max-w-full" data-streaming={streaming ? "true" : undefined}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre: CodeBlock,
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {balanceFences(children)}
      </ReactMarkdown>
    </div>
  );
}
