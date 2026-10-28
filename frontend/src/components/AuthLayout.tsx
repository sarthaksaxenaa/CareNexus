"use client";

import Link from "next/link";
import { ALERT_ERROR, WORDMARK_ACCENT } from "@/lib/styles";

interface AuthLayoutProps {
  subtitle: string;
  error: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Shared layout for login and register pages.
 * Eliminates ~60 lines of duplicated markup between the two pages.
 */
export default function AuthLayout({ subtitle, error, children, footer }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-void px-4 overflow-hidden">
      {/* Decorative amethyst bloom */}
      <div className="aurora-field" aria-hidden="true">
        <div
          className="aurora-orb animate-aurora"
          style={{
            width: "32rem",
            height: "32rem",
            top: "-12rem",
            left: "-8rem",
            background: "radial-gradient(circle, #3B0A6B 0%, transparent 70%)",
          }}
        />
        <div
          className="aurora-orb animate-aurora"
          style={{
            width: "26rem",
            height: "26rem",
            bottom: "-10rem",
            right: "-6rem",
            background: "radial-gradient(circle, #6B21A8 0%, transparent 70%)",
            animationDelay: "-7s",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-rise">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              🏥 Care<span className={WORDMARK_ACCENT}>Nexus</span>
            </h1>
          </Link>
          <p className="mt-2 text-sm text-ink-4">{subtitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className={ALERT_ERROR} role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        {children}

        {/* Footer link */}
        {footer}
      </div>
    </main>
  );
}
