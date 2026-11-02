"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { needsSex, readStoredUser, safeNext, type Sex } from "@/lib/sex";
import { BTN_PRIMARY } from "@/lib/styles";
import AuthLayout from "@/components/AuthLayout";
import SexField from "@/components/SexField";

/** Where to continue afterwards; read at call time, in the browser only. */
const next = () => safeNext(new URLSearchParams(window.location.search).get("next"));

/**
 * One-time question for accounts created before sex was asked. Sign-up asks
 * it up front, so new users never see this page.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [sex, setSex] = useState<Sex | "">("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!needsSex(readStoredUser() ?? { sex: null })) {
      router.replace(next());
      return;
    }
    // The local copy may be stale (set on another device): ask the server.
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (cancelled) return;
        if (needsSex(me)) setReady(true);
        else router.replace(next());
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!sex) {
      setError("Please choose your sex.");
      return;
    }
    setIsSaving(true);
    try {
      await api.updateSex(sex);
      router.replace(next());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "That could not be saved. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout
      title="One more thing"
      subtitle="Before your next check, tell us your sex. It is asked once and you can change it in your profile."
      error={error}
      footer={
        <p className="text-sm font-light text-ink-4">
          CareNexus uses it only to decide which conditions are possible.
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={!ready}>
        <SexField value={sex} onChange={setSex} name="onboarding-sex" disabled={!ready || isSaving} />
        <button type="submit" disabled={!ready || isSaving} className={BTN_PRIMARY}>
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
