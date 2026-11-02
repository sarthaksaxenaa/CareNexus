/**
 * Region codes baked into the realistic body models.
 *
 * Every vertex of public/models/body-{male,female}.glb carries a `_REGION`
 * attribute holding one of these numbers, written by
 * scripts/models/make_body.py. A click on the body reads the code of the
 * triangle it hit, and the shader glows every vertex with the same code.
 *
 * CONTRACT: these numbers must match REGION_IDS in make_body.py.
 */

import type { RegionId } from "./bodyRegions";
import type { Sex } from "./sex";

export const REGION_CODES: Readonly<Record<RegionId, number>> = {
  head: 1,
  neck: 2,
  shoulder: 3,
  chest: 4,
  breast: 5,
  abdomen: 6,
  pelvis: 7,
  back: 8,
  arm: 9,
  wrist: 10,
  hand: 11,
  hip: 12,
  leg: 13,
  knee: 14,
  ankle: 15,
  foot: 16,
};

const BY_CODE = new Map<number, RegionId>(
  (Object.entries(REGION_CODES) as [RegionId, number][]).map(([id, code]) => [code, id]),
);

/** Female-only regions, and what they mean on the male body. */
const MALE_EQUIVALENT: Partial<Record<RegionId, RegionId>> = { breast: "chest", pelvis: "abdomen" };

/** The region for a vertex code, or null for unlabelled geometry (code 0). */
export function regionFromCode(code: number | undefined, sex: Sex): RegionId | null {
  if (code === undefined || !Number.isFinite(code)) return null;
  const id = BY_CODE.get(Math.round(code));
  if (!id) return null;
  return sex === "male" ? (MALE_EQUIVALENT[id] ?? id) : id;
}
