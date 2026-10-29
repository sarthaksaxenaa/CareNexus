/**
 * Body regions for the interactive body map.
 *
 * Pure data and logic, deliberately free of React and three.js so it can be
 * unit-tested in isolation and shared by both the 3D view and the accessible
 * list view.
 *
 * CONTRACT with the backend: every `phrase` ends with a word the triage
 * parser recognises (see `_BODY_PARTS` in
 * backend/app/core/triage/symptom_parser.py). The pairing is asserted on
 * both sides: bodyRegions.test.ts here, and test_body_part_extraction.py there.
 */

export type RegionId =
  | "head"
  | "neck"
  | "shoulder"
  | "chest"
  | "abdomen"
  | "back"
  | "arm"
  | "wrist"
  | "hand"
  | "hip"
  | "leg"
  | "knee"
  | "ankle"
  | "foot";

export interface BodyRegion {
  id: RegionId;
  label: string;
  /** Natural-language fragment that seeds the chat message. */
  phrase: string;
}

export const BODY_REGIONS: readonly BodyRegion[] = [
  { id: "head", label: "Head", phrase: "I have pain in my head" },
  { id: "neck", label: "Neck", phrase: "I have pain in my neck" },
  { id: "shoulder", label: "Shoulder", phrase: "I have pain in my shoulder" },
  { id: "chest", label: "Chest", phrase: "I have pain in my chest" },
  { id: "abdomen", label: "Abdomen", phrase: "I have pain in my abdomen" },
  { id: "back", label: "Back", phrase: "I have pain in my back" },
  { id: "arm", label: "Arm", phrase: "I have pain in my arm" },
  { id: "wrist", label: "Wrist", phrase: "I have pain in my wrist" },
  { id: "hand", label: "Hand", phrase: "I have pain in my hand" },
  { id: "hip", label: "Hip", phrase: "I have pain in my hip" },
  { id: "leg", label: "Leg", phrase: "I have pain in my leg" },
  { id: "knee", label: "Knee", phrase: "I have pain in my knee" },
  { id: "ankle", label: "Ankle", phrase: "I have pain in my ankle" },
  { id: "foot", label: "Foot", phrase: "I have pain in my foot" },
];

const BY_ID: ReadonlyMap<RegionId, BodyRegion> = new Map(
  BODY_REGIONS.map((r) => [r.id, r]),
);

export function getRegion(id: RegionId): BodyRegion {
  // The map is built from the same list the type is derived from, so a miss
  // is a programming error, not user input.
  const region = BY_ID.get(id);
  if (!region) throw new Error(`Unknown body region: ${id}`);
  return region;
}

/**
 * The torso is one mesh per zone, so which region a click means depends on
 * which face of it was hit: the same upper-torso mesh is "chest" from the
 * front and "back" from behind.
 */
export function resolveTorsoRegion(
  zone: "upper" | "lower",
  facingBack: boolean,
): RegionId {
  if (facingBack) return "back";
  return zone === "upper" ? "chest" : "abdomen";
}

/**
 * Merge a clicked region into the chat draft.
 *
 * - empty draft  -> the region phrase, with a trailing space to keep typing
 * - existing text -> appended in parentheses; the user's words are never lost
 * - same region twice -> unchanged (idempotent)
 */
export function applyRegionToDraft(draft: string, id: RegionId): string {
  const region = getRegion(id);
  const trimmed = draft.trim();

  if (trimmed === "") return `${region.phrase} `;

  const lower = trimmed.toLowerCase();
  const tag = `(${region.label.toLowerCase()})`;
  if (lower.includes(region.phrase.toLowerCase()) || lower.includes(tag)) {
    return draft;
  }
  return `${draft.trimEnd()} ${tag} `;
}
