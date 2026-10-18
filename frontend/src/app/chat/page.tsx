"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";
import ChatSidebar from "@/components/ChatSidebar";
import MessageBubble from "@/components/MessageBubble";
import QuickActions from "@/components/QuickActions";
import ErrorBoundary from "@/components/ErrorBoundary";

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
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

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

  const handleNewChat = () => {
    setSessionId(null);
    setShowQuickActions(true);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm **CareNexus**, your AI health assistant. 🏥\n\nDescribe your symptoms and I'll help assess them.\n\n⚕️ *Always consult a doctor for medical advice.*",
        triage_level: null,
        sources: null,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleSelectSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    setShowQuickActions(false);
    try {
      const data = await api.getSessionMessages(selectedSessionId);
      const msgs = data as ChatMessage[];
      if (msgs.length > 0) {
        setMessages(msgs);
      }
    } catch {
      // fallback — keep current messages
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <ChatSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-8" /> {/* Spacer for sidebar toggle */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Health Check
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {sessionId ? `Session active` : "New conversation"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full hidden sm:inline">
                ⚕️ Not medical advice
              </span>
              {isAuthenticated ? (
                <button
                  onClick={() => { api.logout(); setIsAuthenticated(false); router.push("/"); }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <a href="/login" className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
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
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
          <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isAuthenticated ? "Describe your symptoms..." : "Login to get AI analysis..."}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
      </div>
    </ErrorBoundary>
  );
}
