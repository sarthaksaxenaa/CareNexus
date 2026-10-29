"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ChatSessionInfo } from "@/lib/api";
import { WORDMARK_ACCENT } from "@/lib/styles";

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) return;

    // Cancellation flag: if the user switches session (or the component
    // unmounts) before the request resolves, drop the stale response instead
    // of overwriting newer state or updating an unmounted component.
    let cancelled = false;

    const loadSessions = async () => {
      try {
        const data = await api.getSessions();
        if (!cancelled) setSessions(data);
      } catch {
        // silently fail — sidebar is non-critical
      }
    };

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [currentSessionId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-2 z-50 p-2 bg-surface-2 rounded-lg shadow-lg shadow-black/50 border border-edge hover:border-amethyst-600 transition-colors duration-200"
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full w-72 bg-surface-2 border-r border-edge flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-edge">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏥</span>
            <h1 className="text-lg font-bold tracking-tight text-ink">
              Care<span className={WORDMARK_ACCENT}>Nexus</span>
            </h1>
          </Link>
          <button
            onClick={() => { onNewChat(); setIsOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white
                       bg-gradient-to-r from-amethyst to-amethyst-500
                       hover:from-amethyst-600 hover:to-amethyst-400
                       shadow-lg shadow-amethyst/30 active:scale-[0.99]
                       transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Health Check
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-3 py-2 text-xs font-medium text-ink-4 uppercase tracking-wider">
            Recent Sessions
          </p>
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-ink-4 text-center">
              No sessions yet. Start a new health check!
            </p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((session) => {
                const isActive = currentSessionId === session.id;
                return (
                  <li key={session.id}>
                    <button
                      onClick={() => { onSelectSession(session.id); setIsOpen(false); }}
                      aria-current={isActive ? "true" : undefined}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm group transition-all duration-200 ${
                        isActive
                          ? "bg-amethyst/25 text-amethyst-200 ring-1 ring-amethyst-600/50"
                          : "text-ink-3 hover:bg-surface-3 hover:text-ink-2"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">💬</span>
                        <span className="truncate font-medium">{session.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-7">
                        <span className="text-xs text-ink-4">
                          {session.message_count} messages
                        </span>
                        <span className="text-xs text-ink-4">•</span>
                        <span className="text-xs text-ink-4">
                          {formatDate(session.created_at)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer nav */}
        <div className="p-3 border-t border-edge space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-4 hover:bg-surface-3 hover:text-ink-2 rounded-lg transition-colors duration-200"
          >
            <span>🩺</span> Health Profile
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-4 hover:bg-surface-3 hover:text-ink-2 rounded-lg transition-colors duration-200"
          >
            <span>ℹ️</span> About CareNexus
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-void/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
