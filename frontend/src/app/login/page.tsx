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
      title="Welcome back"
      subtitle="Sign in to see your past checks and continue a conversation."
      error={error}
      footer={
        <p className="text-sm font-light text-ink-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-lilac underline decoration-lilac/30 underline-offset-4 hover:decoration-lilac transition-colors duration-200">
            Register
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="auth-email" className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            id="auth-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="auth-password" className={LABEL_CLASS}>Password</label>
          <input
            type="password"
            id="auth-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
