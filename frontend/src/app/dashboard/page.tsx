"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ALERT_ERROR, TRACKED } from "@/lib/styles";
import { TRIAGE, TRIAGE_ORDER } from "@/lib/triage";

// ─── API shapes ──────────────────────────────────────────────────────────────

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
  avg_messages_per_session: number;
  emergency_triage_count: number;
}

interface MyStats {
  total_sessions: number;
  total_messages: number;
}

interface RagStats {
  indexed_conditions: number;
  vocabulary_size: number;
  categories: string[];
}

const nf = new Intl.NumberFormat("en-IN");

/** "2026-10-29" -> "Thu" / "Thu 29 Oct", read as a calendar date (no timezone shift). */
function dayLabel(date: string, long = false): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", long
    ? { weekday: "short", day: "numeric", month: "short" }
    : { weekday: "short" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [mine, setMine] = useState<MyStats | null>(null);
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

    let cancelled = false;
    Promise.allSettled([
      api.request<{ data: OverviewStats }>("/api/v1/analytics/overview"),
      api.request<{ data: MyStats }>("/api/v1/analytics/my-stats"),
      api.request<{ data: TriageData }>("/api/v1/analytics/triage-distribution"),
      api.request<{ data: DailyUsage[] }>("/api/v1/analytics/daily-usage?days=7"),
      api.request<{ data: RagStats }>("/api/v1/analytics/rag-index"),
    ]).then(([o, m, t, d, r]) => {
      if (cancelled) return;
      if (o.status === "fulfilled") setOverview(o.value.data);
      if (m.status === "fulfilled") setMine(m.value.data);
      if (t.status === "fulfilled") setTriage(t.value.data);
      if (d.status === "fulfilled") setDaily(d.value.data);
      if (r.status === "fulfilled") setRag(r.value.data);
      if ([o, m, t, d, r].every((x) => x.status === "rejected")) {
        setError("The dashboard could not load. Check that the CareNexus server is running.");
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const stats = [
    { label: "Conversations", value: overview?.total_sessions },
    { label: "Messages", value: overview?.total_messages },
    { label: "Messages per conversation", value: overview?.avg_messages_per_session },
    { label: "Emergency answers", value: overview?.emergency_triage_count },
  ];

  const graded = TRIAGE_ORDER.reduce((sum, l) => sum + (triage?.distribution[l] ?? 0), 0);
  const maxMsgs = Math.max(1, ...daily.map((d) => d.messages));
  const weekTotal = daily.reduce((s, d) => s + d.messages, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <header className="flex flex-col gap-6 border-b border-edge pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display font-light leading-none text-lilac text-[clamp(3rem,7vw,5rem)]">
                Dashboard
              </h1>
              <p className="mt-4 max-w-[52ch] font-light text-ink-3">
                Activity across every check on this CareNexus server, and the medical
                library the assessments draw on.
              </p>
            </div>
            {mine && (
              <p className="font-light text-ink-3">
                You have made{" "}
                <span className="font-display text-3xl text-ink lining-nums">{nf.format(mine.total_sessions)}</span>{" "}
                {mine.total_sessions === 1 ? "check" : "checks"}
              </p>
            )}
          </header>

          {error && (
            <div className={`mt-8 ${ALERT_ERROR}`} role="alert">
              {error}
            </div>
          )}

          {/* Headline numbers */}
          <dl className="grid grid-cols-2 border-b border-edge-soft md:grid-cols-4" aria-busy={isLoading}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-8 pr-4 ${i % 2 === 1 ? "pl-6 border-l border-edge-soft" : ""} ${
                  i >= 2 ? "md:pl-6 md:border-l md:border-edge-soft" : ""
                } ${i === 2 ? "border-t border-edge-soft md:border-t-0" : ""} ${i === 3 ? "border-t border-edge-soft md:border-t-0" : ""}`}
              >
                <dt className="text-sm font-light text-ink-4">{s.label}</dt>
                <dd className="mt-2 font-display text-5xl font-light text-ink lining-nums tabular-nums">
                  {isLoading ? "–" : nf.format(s.value ?? 0)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-16 py-14 lg:grid-cols-2">
            {/* Triage mix: one stacked bar, labelled rows carry the colour's meaning */}
            <section aria-labelledby="mix">
              <h2 id="mix" className="font-display text-3xl text-ink">How answers were graded</h2>
              {graded > 0 && triage ? (
                <>
                  <div className="mt-8 flex h-3 gap-[2px]" role="img"
                    aria-label={TRIAGE_ORDER.map((l) => `${TRIAGE[l].label} ${triage.distribution[l] ?? 0}`).join(", ")}>
                    {TRIAGE_ORDER.map((l) => {
                      const n = triage.distribution[l] ?? 0;
                      return n > 0 ? (
                        <div
                          key={l}
                          className={`${TRIAGE[l].dot} first:rounded-l-full last:rounded-r-full`}
                          style={{ flexGrow: n }}
                          title={`${TRIAGE[l].label}: ${n}`}
                        />
                      ) : null;
                    })}
                  </div>
                  <ul className="mt-6 border-t border-edge-soft">
                    {TRIAGE_ORDER.map((l) => {
                      const n = triage.distribution[l] ?? 0;
                      return (
                        <li key={l} className="flex items-center justify-between border-b border-edge-soft py-3.5">
                          <span className={`flex items-center gap-2.5 ${TRACKED} text-ink-2`}>
                            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TRIAGE[l].dot}`} />
                            {TRIAGE[l].label}
                          </span>
                          <span className="text-sm font-light text-ink-3 lining-nums tabular-nums">
                            {nf.format(n)}
                            <span className="ml-3 inline-block w-12 text-right text-ink-4">
                              {Math.round((n / graded) * 100)}%
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="mt-6 font-light text-ink-4">
                  {isLoading ? "Loading…" : "No graded answers yet. Start a check to see how answers are graded."}
                </p>
              )}
            </section>

            {/* Last 7 days: single series, so no legend; the heading names it */}
            <section aria-labelledby="week">
              <div className="flex items-baseline justify-between">
                <h2 id="week" className="font-display text-3xl text-ink">Messages this week</h2>
                <span className="text-sm font-light text-ink-4 lining-nums tabular-nums">{nf.format(weekTotal)} total</span>
              </div>
              {daily.length > 0 ? (
                <>
                  <div className="mt-8 grid h-48 grid-cols-7 items-end gap-3 border-b border-edge">
                    {daily.map((d) => (
                      <div key={d.date} className="group relative flex h-full items-end justify-center">
                        <div
                          className="w-full max-w-9 rounded-t-[4px] bg-lilac/80 transition-colors duration-150 group-hover:bg-lilac"
                          style={{ height: `${(d.messages / maxMsgs) * 100}%`, minHeight: d.messages ? 4 : 0 }}
                        />
                        <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-sm border border-edge bg-surface-2 px-2 py-1 text-xs text-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {dayLabel(d.date, true)}: {d.messages}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-3">
                    {daily.map((d) => (
                      <span key={d.date} className="text-center text-xs font-light text-ink-4">
                        {dayLabel(d.date)}
                      </span>
                    ))}
                  </div>
                  <table className="sr-only">
                    <caption>Messages per day, last 7 days</caption>
                    <tbody>
                      {daily.map((d) => (
                        <tr key={d.date}>
                          <th scope="row">{dayLabel(d.date, true)}</th>
                          <td>{d.messages}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="mt-6 font-light text-ink-4">{isLoading ? "Loading…" : "No activity yet."}</p>
              )}
            </section>
          </div>

          {/* Library */}
          {rag && (
            <section aria-labelledby="library" className="border-t border-edge pt-14">
              <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
                <div>
                  <h2 id="library" className="font-display text-3xl text-ink">The medical library</h2>
                  <p className="mt-4 max-w-[40ch] text-sm font-light leading-relaxed text-ink-4">
                    Every assessment is matched against these conditions, each tagged with its
                    ICD-10 code.
                  </p>
                </div>
                <div>
                  <dl className="grid grid-cols-3 gap-6">
                    {[
                      ["Conditions", rag.indexed_conditions],
                      ["Specialties", rag.categories.length],
                      ["Indexed terms", rag.vocabulary_size],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dd className="font-display text-5xl font-light text-ink lining-nums tabular-nums">
                          {nf.format(value as number)}
                        </dd>
                        <dt className="mt-1 text-sm font-light text-ink-4">{label}</dt>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-8 text-sm font-light leading-loose text-ink-3">
                    {[...rag.categories]
                      .sort()
                      .map((c) => c.replaceAll("_", " ").replace(/^\w/, (ch) => ch.toUpperCase()))
                      .join(", ")}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
