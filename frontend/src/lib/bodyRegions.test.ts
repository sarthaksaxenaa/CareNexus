import { describe, expect, it } from "vitest";
import {
  BODY_REGIONS,
  applyRegionToDraft,
  getRegion,
  resolveTorsoRegion,
} from "./bodyRegions";

describe("BODY_REGIONS", () => {
  it("has unique ids", () => {
    const ids = BODY_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ends every phrase with its region id, which the backend parser recognises", () => {
    // Contract with backend/app/core/triage/symptom_parser.py (_BODY_PARTS):
    // the parser matches whole words, so the phrase must end with the id.
    for (const r of BODY_REGIONS) {
      expect(r.phrase.endsWith(` ${r.id}`)).toBe(true);
    }
  });

  it("gives every region a human label", () => {
    for (const r of BODY_REGIONS) expect(r.label.length).toBeGreaterThan(0);
  });
});

describe("getRegion", () => {
  it("returns the matching region", () => {
    expect(getRegion("knee").label).toBe("Knee");
  });
});

describe("resolveTorsoRegion", () => {
  it("maps the upper torso to chest or back", () => {
    expect(resolveTorsoRegion("upper", false)).toBe("chest");
    expect(resolveTorsoRegion("upper", true)).toBe("back");
  });

  it("maps the lower torso to abdomen or back", () => {
    expect(resolveTorsoRegion("lower", false)).toBe("abdomen");
    expect(resolveTorsoRegion("lower", true)).toBe("back");
  });
});

describe("applyRegionToDraft", () => {
  it("fills an empty draft with the region phrase, ready to keep typing", () => {
    expect(applyRegionToDraft("", "chest")).toBe("I have pain in my chest ");
  });

  it("treats a whitespace-only draft as empty", () => {
    expect(applyRegionToDraft("   ", "head")).toBe("I have pain in my head ");
  });

  it("appends to an existing draft instead of overwriting what the user typed", () => {
    expect(applyRegionToDraft("I feel dizzy", "head")).toBe(
      "I feel dizzy (head) ",
    );
  });

  it("is idempotent: selecting the same region twice does not duplicate it", () => {
    const once = applyRegionToDraft("", "knee");
    expect(applyRegionToDraft(once, "knee")).toBe(once);
    const appended = applyRegionToDraft("I feel dizzy", "head");
    expect(applyRegionToDraft(appended, "head")).toBe(appended);
  });

  it("never loses text the user already typed", () => {
    const draft = "sharp pain for 3 days";
    expect(applyRegionToDraft(draft, "back")).toContain(draft);
  });
});
