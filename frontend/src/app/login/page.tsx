"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY } from "@/lib/styles";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.login(email, password);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Sign in to your account"
      error={error}
      footer={
        <p className="text-center text-sm text-ink-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-amethyst-300 hover:text-amethyst-200 font-medium transition-colors duration-200">
            Register
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="rounded-2xl bg-surface border border-edge-soft shadow-2xl shadow-black/50 p-8 space-y-6">
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
