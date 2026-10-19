"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

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
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-sm shadow-sm group-hover:shadow-md transition-shadow">
          🏥
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          Care<span className="text-blue-600 dark:text-blue-400">Nexus</span>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
              <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
              className={`p-2 rounded-lg text-base ${
                pathname === link.href
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
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
