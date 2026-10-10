"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/api";

const TRIAGE_COLORS = {
  green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "🟢 Self-care" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "🟡 See a doctor" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "🔴 Emergency" },
  none: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", label: "" },
};

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm CareNexus, your AI health assistant. Describe your symptoms and I'll help assess them.\n\nRemember — I provide general guidance. Always consult a doctor for medical advice.",
      triage_level: null,
      sources: null,
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(api.isAuthenticated());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      triage_level: null,
      sources: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // If not authenticated, show local response
    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "To get AI-powered symptom analysis, please log in or create an account. You can still explore the interface!\n\n👉 [Login](/login) or [Register](/register) to get started.",
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
      const response = await api.sendMessage(input, sessionId || undefined);
      setSessionId(response.session_id);
      setMessages((prev) => [...prev, response.assistant_message]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          triage_level: null,
          sources: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Care<span className="text-blue-600">Nexus</span>
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
            ⚕️ Not medical advice
          </span>
          {isAuthenticated ? (
            <button
              onClick={() => { api.logout(); setIsAuthenticated(false); router.push("/"); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[80%] space-y-2">
              <div
                className={`px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
              {msg.triage_level && msg.triage_level !== "none" && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${TRIAGE_COLORS[msg.triage_level].bg} ${TRIAGE_COLORS[msg.triage_level].text}`}>
                  {TRIAGE_COLORS[msg.triage_level].label}
                </div>
              )}
              {msg.sources && (
                <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                  📚 {msg.sources}
                </p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isAuthenticated ? "Describe your symptoms..." : "Login to get AI-powered analysis..."}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
