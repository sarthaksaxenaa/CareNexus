"use client";

import Link from "next/link";

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🏥 Care<span className="text-blue-600">Nexus</span>
            </h1>
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm" role="alert">
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
