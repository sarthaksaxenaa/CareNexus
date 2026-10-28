"use client";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  triageLevel: "green" | "yellow" | "red" | "none" | null;
  sources: string | null;
  timestamp?: string;
}

/**
 * Clinical severity styling.
 *
 * Deliberately NOT amethyst. The Obsidian Amethyst theme stops at the triage
 * badge: emerald / amber / crimson are near-universal clinical signals and
 * re-skinning them would trade patient safety for visual consistency.
 */
const TRIAGE_CONFIG = {
  green: {
    bg: "bg-triage-green/15",
    text: "text-triage-green",
    label: "🟢 Self-care",
    border: "border-triage-green/40",
    glow: "shadow-triage-green/10",
  },
  yellow: {
    bg: "bg-triage-amber/15",
    text: "text-triage-amber",
    label: "🟡 See a doctor",
    border: "border-triage-amber/40",
    glow: "shadow-triage-amber/10",
  },
  red: {
    bg: "bg-triage-red/15",
    text: "text-triage-red",
    label: "🔴 Emergency",
    border: "border-triage-red/50",
    glow: "shadow-triage-red/20",
  },
  none: { bg: "", text: "", label: "", border: "", glow: "" },
};

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
  const triage =
    triageLevel && triageLevel !== "none" ? TRIAGE_CONFIG[triageLevel] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group animate-rise`}>
      <div className="max-w-[85%] lg:max-w-[75%] space-y-1.5">
        {/* Avatar + Name */}
        <div className={`flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
          <span className="text-xs font-medium text-ink-4">
            {isUser ? "You" : "🏥 CareNexus"}
          </span>
          {timestamp && (
            <span className="text-xs text-ink-4/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-gradient-to-br from-amethyst to-amethyst-600 text-white rounded-br-md shadow-lg shadow-amethyst/30"
              : `bg-surface text-ink-2 border rounded-bl-md shadow-lg shadow-black/40 ${
                  triage ? `${triage.border} ${triage.glow}` : "border-edge-soft"
                }`
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div
              className="prose-care text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )}
        </div>

        {/* Triage badge */}
        {triage && (
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${triage.bg} ${triage.text} ${triage.border}`}
          >
            {triage.label}
          </div>
        )}

        {/* Sources */}
        {sources && (
          <p className="text-xs text-ink-4 px-1">📚 {sources}</p>
        )}
      </div>
    </div>
  );
}

export { TRIAGE_CONFIG };
