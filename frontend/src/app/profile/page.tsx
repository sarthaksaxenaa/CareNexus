"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  ALERT_ERROR,
  ALERT_SUCCESS,
  BTN_PRIMARY_SM,
  BTN_SECONDARY,
  INPUT_CLASS,
  LABEL_CLASS,
  TRACKED,
} from "@/lib/styles";

interface HealthProfile {
  id: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  known_conditions: string | null;
  current_medications: string | null;
  allergies: string | null;
}

type FormState = Record<Exclude<keyof HealthProfile, "id">, string>;

const EMPTY_FORM: FormState = {
  age: "",
  gender: "",
  blood_group: "",
  known_conditions: "",
  current_medications: "",
  allergies: "",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

// `used` marks the fields the triage engine reads (core/triage/engine.py).
const FIELDS: { key: keyof FormState; label: string; used: boolean }[] = [
  { key: "age", label: "Age", used: true },
  { key: "gender", label: "Sex", used: true },
  { key: "known_conditions", label: "Known conditions", used: true },
  { key: "blood_group", label: "Blood group", used: false },
  { key: "current_medications", label: "Current medicines", used: false },
  { key: "allergies", label: "Allergies", used: false },
];

function toForm(p: HealthProfile): FormState {
  return {
    age: p.age?.toString() ?? "",
    gender: p.gender ?? "",
    blood_group: p.blood_group ?? "",
    known_conditions: p.known_conditions ?? "",
    current_medications: p.current_medications ?? "",
    allergies: p.allergies ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    (api.getHealthProfile() as Promise<HealthProfile>)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm(toForm(data));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        // Only "no profile yet" means "create one"; anything else is a real error.
        if (/not found/i.test(message)) {
          setIsEditing(true);
        } else {
          setError(message || "Your profile could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    const payload = {
      age: form.age ? Number.parseInt(form.age, 10) : null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      known_conditions: form.known_conditions.trim() || null,
      current_medications: form.current_medications.trim() || null,
      allergies: form.allergies.trim() || null,
    };

    try {
      const saved = (await (profile
        ? api.updateHealthProfile(payload)
        : api.createHealthProfile(payload))) as HealthProfile;
      setProfile(saved);
      setForm(toForm(saved));
      setIsEditing(false);
      setSuccess(profile ? "Profile saved." : "Profile created.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Your profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldId = (key: string) => `profile-${key}`;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <header>
              <h1 className="font-display font-light leading-[0.95] text-lilac text-[clamp(3rem,6vw,4.75rem)]">
                Health profile
              </h1>
              <p className="mt-6 max-w-[42ch] font-light leading-relaxed text-ink-3">
                Your age, sex and known conditions are used to adjust how urgent an
                assessment is. Blood group, medicines and allergies are kept for your
                own reference.
              </p>
              {profile && !isEditing && (
                <button onClick={() => setIsEditing(true)} className={`mt-8 ${BTN_PRIMARY_SM}`}>
                  Edit profile
                </button>
              )}
            </header>

            <section aria-live="polite" aria-busy={isLoading}>
              {error && (
                <div className={`mb-6 ${ALERT_ERROR}`} role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className={`mb-6 ${ALERT_SUCCESS}`} role="status">
                  {success}
                </div>
              )}

              {isLoading ? (
                <p className="font-light text-ink-4">Loading your profile…</p>
              ) : !isEditing && profile ? (
                <dl className="border-t border-edge">
                  {FIELDS.map((f) => (
                    <div key={f.key} className="grid grid-cols-[11rem_1fr] gap-4 border-b border-edge-soft py-4">
                      <dt className="text-sm font-light text-ink-4">
                        {f.label}
                        {f.used && <span className="sr-only"> (used in assessments)</span>}
                      </dt>
                      <dd className={profile[f.key] ? "text-ink" : "font-light text-ink-4"}>
                        {profile[f.key] || "Not provided"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                isEditing && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!profile && (
                      <p className="font-display text-2xl text-ink">
                        You have not created a profile yet.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label htmlFor={fieldId("age")} className={LABEL_CLASS}>Age</label>
                        <input
                          id={fieldId("age")}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="150"
                          value={form.age}
                          onChange={handleChange("age")}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId("gender")} className={LABEL_CLASS}>Sex</label>
                        <select id={fieldId("gender")} value={form.gender} onChange={handleChange("gender")} className={INPUT_CLASS}>
                          <option value="">Not provided</option>
                          {GENDERS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor={fieldId("known_conditions")} className={LABEL_CLASS}>Known conditions</label>
                      <textarea
                        id={fieldId("known_conditions")}
                        rows={3}
                        value={form.known_conditions}
                        onChange={handleChange("known_conditions")}
                        className={INPUT_CLASS}
                        placeholder="For example: diabetes, high blood pressure"
                      />
                    </div>
                    <div className="border-t border-edge-soft pt-6">
                      <p className={`${TRACKED} mb-5 text-ink-4`}>For your reference</p>
                      <div className="space-y-5">
                        <div>
                          <label htmlFor={fieldId("blood_group")} className={LABEL_CLASS}>Blood group</label>
                          <select id={fieldId("blood_group")} value={form.blood_group} onChange={handleChange("blood_group")} className={INPUT_CLASS}>
                            <option value="">Not provided</option>
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={fieldId("current_medications")} className={LABEL_CLASS}>Current medicines</label>
                          <textarea
                            id={fieldId("current_medications")}
                            rows={2}
                            value={form.current_medications}
                            onChange={handleChange("current_medications")}
                            className={INPUT_CLASS}
                            placeholder="For example: metformin 500 mg"
                          />
                        </div>
                        <div>
                          <label htmlFor={fieldId("allergies")} className={LABEL_CLASS}>Allergies</label>
                          <textarea
                            id={fieldId("allergies")}
                            rows={2}
                            value={form.allergies}
                            onChange={handleChange("allergies")}
                            className={INPUT_CLASS}
                            placeholder="For example: penicillin, peanuts"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button type="submit" disabled={isSaving} className={BTN_PRIMARY_SM + " px-8 py-3"}>
                        {isSaving ? "Saving…" : profile ? "Save profile" : "Create profile"}
                      </button>
                      {profile && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm(toForm(profile));
                            setIsEditing(false);
                          }}
                          className={BTN_SECONDARY}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
