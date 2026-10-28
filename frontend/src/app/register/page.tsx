"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY } from "@/lib/styles";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.register(email, password, fullName);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Create your account"
      error={error}
      footer={
        <p className="text-center text-sm text-ink-4">
          Already have an account?{" "}
          <Link href="/login" className="text-amethyst-300 hover:text-amethyst-200 font-medium transition-colors duration-200">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="rounded-2xl bg-surface border border-edge-soft shadow-2xl shadow-black/50 p-8 space-y-6">
        <div>
          <label className={LABEL_CLASS}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="Your full name"
          />
        </div>

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
            minLength={8}
            className={INPUT_CLASS}
            placeholder="••••••••  (min 8 characters)"
          />
        </div>

        <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
