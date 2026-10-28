"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ALERT_ERROR, CARD } from "@/lib/styles";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants (outside component — no re-creation per render) ───────────────

const TRIAGE_COLORS: Record<string, { bg: string; label: string; emoji: string }> = {
  green: { bg: "bg-triage-green", label: "Self-care", emoji: "🟢" },
  yellow: { bg: "bg-triage-amber", label: "See Doctor", emoji: "🟡" },
  red: { bg: "bg-triage-red", label: "Emergency", emoji: "🔴" },
  none: { bg: "bg-ink-4", label: "Other", emoji: "⚪" },
};

// ─── Component ───────────────────────────────────────────────────────────────

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

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-b-amethyst-300" />
      </div>
    );
  }

  // Hoist maxMsgs outside the loop (was recalculated on every iteration)
  const maxMsgs = daily.length > 0 ? Math.max(...daily.map((d) => d.messages), 1) : 1;

  return (
    <main className="min-h-screen bg-void">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-ink mb-6">📊 Analytics Dashboard</h2>

        {error && (
          <div className={`mb-6 ${ALERT_ERROR}`} role="alert">{error}</div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Sessions", value: overview?.total_sessions ?? 0, icon: "💬" },
            { label: "Total Messages", value: overview?.total_messages ?? 0, icon: "📨" },
            { label: "Avg / Session", value: overview?.avg_messages_per_session ?? 0, icon: "📊" },
            { label: "Emergency Flags", value: overview?.emergency_triage_count ?? 0, icon: "🚨" },
          ].map((card) => (
            <div key={card.label} className={`${CARD} p-5 transition-all duration-300 hover:border-amethyst-600/70 hover:shadow-amethyst/20 hover:-translate-y-0.5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.icon}</span>
                <p className="text-xs text-ink-4 font-medium uppercase tracking-wider">{card.label}</p>
              </div>
              <p className="text-3xl font-bold text-ink">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Triage Distribution */}
          <div className={`${CARD} p-6`}>
            <h3 className="text-lg font-semibold text-ink mb-4">Triage Distribution</h3>
            {triage && triage.total_triaged > 0 ? (
              <div className="space-y-3">
                {Object.entries(TRIAGE_COLORS).map(([level, config]) => {
                  const count = triage.distribution[level] || 0;
                  const pct = triage.percentages[level] || 0;
                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-3">
                          {config.emoji} {config.label}
                        </span>
                        <span className="text-ink-4 font-medium">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-abyss border border-edge-soft rounded-full overflow-hidden">
                        <div className={`h-full ${config.bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-4 text-center py-8">
                No triage data yet. Start a health check to see statistics!
              </p>
            )}
          </div>

          {/* Daily Usage */}
          <div className={`${CARD} p-6`}>
            <h3 className="text-lg font-semibold text-ink mb-4">7-Day Activity</h3>
            {daily.length > 0 ? (
              <div className="space-y-2">
                {daily.map((day) => (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-ink-4 text-xs font-mono">
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-4 bg-abyss border border-edge-soft rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amethyst to-amethyst-400 rounded-full transition-all duration-500" style={{ width: `${(day.messages / maxMsgs) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right text-ink-3 text-xs font-medium">
                      {day.messages} msg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-4 text-center py-8">
                No activity data yet.
              </p>
            )}
          </div>
        </div>

        {/* RAG Knowledge Base Stats */}
        {rag && (
          <div className={`${CARD} p-6`}>
            <h3 className="text-lg font-semibold text-ink mb-4">🧠 Knowledge Base</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amethyst-300">{rag.indexed_conditions}</p>
                <p className="text-xs text-ink-4 mt-1">Medical Conditions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amethyst-200">{rag.vocabulary_size}</p>
                <p className="text-xs text-ink-4 mt-1">Vocabulary Terms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-ink">{rag.categories.length}</p>
                <p className="text-xs text-ink-4 mt-1">Categories</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rag.categories.map((cat) => (
                <span key={cat} className="px-3 py-1 text-xs bg-amethyst/20 text-amethyst-200 border border-amethyst-600/40 rounded-full capitalize">
                  {cat.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
