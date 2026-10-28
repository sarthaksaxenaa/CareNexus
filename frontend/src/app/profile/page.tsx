"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY, BTN_SECONDARY, BTN_PRIMARY_SM, ALERT_ERROR, ALERT_SUCCESS, CARD } from "@/lib/styles";
import Navbar from "@/components/Navbar";

interface HealthProfile {
  id: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  known_conditions: string | null;
  current_medications: string | null;
  allergies: string | null;
}

// ─── Constants (outside component to avoid re-creation per render) ────────
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

const PROFILE_FIELDS = [
  { label: "Age", key: "age" as const, icon: "🎂" },
  { label: "Gender", key: "gender" as const, icon: "👤" },
  { label: "Blood Group", key: "blood_group" as const, icon: "🩸" },
  { label: "Known Conditions", key: "known_conditions" as const, icon: "📋" },
  { label: "Current Medications", key: "current_medications" as const, icon: "💊" },
  { label: "Allergies", key: "allergies" as const, icon: "⚠️" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    age: "",
    gender: "",
    blood_group: "",
    known_conditions: "",
    current_medications: "",
    allergies: "",
  });

  /** Generic change handler — eliminates 6 inline setForm calls. */
  const handleChange = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = (await api.getHealthProfile()) as HealthProfile;
        setProfile(data);
        setForm({
          age: data.age?.toString() || "",
          gender: data.gender || "",
          blood_group: data.blood_group || "",
          known_conditions: data.known_conditions || "",
          current_medications: data.current_medications || "",
          allergies: data.allergies || "",
        });
      } catch {
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      known_conditions: form.known_conditions || null,
      current_medications: form.current_medications || null,
      allergies: form.allergies || null,
    };

    try {
      if (profile) {
        await api.updateHealthProfile(payload);
        setSuccess("Profile updated successfully!");
      } else {
        await api.createHealthProfile(payload);
        setSuccess("Profile created successfully!");
      }
      // Re-fetch to sync state
      const data = (await api.getHealthProfile()) as HealthProfile;
      setProfile(data);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void" role="status" aria-label="Loading profile">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-b-amethyst-300" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-void">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink">🩺 Health Profile</h2>
          {profile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={BTN_PRIMARY_SM}
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className={`mb-4 ${ALERT_ERROR}`} role="alert">{error}</div>
        )}
        {success && (
          <div className={`mb-4 ${ALERT_SUCCESS}`} role="status">{success}</div>
        )}

        {!isEditing && profile ? (
          <div className={`${CARD} p-6 space-y-4`}>
            {PROFILE_FIELDS.map((item) => (
              <div key={item.key} className="flex items-start gap-3 py-2 border-b border-edge-soft last:border-0">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-medium text-ink-4 uppercase tracking-wider">{item.label}</p>
                  <p className="text-ink">{profile[item.key] || "Not provided"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`${CARD} p-6 space-y-5`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Age</label>
                <input type="number" value={form.age} onChange={handleChange("age")} min="0" max="150" className={INPUT_CLASS} placeholder="25" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender</label>
                <select value={form.gender} onChange={handleChange("gender")} className={INPUT_CLASS}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Blood Group</label>
              <select value={form.blood_group} onChange={handleChange("blood_group")} className={INPUT_CLASS}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Known Medical Conditions</label>
              <textarea value={form.known_conditions} onChange={handleChange("known_conditions")} rows={3} className={INPUT_CLASS} placeholder="e.g., Diabetes, Hypertension" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Current Medications</label>
              <textarea value={form.current_medications} onChange={handleChange("current_medications")} rows={2} className={INPUT_CLASS} placeholder="e.g., Metformin 500mg" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Allergies</label>
              <textarea value={form.allergies} onChange={handleChange("allergies")} rows={2} className={INPUT_CLASS} placeholder="e.g., Penicillin, Peanuts" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className={BTN_PRIMARY}>
                {profile ? "Update Profile" : "Create Profile"}
              </button>
              {isEditing && profile && (
                <button type="button" onClick={() => setIsEditing(false)} className={BTN_SECONDARY}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
