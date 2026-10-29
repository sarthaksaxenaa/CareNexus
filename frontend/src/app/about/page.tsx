import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TRACKED } from "@/lib/styles";

// What happens to one message, in the order the backend runs it
// (backend/app/api/routes/chat.py → core/triage/engine.py).
const PIPELINE = [
  {
    title: "Clean the message",
    body: "HTML is stripped and attempts to rewrite the assistant's instructions are refused.",
  },
  {
    title: "Check emergency signs first",
    body: "Six groups of warning signs, such as chest pain or stroke symptoms, end the check at once with an emergency answer.",
  },
  {
    title: "Read your profile",
    body: "Age, sex and known conditions from your health profile raise or lower the level of concern.",
  },
  {
    title: "Find the closest conditions",
    body: "A search over 49 conditions in 11 specialties, each tagged with its ICD-10 code, picks the three best matches.",
  },
  {
    title: "Write the answer",
    body: "With a Gemini key configured, the reply is written from those matches. Without one, a rules engine answers, fully offline.",
  },
];

const DOES = [
  "Grades how urgent your symptoms sound: self-care, see a doctor, or emergency",
  "Explains the next step and the warning signs to watch for",
  "Lets you point to where it hurts on a 3D body map",
  "Keeps your past checks so you can return to them",
];

const DOES_NOT = [
  "Diagnose an illness or prescribe medicine",
  "Replace a doctor, a pharmacist or an emergency service",
  "Send your messages to an outside AI service unless a Gemini key is configured",
];

const STACK = [
  ["Interface", "Next.js 16, React 19, TypeScript, Tailwind CSS, three.js"],
  ["Service", "FastAPI, SQLAlchemy (async), Pydantic v2"],
  ["Triage", "Rule-based emergency checks, TF-IDF retrieval with medical synonyms, optional Gemini"],
  ["Security", "JWT sessions with refresh, per-user rate limits, input sanitising"],
  ["Data", "SQLite locally, PostgreSQL in production"],
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void">
        <article className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <header className="max-w-3xl animate-rise">
            <h1 className="font-display font-light leading-[0.95] text-lilac text-[clamp(3rem,7vw,5.5rem)]">
              How CareNexus decides
            </h1>
            <p className="mt-8 max-w-[60ch] text-lg font-light leading-relaxed text-ink-3">
              CareNexus is a triage assistant. It does not try to name your illness. It
              answers a narrower question that matters first: how urgently should you
              get care, and what should you do in the meantime?
            </p>
          </header>

          <section aria-labelledby="pipeline" className="mt-20">
            <h2 id="pipeline" className="font-display text-3xl text-ink">
              What happens to your message
            </h2>
            <ol className="mt-8 border-t border-edge">
              {PIPELINE.map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-2 border-b border-edge-soft py-6 sm:grid-cols-[4rem_16rem_1fr] sm:gap-8"
                >
                  <span className="font-display text-2xl italic text-ink-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl text-ink">{step.title}</h3>
                  <p className="max-w-[55ch] text-sm font-light leading-relaxed text-ink-3">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-20 grid gap-14 md:grid-cols-2">
            <List title="What it does" items={DOES} marker="bg-lilac" />
            <List title="What it does not do" items={DOES_NOT} marker="bg-triage-red" />
          </section>

          <section aria-labelledby="stack" className="mt-20">
            <h2 id="stack" className="font-display text-3xl text-ink">
              Built with
            </h2>
            <dl className="mt-8 border-t border-edge">
              {STACK.map(([term, detail]) => (
                <div
                  key={term}
                  className="grid gap-1 border-b border-edge-soft py-4 sm:grid-cols-[12rem_1fr] sm:gap-8"
                >
                  <dt className={`${TRACKED} pt-1 text-ink-4`}>{term}</dt>
                  <dd className="text-sm font-light text-ink-2">{detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="mt-20 flex flex-col gap-6 border-t border-edge pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[60ch] text-sm font-light leading-relaxed text-ink-4">
              A final-year capstone project by Sarthak Saxena. General health information
              only; in an emergency, call your local emergency number.
            </p>
            <Link
              href="/chat"
              className={`${TRACKED} shrink-0 rounded-full border border-edge px-6 py-3 text-ink transition-colors duration-200 hover:border-lilac/70`}
            >
              Start a check
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}

function List({ title, items, marker }: { title: string; items: string[]; marker: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex gap-4 text-sm font-light leading-relaxed text-ink-3">
            <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${marker}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
