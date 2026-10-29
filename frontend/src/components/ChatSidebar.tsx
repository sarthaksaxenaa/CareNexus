"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ChatSessionInfo } from "@/lib/api";
import { TRACKED } from "@/lib/styles";
import { parseApiDate } from "@/lib/time";
import Wordmark from "./Wordmark";

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  /** Changes whenever the open conversation gains messages, so counts and
   *  ordering stay current without switching sessions. */
  refreshKey?: number;
}

/** "Just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
function lastActive(dateStr: string): string {
  const date = parseApiDate(dateStr);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "Yesterday" : `${days} days ago`;
  return date.toLocaleDateString();
}

export default function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshKey = 0,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSessionInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Read after mount: localStorage is not available during server rendering.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const authed = api.isAuthenticated();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignedIn(authed);
    if (!authed) return;

    // Drop a stale response if the session changes (or we unmount) first.
    let cancelled = false;
    api
      .getSessions()
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        /* the sidebar is non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [currentSessionId, refreshKey]);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Small screens: toggle sits in the chat header row. */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed left-3 top-3 z-50 grid h-10 w-10 place-items-center rounded-full border border-edge bg-void/80 backdrop-blur hover:border-lilac/60 transition-colors duration-200"
        aria-label={isOpen ? "Close past checks" : "Open past checks"}
        aria-expanded={isOpen}
      >
        <svg className="h-4 w-4 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeWidth={1.5}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h10"}
          />
        </svg>
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-edge-soft bg-void transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 pb-6 pt-16 lg:pt-6">
          <Link href="/" aria-label="CareNexus home">
            <Wordmark className="text-[1.7rem]" />
          </Link>
          <button
            onClick={() => {
              onNewChat();
              close();
            }}
            className={`${TRACKED} mt-6 w-full rounded-full border border-edge py-3 text-ink transition-colors duration-200 hover:border-lilac/60 hover:bg-amethyst/30`}
          >
            New check
          </button>
        </div>

        <nav aria-label="Past checks" className="min-h-0 flex-1 overflow-y-auto border-t border-edge-soft">
          <h2 className="px-6 pb-2 pt-5 font-display text-lg text-ink-3">Past checks</h2>
          {sessions.length === 0 ? (
            <p className="px-6 py-3 text-sm font-light leading-relaxed text-ink-4">
              {signedIn
                ? "Your checks will be listed here."
                : "Sign in to keep a history of your checks."}
            </p>
          ) : (
            <ul>
              {sessions.map((session) => {
                const isActive = currentSessionId === session.id;
                return (
                  <li key={session.id}>
                    <button
                      onClick={() => {
                        onSelectSession(session.id);
                        close();
                      }}
                      aria-current={isActive ? "true" : undefined}
                      className={`w-full border-l-2 px-6 py-3 text-left transition-colors duration-200 ${
                        isActive
                          ? "border-lilac bg-amethyst/20"
                          : "border-transparent hover:bg-surface-2"
                      }`}
                    >
                      <span className={`block truncate text-sm ${isActive ? "text-ink" : "text-ink-2"}`}>
                        {session.title}
                      </span>
                      <span className="mt-0.5 block text-xs font-light text-ink-4">
                        {session.message_count} messages, {lastActive(session.updated_at ?? session.created_at)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="flex gap-6 border-t border-edge-soft px-6 py-5">
          <Link href="/profile" className={`${TRACKED} text-ink-4 hover:text-ink transition-colors duration-200`}>
            Profile
          </Link>
          <Link href="/dashboard" className={`${TRACKED} text-ink-4 hover:text-ink transition-colors duration-200`}>
            Dashboard
          </Link>
          <Link href="/about" className={`${TRACKED} text-ink-4 hover:text-ink transition-colors duration-200`}>
            About
          </Link>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-void/70 backdrop-blur-sm lg:hidden" onClick={close} aria-hidden="true" />
      )}
    </>
  );
}
