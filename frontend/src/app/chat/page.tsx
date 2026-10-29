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
import { ALERT_ADVISORY } from "@/lib/styles";

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm **CareNexus**, your AI health assistant. 🏥\n\nDescribe your symptoms and I'll help assess them using our medical knowledge base.\n\n- 🟢 **Green** — Self-care guidance\n- 🟡 **Yellow** — See a doctor soon\n- 🔴 **Red** — Seek emergency care\n\n⚕️ *Remember — I provide guidance, not diagnosis. Always consult a doctor for medical advice.*",
      triage_level: null,
      sources: null,
      // Deliberately empty: the greeting is UI chrome, not a stored message.
      // A real Date here is evaluated at prerender time on the server and again
      // in the browser, so the rendered timestamps differ and React throws a
      // hydration error (#418). MessageBubble hides an empty timestamp.
      created_at: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
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

    setShowQuickActions(false);

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
              "To get AI-powered symptom analysis, please **log in** or **create an account**.\n\n👉 [Login](/login) | [Register](/register)",
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
          content: `⚠️ **Error:** ${errorMessage}\n\nPlease try again or check your connection.`,
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
    setShowQuickActions(false);
    setInput((draft) => applyRegionToDraft(draft, region, previous));
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setSessionId(null);
    setSelectedRegion(null);
    setShowQuickActions(true);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm **CareNexus**, your AI health assistant. 🏥\n\nDescribe your symptoms and I'll help assess them.\n\n⚕️ *Always consult a doctor for medical advice.*",
        triage_level: null,
        sources: null,
        created_at: "",
      },
    ]);
  };

  const handleSelectSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    setShowQuickActions(false);
    try {
      const msgs = await api.getSessionMessages(selectedSessionId);
      if (msgs.length > 0) {
        setMessages(msgs);
      }
    } catch {
      // fallback — keep current messages
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-void">
        {/* Sidebar */}
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 bg-surface/80 backdrop-blur-xl border-b border-edge">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-8" /> {/* Spacer for sidebar toggle */}
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Health Check
                </h2>
                <p className="text-xs text-ink-4">
                  {sessionId ? `Session active` : "New conversation"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMap((open) => !open)}
                aria-pressed={showMap}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-200 ${
                  showMap
                    ? "border-amethyst-400 bg-amethyst/30 text-amethyst-200"
                    : "border-edge text-ink-3 hover:border-amethyst-600 hover:text-ink-2"
                }`}
              >
                🫀 Body map
              </button>
              <span className={`${ALERT_ADVISORY} hidden sm:inline`}>
                ⚕️ Not medical advice
              </span>
              {isAuthenticated ? (
                <button
                  onClick={() => { api.logout(); setIsAuthenticated(false); router.push("/"); }}
                  className="text-xs text-ink-4 hover:text-triage-red px-3 py-1.5 rounded-lg hover:bg-triage-red/10 transition-colors duration-200"
                >
                  Logout
                </button>
              ) : (
                <a href="/login" className="text-xs text-amethyst-300 hover:text-amethyst-200 font-medium px-3 py-1.5 rounded-lg hover:bg-amethyst/20 transition-colors duration-200">
                  Login
                </a>
              )}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-surface border border-edge-soft shadow-lg shadow-black/40 rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-amethyst-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-amethyst-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-amethyst-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 1 && (
            <QuickActions onSelect={handleSend} disabled={isLoading} />
          )}

          {/* Input */}
          <div className="px-4 py-3 bg-surface/80 backdrop-blur-xl border-t border-edge">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isAuthenticated ? "Describe your symptoms..." : "Login to get AI analysis..."}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-abyss border border-edge text-ink placeholder:text-ink-4/60 focus:outline-none focus:border-amethyst-400 focus:ring-2 focus:ring-amethyst-400/40 disabled:opacity-50 transition-colors duration-200 text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-5 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amethyst to-amethyst-500 shadow-lg shadow-amethyst/30 hover:from-amethyst-600 hover:to-amethyst-400 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Body map: overlay on small screens, docked panel on large ones */}
        {showMap && (
          <aside
            aria-label="Body map panel"
            className="fixed inset-y-0 right-0 z-40 w-80 border-l border-edge bg-surface-2 shadow-2xl shadow-black/60 lg:static lg:z-auto lg:shadow-none"
          >
            <BodyMapPanel selected={selectedRegion} onSelect={handleRegionSelect} />
          </aside>
        )}
      </div>
    </ErrorBoundary>
  );
}
