"use client";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  triageLevel: "green" | "yellow" | "red" | "none" | null;
  sources: string | null;
  timestamp?: string;
}

const TRIAGE_CONFIG = {
  green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "🟢 Self-care", border: "border-green-200 dark:border-green-800" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "🟡 See a doctor", border: "border-yellow-200 dark:border-yellow-800" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "🔴 Emergency", border: "border-red-200 dark:border-red-800" },
  none: { bg: "", text: "", label: "", border: "" },
};

function renderMarkdown(text: string): string {
  let html = text
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">$1</code>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-700" target="_blank" rel="noopener">$1</a>')
    // Italic: *text* (after bold is already replaced)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists: - item
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists: 1. item
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />");

  // Wrap list items
  html = html.replace(
    /(<li class="ml-4 list-disc">[^]*?<\/li>)+/g,
    '<ul class="my-2 space-y-1">$&</ul>'
  );
  html = html.replace(
    /(<li class="ml-4 list-decimal">[^]*?<\/li>)+/g,
    '<ol class="my-2 space-y-1">$&</ol>'
  );

  return `<p>${html}</p>`;
}

export default function MessageBubble({
  role,
  content,
  triageLevel,
  sources,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const triage = triageLevel && triageLevel !== "none" ? TRIAGE_CONFIG[triageLevel] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      <div className="max-w-[85%] lg:max-w-[75%] space-y-1.5">
        {/* Avatar + Name */}
        <div className={`flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {isUser ? "You" : "🏥 CareNexus"}
          </span>
          {timestamp && (
            <span className="text-xs text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : `bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md ${
                  triage ? triage.border : ""
                }`
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )}
        </div>

        {/* Triage badge */}
        {triage && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${triage.bg} ${triage.text}`}>
            {triage.label}
          </div>
        )}

        {/* Sources */}
        {sources && (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
            📚 {sources}
          </p>
        )}
      </div>
    </div>
  );
}

export { TRIAGE_CONFIG };
