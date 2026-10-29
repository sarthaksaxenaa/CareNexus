"use client";

import Link from "next/link";
import { ALERT_ERROR } from "@/lib/styles";
import Wordmark from "./Wordmark";

interface AuthLayoutProps {
  /** Large serif line on the editorial panel. */
  title: string;
  subtitle: string;
  error: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Shared layout for login and register: an editorial panel beside the form.
 * On small screens the panel collapses to a heading above the form.
 */
export default function AuthLayout({ title, subtitle, error, children, footer }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-void lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-edge-soft lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 h-[38rem] w-[38rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #3B0A6B 0%, transparent 65%)" }}
        />
        <Link href="/" aria-label="CareNexus home" className="relative">
          <Wordmark className="text-3xl" />
        </Link>
        <h1 className="relative font-display font-light text-lilac leading-[0.9] text-[clamp(3.5rem,6vw,6rem)] animate-rise">
          {title}
        </h1>
        <p className="relative max-w-xs text-sm font-light leading-relaxed text-ink-4">
          General health guidance, not a diagnosis. In an emergency, call your
          local emergency number.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-sm space-y-8 animate-rise">
          <div className="space-y-3">
            <Link href="/" aria-label="CareNexus home" className="lg:hidden">
              <Wordmark className="text-3xl" />
            </Link>
            <h2 className="font-display text-4xl font-light text-ink lg:hidden">{title}</h2>
            <p className="text-sm font-light text-ink-3">{subtitle}</p>
          </div>

          {error && (
            <div className={ALERT_ERROR} role="alert">
              {error}
            </div>
          )}

          {children}

          <div className="border-t border-edge-soft pt-6">{footer}</div>
        </div>
      </section>
    </main>
  );
}
