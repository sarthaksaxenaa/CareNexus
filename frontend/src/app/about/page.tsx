import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8 animate-rise">
          <h1 className="text-4xl font-bold tracking-tight text-ink">
            About CareNexus
          </h1>

          <p className="text-lg text-ink-3 leading-relaxed">
            CareNexus is an AI-powered medical chatbot designed to provide
            primary healthcare triage. It uses Retrieval-Augmented Generation
            (RAG) over trusted medical databases to deliver evidence-based
            health guidance.
          </p>

          <div className="space-y-6">
            <Section title="What CareNexus Does">
              <ul className="space-y-2 text-ink-3">
                <Bullet>Pre-screens symptoms with AI-powered severity assessment</Bullet>
                <Bullet>Provides evidence-based health information with source citations</Bullet>
                <Bullet>Detects emergency symptoms and escalates appropriately</Bullet>
                <Bullet>Tracks health patterns over time via analytics dashboard</Bullet>
                <Bullet>Stores health profiles for personalized triage</Bullet>
              </ul>
            </Section>

            <Section title="What CareNexus Does NOT Do">
              <ul className="space-y-2 text-ink-3">
                <Bullet tone="red">Does NOT replace professional medical advice</Bullet>
                <Bullet tone="red">Does NOT diagnose diseases or prescribe medication</Bullet>
                <Bullet tone="red">Does NOT store data without explicit consent</Bullet>
              </ul>
            </Section>

            <Section title="Technology">
              <p className="text-ink-3 leading-relaxed">
                Built with Next.js 16, FastAPI, SQLAlchemy, and powered by
                Google Gemini with a custom TF-IDF RAG pipeline over a curated
                medical knowledge base for evidence-based accuracy.
              </p>
            </Section>

            <Section title="Architecture">
              <ul className="space-y-2 text-ink-3">
                <Bullet><strong className="text-ink">Frontend:</strong> Next.js 16, TypeScript, Tailwind CSS</Bullet>
                <Bullet><strong className="text-ink">Backend:</strong> FastAPI, SQLAlchemy, Pydantic v2</Bullet>
                <Bullet><strong className="text-ink">AI/ML:</strong> Custom TF-IDF RAG, Google Gemini, rule-based fallback</Bullet>
                <Bullet><strong className="text-ink">Security:</strong> JWT auth, rate limiting, input sanitization, prompt injection guard</Bullet>
                <Bullet><strong className="text-ink">Database:</strong> SQLite (dev) / PostgreSQL (prod)</Bullet>
              </ul>
            </Section>
          </div>

          <div className="pt-8 border-t border-edge">
            <p className="text-sm text-ink-4 leading-relaxed">
              CareNexus is a capstone project built by Sarthak Saxena to
              demonstrate the potential of AI in primary healthcare. © 2026
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function Bullet({
  children,
  tone = "amethyst",
}: {
  children: React.ReactNode;
  tone?: "amethyst" | "red";
}) {
  return (
    <li className="flex gap-2.5">
      <span
        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
          tone === "red" ? "bg-triage-red" : "bg-amethyst-300"
        }`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-edge-soft shadow-xl shadow-black/40 p-6">
      <h2 className="text-xl font-semibold text-ink mb-4 flex items-center gap-2.5">
        <span className="h-5 w-0.5 rounded-full bg-gradient-to-b from-amethyst-300 to-amethyst" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </div>
  );
}
