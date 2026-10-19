"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";

interface TriageData {
  distribution: Record<string, number>;
  total_triaged: number;
  percentages: Record<string, number>;
}

interface DailyUsage {
  date: string;
  messages: number;
  sessions: number;
}

interface OverviewStats {
  total_sessions: number;
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  avg_messages_per_session: number;
  emergency_triage_count: number;
}

interface RagStats {
  indexed_conditions: number;
  vocabulary_size: number;
  categories: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [triage, setTriage] = useState<TriageData | null>(null);
  const [daily, setDaily] = useState<DailyUsage[]>([]);
  const [rag, setRag] = useState<RagStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      const [overviewRes, triageRes, dailyRes, ragRes] = await Promise.allSettled([
        api.request<{ data: OverviewStats }>("/api/v1/analytics/overview"),
        api.request<{ data: TriageData }>("/api/v1/analytics/triage-distribution"),
        api.request<{ data: DailyUsage[] }>("/api/v1/analytics/daily-usage?days=7"),
        api.request<{ data: RagStats }>("/api/v1/analytics/rag-index"),
      ]);

      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value.data);
      if (triageRes.status === "fulfilled") setTriage(triageRes.value.data);
      if (dailyRes.status === "fulfilled") setDaily(dailyRes.value.data);
      if (ragRes.status === "fulfilled") setRag(ragRes.value.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const TRIAGE_COLORS = {
    green: { bg: "bg-green-500", label: "Self-care", emoji: "🟢" },
    yellow: { bg: "bg-yellow-500", label: "See Doctor", emoji: "🟡" },
    red: { bg: "bg-red-500", label: "Emergency", emoji: "🔴" },
    none: { bg: "bg-gray-400", label: "Other", emoji: "⚪" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📊 Analytics Dashboard</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">{error}</div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Sessions", value: overview?.total_sessions ?? 0, icon: "💬", color: "blue" },
            { label: "Total Messages", value: overview?.total_messages ?? 0, icon: "📨", color: "green" },
            { label: "Avg / Session", value: overview?.avg_messages_per_session ?? 0, icon: "📊", color: "purple" },
            { label: "Emergency Flags", value: overview?.emergency_triage_count ?? 0, icon: "🚨", color: "red" },
          ].map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.icon}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{card.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Triage Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Triage Distribution</h3>
            {triage && triage.total_triaged > 0 ? (
              <div className="space-y-3">
                {Object.entries(TRIAGE_COLORS).map(([level, config]) => {
                  const count = triage.distribution[level] || 0;
                  const pct = triage.percentages[level] || 0;
                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {config.emoji} {config.label}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${config.bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                No triage data yet. Start a health check to see statistics!
              </p>
            )}
          </div>

          {/* Daily Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">7-Day Activity</h3>
            {daily.length > 0 ? (
              <div className="space-y-2">
                {daily.map((day) => {
                  const maxMsgs = Math.max(...daily.map(d => d.messages), 1);
                  const barWidth = (day.messages / maxMsgs) * 100;
                  return (
                    <div key={day.date} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-gray-500 dark:text-gray-400 text-xs font-mono">
                        {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${barWidth}%` }} />
                      </div>
                      <span className="w-12 text-right text-gray-600 dark:text-gray-400 text-xs font-medium">
                        {day.messages} msg
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                No activity data yet.
              </p>
            )}
          </div>
        </div>

        {/* RAG Knowledge Base Stats */}
        {rag && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🧠 Knowledge Base</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{rag.indexed_conditions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Medical Conditions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{rag.vocabulary_size}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vocabulary Terms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{rag.categories.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Categories</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rag.categories.map((cat) => (
                <span key={cat} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
                  {cat.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
