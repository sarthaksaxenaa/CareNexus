import Link from "next/link";
import Navbar from "@/components/Navbar";
import { WORDMARK_ACCENT } from "@/lib/styles";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-void overflow-hidden">
        {/* Decorative amethyst bloom — purely atmospheric */}
        <div className="aurora-field" aria-hidden="true">
          <div
            className="aurora-orb animate-aurora"
            style={{
              width: "40rem",
              height: "40rem",
              top: "-14rem",
              left: "50%",
              marginLeft: "-20rem",
              background: "radial-gradient(circle, #3B0A6B 0%, transparent 70%)",
            }}
          />
          <div
            className="aurora-orb animate-aurora"
            style={{
              width: "28rem",
              height: "28rem",
              bottom: "-8rem",
              left: "-8rem",
              background: "radial-gradient(circle, #6B21A8 0%, transparent 70%)",
              animationDelay: "-5s",
            }}
          />
          <div
            className="aurora-orb animate-aurora"
            style={{
              width: "24rem",
              height: "24rem",
              bottom: "-6rem",
              right: "-6rem",
              background: "radial-gradient(circle, #9333EA 0%, transparent 72%)",
              animationDelay: "-9s",
            }}
          />
        </div>

        <div className="relative z-10 text-center space-y-8 px-4 py-16 animate-rise">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amethyst to-amethyst-400 shadow-2xl shadow-amethyst/50 ring-1 ring-amethyst-300/20">
              <span className="text-4xl">🏥</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-ink">
              Care<span className={WORDMARK_ACCENT}>Nexus</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-3 max-w-md mx-auto leading-relaxed">
              Your AI-powered health companion for primary healthcare triage
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="px-8 py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-amethyst to-amethyst-500
                         shadow-xl shadow-amethyst/40
                         hover:from-amethyst-600 hover:to-amethyst-400
                         hover:shadow-amethyst-400/50 hover:-translate-y-0.5
                         active:translate-y-0
                         transition-all duration-200"
            >
              Start Health Check →
            </Link>
            <Link
              href="/about"
              className="px-8 py-3 rounded-xl font-semibold text-ink-2
                         bg-surface-2 border border-edge
                         hover:bg-surface-3 hover:border-amethyst-600 hover:text-ink
                         transition-all duration-200"
            >
              Learn More
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            <FeatureCard
              emoji="🔍"
              title="Symptom Triage"
              description="AI-powered severity assessment with actionable guidance"
            />
            <FeatureCard
              emoji="🧠"
              title="RAG Pipeline"
              description="Responses grounded in curated medical knowledge base"
            />
            <FeatureCard
              emoji="🛡️"
              title="Evidence-Based"
              description="Triage powered by WHO & NHS medical guidelines"
            />
          </div>

          {/* Disclaimer */}
          <p className="text-sm text-ink-4 mt-12 max-w-lg mx-auto leading-relaxed">
            ⚕️ CareNexus provides general health information only. It is not a
            substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </main>
    </>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="p-6 rounded-2xl bg-surface/80 backdrop-blur-sm border border-edge-soft
                 shadow-xl shadow-black/40
                 hover:border-amethyst-600/70 hover:shadow-amethyst/20 hover:-translate-y-1
                 transition-all duration-300"
    >
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-4 leading-relaxed">{description}</p>
    </div>
  );
}
