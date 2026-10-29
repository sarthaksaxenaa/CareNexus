"use client";

import { TRACKED } from "@/lib/styles";
import { parseApiDate } from "@/lib/time";
import { TRIAGE, asTriageLevel } from "@/lib/triage";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  triageLevel: "green" | "yellow" | "red" | "none" | null;
  sources: string | null;
  timestamp?: string;
}

/**
 * Escapes HTML before any markdown transformation.
 *
 * The result is handed to dangerouslySetInnerHTML, so raw angle brackets that
 * survive into the output would be live markup. The backend sanitizer guards
 * the inbound path, but defence in depth belongs on the render path too.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Inline spans: bold, code, links, italics. Order matters. */
function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/**
 * Minimal block-level markdown renderer.
 *
 * Replaces a regex-only implementation that interleaved <br /> between list
 * items, so `<ul>`/`<ol>` never wrapped cleanly. This walks lines instead and
 * groups consecutive list items into a single list, which is both correct and
 * far easier to reason about. Styling lives in `.prose-care` (globals.css) —
 * the previous `prose prose-sm dark:prose-invert` classes were inert because
 * @tailwindcss/typography is not a dependency of this project.
 */
function renderMarkdown(text: string): string {
  const lines = escapeHtml(text).split("\n");
  const out: string[] = [];

  let listTag: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${renderInline(paragraph.join("<br />"))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`);
      listTag = null;
    }
  };

  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);

    if (bullet || numbered) {
      closeParagraph();
      const wanted: "ul" | "ol" = bullet ? "ul" : "ol";
      if (listTag !== wanted) {
        closeList();
        out.push(`<${wanted}>`);
        listTag = wanted;
      }
      const item = (bullet ?? numbered)![1];
      out.push(`<li>${renderInline(item)}</li>`);
      continue;
    }

    closeList();

    if (line.trim() === "") {
      closeParagraph();
      continue;
    }

    paragraph.push(line);
  }

  closeList();
  closeParagraph();

  return out.join("");
}

export default function MessageBubble({
  role,
  content,
  triageLevel,
  sources,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const level = isUser ? null : asTriageLevel(triageLevel);
  const triage = level ? TRIAGE[level] : null;
  const time = timestamp
    ? parseApiDate(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  if (isUser) {
    return (
      <div className="flex justify-end animate-rise">
        <div className="max-w-[85%] lg:max-w-[70%]">
          <p className="whitespace-pre-wrap rounded-sm bg-amethyst/45 px-4 py-3 text-[15px] font-light leading-relaxed text-ink ring-1 ring-inset ring-amethyst-200/15">
            {content}
          </p>
          {time && <p className="mt-1.5 text-right text-xs text-ink-4">{time}</p>}
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-[92%] lg:max-w-[78%] animate-rise">
      <header className="mb-2 flex items-baseline gap-3">
        <span className="font-display text-lg italic text-lilac">CareNexus</span>
        {time && <span className="text-xs text-ink-4">{time}</span>}
      </header>

      {triage && (
        <p className={`mb-3 flex items-center gap-2.5 ${TRACKED} ${triage.text}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${triage.dot}`} />
          {triage.label}
        </p>
      )}

      <div
        className={`prose-care border-l pl-5 text-[15px] font-light leading-relaxed text-ink-2 ${
          triage ? triage.rule : "border-edge"
        }`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {sources && (
        <p className="mt-3 pl-5 text-xs font-light text-ink-4">Sources: {sources}</p>
      )}
    </article>
  );
}
