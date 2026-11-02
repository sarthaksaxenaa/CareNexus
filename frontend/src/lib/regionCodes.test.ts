import { describe, expect, it } from "vitest";
import { BODY_REGIONS } from "./bodyRegions";
import { REGION_CODES, regionFromCode } from "./regionCodes";

describe("region codes baked into the realistic body models", () => {
  it("gives every body region its own code", () => {
    const codes = BODY_REGIONS.map((r) => REGION_CODES[r.id]);
    expect(new Set(codes).size).toBe(BODY_REGIONS.length);
    for (const code of codes) expect(code).toBeGreaterThan(0);
  });

  it("keeps the codes the Blender script writes (scripts/models/make_body.py)", () => {
    // Changing these needs the models re-exported, so pin them.
    expect(REGION_CODES).toEqual({
      head: 1, neck: 2, shoulder: 3, chest: 4, breast: 5, abdomen: 6, pelvis: 7, back: 8,
      arm: 9, wrist: 10, hand: 11, hip: 12, leg: 13, knee: 14, ankle: 15, foot: 16,
    });
  });

  it("decodes a code back to its region", () => {
    for (const r of BODY_REGIONS) expect(regionFromCode(REGION_CODES[r.id], "female")).toBe(r.id);
  });

  it("tolerates float drift from compression by rounding", () => {
    expect(regionFromCode(3.9996, "male")).toBe("chest");
    expect(regionFromCode(16.0004, "male")).toBe("foot");
  });

  it("returns null for unlabelled or unknown values", () => {
    expect(regionFromCode(0, "male")).toBeNull();
    expect(regionFromCode(17, "male")).toBeNull();
    expect(regionFromCode(Number.NaN, "male")).toBeNull();
    expect(regionFromCode(undefined, "male")).toBeNull();
  });

  it("maps female-only regions to their nearest region on the male body", () => {
    expect(regionFromCode(REGION_CODES.breast, "male")).toBe("chest");
    expect(regionFromCode(REGION_CODES.pelvis, "male")).toBe("abdomen");
  });
});
