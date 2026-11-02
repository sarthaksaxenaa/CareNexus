"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY } from "@/lib/styles";
import AuthLayout from "@/components/AuthLayout";
import SexField from "@/components/SexField";
import type { Sex } from "@/lib/sex";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!sex) {
      setError("Please choose your sex.");
      return;
    }
    setIsLoading(true);

    try {
      await api.register(email, password, fullName, sex);
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Begin here"
      subtitle="Create an account to keep your checks and health profile in one place."
      error={error}
      footer={
        <p className="text-sm font-light text-ink-4">
          Already have an account?{" "}
          <Link href="/login" className="text-lilac underline decoration-lilac/30 underline-offset-4 hover:decoration-lilac transition-colors duration-200">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="auth-fullName" className={LABEL_CLASS}>Full name</label>
          <input
            type="text"
            id="auth-fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="Your full name"
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={INPUT_CLASS}
            placeholder="At least 8 characters"
          />
        </div>

        <SexField value={sex} onChange={setSex} name="register-sex" />

        <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
