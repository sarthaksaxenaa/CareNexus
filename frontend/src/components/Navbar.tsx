"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { WORDMARK_ACCENT } from "@/lib/styles";

const NAV_LINKS = [
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setIsAuth(api.isAuthenticated());
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserName(user.full_name || "");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setIsAuth(false);
    router.push("/");
  };

  // Don't show navbar on login/register pages
  if (["/login", "/register"].includes(pathname)) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-void/85 backdrop-blur-xl border-b border-edge"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amethyst to-amethyst-400 flex items-center justify-center text-sm shadow-lg shadow-amethyst/40 group-hover:shadow-amethyst-400/50 transition-shadow duration-300">
          🏥
        </div>
        <span className="text-lg font-bold text-ink tracking-tight">
          Care<span className={WORDMARK_ACCENT}>Nexus</span>
        </span>
      </Link>

      {/* Center Nav Links */}
      <div className="hidden sm:flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-amethyst/25 text-amethyst-200 ring-1 ring-amethyst-600/50"
                  : "text-ink-4 hover:bg-surface-2 hover:text-ink-2"
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {isAuth ? (
          <>
            {userName && (
              <span className="hidden md:inline text-xs text-ink-4">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-ink-4 hover:text-triage-red px-3 py-1.5 rounded-lg hover:bg-triage-red/10 transition-colors duration-200"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs text-ink-4 hover:text-amethyst-200 px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs font-medium text-white px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amethyst to-amethyst-500 hover:from-amethyst-600 hover:to-amethyst-400 shadow-md shadow-amethyst/30 transition-all duration-200"
            >
              Register
            </Link>
          </div>
        )}

        {/* Mobile menu */}
        <div className="sm:hidden flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className={`p-2 rounded-lg text-base transition-colors duration-200 ${
                pathname === link.href
                  ? "bg-amethyst/25 ring-1 ring-amethyst-600/50"
                  : "hover:bg-surface-2"
              }`}
              title={link.label}
            >
              {link.icon}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
