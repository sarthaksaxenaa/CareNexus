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
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
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
