/**
 * Clinical triage levels, as returned by the API.
 *
 * Deliberately NOT amethyst. Emerald / amber / crimson are near-universal
 * clinical signals; re-skinning them would trade safety for consistency.
 * Every screen that shows a triage level reads it from here.
 */
export type TriageLevel = "green" | "yellow" | "red";

export const TRIAGE: Record<
  TriageLevel,
  { label: string; meaning: string; dot: string; text: string; rule: string }
> = {
  green: {
    label: "Self-care",
    meaning: "Usually safe to manage at home, with clear signs to watch for.",
    dot: "bg-triage-green",
    text: "text-triage-green",
    rule: "border-triage-green/60",
  },
  yellow: {
    label: "See a doctor",
    meaning: "Book an appointment soon; it should be examined in person.",
    dot: "bg-triage-amber",
    text: "text-triage-amber",
    rule: "border-triage-amber/60",
  },
  red: {
    label: "Emergency",
    meaning: "Get help now: call your local emergency number.",
    dot: "bg-triage-red",
    text: "text-triage-red",
    rule: "border-triage-red/70",
  },
};

export const TRIAGE_ORDER: TriageLevel[] = ["green", "yellow", "red"];

export function asTriageLevel(value: string | null | undefined): TriageLevel | null {
  return value === "green" || value === "yellow" || value === "red" ? value : null;
}
