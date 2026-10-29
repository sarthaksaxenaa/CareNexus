import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TRACKED } from "@/lib/styles";

const STEPS = [
  {
    title: "Describe",
    body: "Say what you feel in your own words, or point to it on the body map.",
  },
  {
    title: "Assess",
    body: "Your words are matched against 49 conditions and the emergency warning signs.",
  },
  {
    title: "Act",
    body: "You get a clear next step: rest at home, see a doctor, or get help now.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden bg-void">
        {/* Amethyst light falling across the specimen. Decorative. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-10 h-[46rem] w-[46rem] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, #3B0A6B 0%, transparent 65%)" }}
        />

        <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20">
          {/* Headline column */}
          <div>
            <h1 className="font-display font-light text-lilac leading-[0.86] tracking-[-0.02em] text-[clamp(3.6rem,9vw,7.5rem)]">
              <span className="block animate-rise">A Clearer</span>
              <span className="block pl-[0.9em] animate-rise [animation-delay:90ms]">
                Kind <em className="font-light text-ink-3 text-[0.42em] align-middle">of</em>
              </span>
              <span className="block pl-[1.6em] animate-rise [animation-delay:180ms]">Care</span>
            </h1>

            <p className="mt-9 max-w-sm text-base font-light leading-relaxed text-ink-3 animate-rise [animation-delay:260ms]">
              Describe what you are feeling. CareNexus tells you how urgent it
              sounds and what to do next, in plain language.
            </p>

            <div className="mt-10 flex items-center gap-6 animate-rise [animation-delay:340ms]">
              <Link
                href="/chat"
                className={`${TRACKED} group grid h-24 w-24 place-items-center rounded-full border border-edge text-ink transition-colors duration-300 hover:border-lilac/70 hover:bg-amethyst/40`}
              >
                Begin
              </Link>
              <span aria-hidden="true" className="h-px w-20 bg-gradient-to-r from-lilac/60 to-transparent" />
              <Link
                href="/about"
                className={`${TRACKED} text-ink-4 transition-colors duration-200 hover:text-ink`}
              >
                How it works
              </Link>
            </div>
          </div>

          {/* Specimen: one real assessment, set like an exhibit */}
          <figure className="relative mx-auto w-full max-w-md animate-rise [animation-delay:200ms]">
            <div className="relative aspect-square rounded-full border border-edge">
              <div className="absolute inset-[9%] rounded-full border border-edge-soft" />
              <div
                aria-hidden="true"
                className="absolute inset-[18%] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #6420a8 0%, #3B0A6B 45%, #050505 78%)",
                }}
              />
              <blockquote className="absolute inset-[22%] flex items-center justify-center text-center">
                <p className="font-display text-[clamp(1.35rem,3vw,1.85rem)] italic font-light leading-snug text-ink">
                  &ldquo;Crushing pain in my chest, spreading to my left arm.&rdquo;
                </p>
              </blockquote>
            </div>

            <figcaption className="mt-8 flex items-start gap-4 border-t border-edge pt-5">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-triage-red shadow-[0_0_12px] shadow-triage-red/70" />
              <div>
                <p className="font-display text-xl text-ink">Emergency. Get help now.</p>
                <p className="mt-1 text-sm font-light text-ink-4">
                  How CareNexus grades this message, even with no internet AI connected.
                </p>
              </div>
            </figcaption>
          </figure>

          {/* Vertical edge note, after the reference's side labels. */}
          <p
            className={`${TRACKED} absolute right-3 top-1/2 hidden -translate-y-1/2 text-ink-4/70 [writing-mode:vertical-rl] xl:block`}
          >
            Guidance, not a diagnosis
          </p>
        </section>

        {/* The sequence a check follows */}
        <section aria-label="How a check works" className="relative border-t border-edge-soft">
          <ol className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span className="font-display text-xl italic text-ink-3 leading-none pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className="mt-4 h-px w-8 shrink-0 bg-edge" />
                <div>
                  <h2 className="font-display text-2xl text-ink">{step.title}</h2>
                  <p className="mt-2 max-w-[30ch] text-sm font-light leading-relaxed text-ink-4">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-edge-soft">
          <p className="mx-auto max-w-7xl px-5 py-8 text-xs font-light leading-relaxed text-ink-4 sm:px-8">
            CareNexus gives general health information. It does not diagnose and is not a
            substitute for a doctor. In an emergency, call your local emergency number.
          </p>
        </footer>
      </main>
    </>
  );
}
