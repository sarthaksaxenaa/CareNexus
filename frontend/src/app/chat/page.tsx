"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";
import ChatSidebar from "@/components/ChatSidebar";
import MessageBubble from "@/components/MessageBubble";
import QuickActions from "@/components/QuickActions";
import ErrorBoundary from "@/components/ErrorBoundary";
import BodyMapPanel from "@/components/BodyMapPanel";
import { applyRegionToDraft, type RegionId } from "@/lib/bodyRegions";
import { ALERT_ADVISORY, TRACKED } from "@/lib/styles";
import { TRIAGE, TRIAGE_ORDER } from "@/lib/triage";

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Empty until the first exchange; the empty state explains the levels.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(api.isAuthenticated());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      triage_level: null,
      sources: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedRegion(null);
    setIsLoading(true);
    inputRef.current?.focus();

    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "Sign in to get an assessment. Checks are saved to your account so you can come back to them.\n\n[Sign in](/login) or [create an account](/register).",
            triage_level: null,
            sources: null,
            created_at: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await api.sendMessage(text, sessionId || undefined);
      setSessionId(response.session_id);
      setMessages((prev) => [...prev, response.assistant_message]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Your message could not be sent: ${errorMessage}\n\nCheck that the CareNexus server is running, then send it again.`,
          triage_level: null,
          sources: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /** A body-map click seeds the draft; the user keeps typing the symptom. */
  const handleRegionSelect = (region: RegionId) => {
    const previous = selectedRegion;
    setSelectedRegion(region);
    setInput((draft) => applyRegionToDraft(draft, region, previous));
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setSessionId(null);
    setSelectedRegion(null);
    setMessages([]);
  };

  const handleSelectSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    try {
      const msgs = await api.getSessionMessages(selectedSessionId);
      if (msgs.length > 0) {
        setMessages(msgs);
      }
    } catch {
      // fallback — keep current messages
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-void">
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-edge-soft px-5 py-3 pl-16 lg:pl-8">
            <div>
              <h1 className="font-display text-xl text-ink">Health check</h1>
              <p className="text-xs font-light text-ink-4">
                {sessionId ? "Continuing a saved check" : "New conversation"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`${ALERT_ADVISORY} hidden md:inline`}>Guidance, not a diagnosis</span>
              <button
                type="button"
                onClick={() => setShowMap((open) => !open)}
                aria-pressed={showMap}
                className={`${TRACKED} rounded-full border px-4 py-2 transition-colors duration-200 ${
                  showMap
                    ? "border-lilac/70 bg-amethyst/40 text-ink"
                    : "border-edge text-ink-3 hover:border-lilac/50 hover:text-ink"
                }`}
              >
                Body map
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    api.logout();
                    setIsAuthenticated(false);
                    router.push("/");
                  }}
                  className={`${TRACKED} hidden text-ink-4 transition-colors duration-200 hover:text-ink sm:inline`}
                >
                  Log out
                </button>
              ) : (
                <a href="/login" className={`${TRACKED} text-lilac transition-colors duration-200 hover:text-ink`}>
                  Sign in
                </a>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
              {isEmpty ? (
                <section className="animate-rise">
                  <h2 className="font-display font-light leading-[0.95] text-lilac text-[clamp(2.75rem,6vw,4.5rem)]">
                    What are you feeling?
                  </h2>
                  <p className="mt-5 max-w-[56ch] font-light leading-relaxed text-ink-3">
                    Describe it in your own words: where it is, how long it has lasted and
                    how bad it is. You can also point to it on the body map.
                  </p>

                  <dl className="mt-10 border-t border-edge-soft">
                    {TRIAGE_ORDER.map((level) => (
                      <div key={level} className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-edge-soft py-3.5">
                        <dt className={`flex items-center gap-2.5 ${TRACKED} ${TRIAGE[level].text}`}>
                          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TRIAGE[level].dot}`} />
                          {TRIAGE[level].label}
                        </dt>
                        <dd className="text-sm font-light text-ink-3">{TRIAGE[level].meaning}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-10">
                    <QuickActions onSelect={handleSend} disabled={isLoading} />
                  </div>

                  {!isAuthenticated && (
                    <p className="mt-10 text-sm font-light text-ink-4">
                      <a href="/login" className="text-lilac underline decoration-lilac/30 underline-offset-4 hover:decoration-lilac">
                        Sign in
                      </a>{" "}
                      to get an assessment and keep a history of your checks.
                    </p>
                  )}
                </section>
              ) : (
                <div className="space-y-10">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      triageLevel={msg.triage_level}
                      sources={msg.sources}
                      timestamp={msg.created_at}
                    />
                  ))}
                  {isLoading && (
                    <p className="flex items-center gap-3 text-sm font-light text-ink-4" role="status">
                      <span className="font-display text-lg italic text-lilac">CareNexus</span>
                      is reading your message
                      <span className="flex gap-1" aria-hidden="true">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-lilac"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </span>
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-edge-soft px-5 py-4 sm:px-8">
            <form
              className="mx-auto flex max-w-3xl items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                aria-label="Describe your symptoms"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAuthenticated ? "Describe your symptoms" : "Sign in to get an assessment"}
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-full border border-edge bg-abyss px-6 py-3.5 text-[15px] font-light text-ink placeholder:text-ink-4/70 transition-colors duration-200 focus:border-lilac/60 focus:outline-none focus:ring-1 focus:ring-lilac/30 disabled:opacity-50"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={isLoading || !input.trim()}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amethyst text-ink ring-1 ring-inset ring-lilac/30 transition-colors duration-200 hover:bg-amethyst-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Body map: overlay on small screens, docked panel on large ones */}
        {showMap && (
          <aside
            aria-label="Body map panel"
            className="fixed inset-y-0 right-0 z-40 w-80 border-l border-edge-soft bg-void shadow-2xl shadow-black/70 lg:static lg:z-auto lg:shadow-none"
          >
            <BodyMapPanel selected={selectedRegion} onSelect={handleRegionSelect} />
          </aside>
        )}
      </div>
    </ErrorBoundary>
  );
}
