"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "./api";
import { needsSex, readStoredUser } from "./sex";

/**
 * Send a signed-in account without a sex to /onboarding (once), then back.
 * Covers sessions that began before sex was asked and never pass through
 * the login page again.
 */
export function useRequireSex(enabled: boolean): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    const stored = readStoredUser();
    if (stored && !needsSex(stored)) return;

    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (!cancelled && needsSex(me)) {
          router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
        }
      })
      .catch(() => {
        // Offline or signed out: the page's own auth handling takes over.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, router, pathname]);
}
