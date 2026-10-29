"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TRACKED } from "@/lib/styles";
import Wordmark from "./Wordmark";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Check symptoms" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // localStorage is unavailable during SSR, so auth state is read after
    // mount to keep the server HTML and the first client render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuth(api.isAuthenticated());
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(user.full_name || "");
    } catch {
      /* ignore */
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setIsAuth(false);
    router.push("/");
  };

  // Login and register have their own minimal chrome.
  if (["/login", "/register"].includes(pathname)) return null;

  const linkClass = (active: boolean) =>
    `${TRACKED} whitespace-nowrap py-1 border-b transition-colors duration-200 ${
      active
        ? "text-ink border-amethyst-200/70"
        : "text-ink-4 border-transparent hover:text-ink-2"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-void/85 backdrop-blur-xl border-b border-edge-soft">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 h-16"
      >
        <Link href="/" aria-label="CareNexus home" className="shrink-0">
          <Wordmark className="text-[1.65rem]" />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass(active)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-5 shrink-0">
          {isAuth ? (
            <>
              {userName && (
                <span className="hidden lg:inline text-sm font-light text-ink-3">
                  {userName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className={`${TRACKED} text-ink-4 hover:text-ink transition-colors duration-200`}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`${TRACKED} text-ink-4 hover:text-ink transition-colors duration-200`}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={`${TRACKED} rounded-full border border-edge px-4 py-2 text-ink-2 hover:border-amethyst-200/60 hover:text-ink transition-colors duration-200`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Small screens: the same links as a scrollable row. */}
      <ul className="md:hidden flex gap-6 overflow-x-auto px-5 pb-3 -mt-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
