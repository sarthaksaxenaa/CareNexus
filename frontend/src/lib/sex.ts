/**
 * Clinical sex on the account: "male" or "female", nothing else.
 *
 * It changes which conditions are possible (the API never suggests period
 * pain to a male patient) and which body the 3D map shows. Accounts created
 * before it was asked have none and are sent to /onboarding once.
 */

export type Sex = "male" | "female";

export const SEX_OPTIONS: readonly { value: Sex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export function isSex(value: unknown): value is Sex {
  return value === "male" || value === "female";
}

export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  sex?: Sex | null;
}

const KEY = "user";

/** The signed-in user saved at login, or null (also on corrupt storage). */
export function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return parsed && typeof parsed === "object" && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function storeUser(user: StoredUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // Storage full or blocked: the next /me call will supply it again.
  }
}

/** True when this account still has to choose its sex. */
export function needsSex(user: { sex?: unknown } | null | undefined): boolean {
  return !!user && !isSex(user.sex);
}

/**
 * Where to go after /onboarding. Only same-site paths are honoured, so a
 * crafted ?next=https://evil.example cannot turn the page into a redirector.
 */
export function safeNext(next: string | null | undefined, fallback = "/chat"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (next.startsWith("/onboarding")) return fallback;
  return next;
}
