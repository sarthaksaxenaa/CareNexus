"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface HealthProfile {
  id: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  known_conditions: string | null;
  current_medications: string | null;
  allergies: string | null;
}

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

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const data = await api.getHealthProfile();
      setProfile(data as HealthProfile);
      setForm({
        age: (data as HealthProfile).age?.toString() || "",
        gender: (data as HealthProfile).gender || "",
        blood_group: (data as HealthProfile).blood_group || "",
        known_conditions: (data as HealthProfile).known_conditions || "",
        current_medications: (data as HealthProfile).current_medications || "",
        allergies: (data as HealthProfile).allergies || "",
      });
    } catch {
      // Profile doesn't exist yet — show create form
      setIsEditing(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      await fetchProfile();
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Care<span className="text-blue-600">Nexus</span>
          </h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/chat" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Chat</Link>
          <Link href="/profile" className="text-sm text-blue-600 font-medium">Profile</Link>
        </nav>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🩺 Health Profile</h2>
          {profile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">{success}</div>
        )}

        {!isEditing && profile ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
            {[
              { label: "Age", value: profile.age, icon: "🎂" },
              { label: "Gender", value: profile.gender, icon: "👤" },
              { label: "Blood Group", value: profile.blood_group, icon: "🩸" },
              { label: "Known Conditions", value: profile.known_conditions, icon: "📋" },
              { label: "Current Medications", value: profile.current_medications, icon: "💊" },
              { label: "Allergies", value: profile.allergies, icon: "⚠️" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-gray-900 dark:text-white">{item.value || "Not provided"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                <input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} min="0" max="150" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="25" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => setForm({...form, blood_group: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Known Medical Conditions</label>
              <textarea value={form.known_conditions} onChange={(e) => setForm({...form, known_conditions: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Diabetes, Hypertension" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Medications</label>
              <textarea value={form.current_medications} onChange={(e) => setForm({...form, current_medications: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Metformin 500mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies</label>
              <textarea value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Penicillin, Peanuts" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                {profile ? "Update Profile" : "Create Profile"}
              </button>
              {isEditing && profile && (
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 transition-colors">
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
