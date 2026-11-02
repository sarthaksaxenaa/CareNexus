import { describe, expect, it } from "vitest";
import { bodyShape, narrowestBetween, smoothProfile, widest, type Profile } from "./bodyShapes";

const male = bodyShape("male");
const female = bodyShape("female");
const torso = (s: typeof male) => [s.chest, s.abdomen, s.hips];

describe("body proportions", () => {
  it("gives the male figure broader shoulders than hips (V-taper)", () => {
    expect(widest(male.chest)).toBeGreaterThan(widest(male.hips));
  });

  it("gives the female figure wider hips than shoulders", () => {
    expect(widest(female.hips)).toBeGreaterThan(widest(female.chest));
  });

  it("gives the female figure the more defined waist", () => {
    const ratio = (s: typeof male) => narrowestBetween(torso(s), 1.08, 0.9) / widest(s.hips);
    expect(ratio(female)).toBeLessThan(ratio(male));
    expect(ratio(female)).toBeLessThan(0.75);
  });

  it("puts breasts on the female figure only", () => {
    expect(female.breast).toBeDefined();
    expect(male.breast).toBeUndefined();
  });

  it("joins the torso zones without a gap", () => {
    for (const s of [male, female]) {
      expect(s.chest.at(-1)).toEqual(s.abdomen[0]);
      expect(s.abdomen.at(-1)).toEqual(s.hips[0]);
    }
  });

  it("runs every profile from top to bottom", () => {
    for (const s of [male, female]) {
      for (const p of [...torso(s), s.upperArm.profile, s.forearm.profile, s.thigh.profile, s.shin.profile]) {
        for (let i = 1; i < p.length; i++) expect(p[i][1]).toBeLessThan(p[i - 1][1]);
      }
    }
  });
});

describe("smoothProfile", () => {
  const profile: Profile = [
    [0, 1],
    [0.2, 0.8],
    [0.1, 0.5],
    [0.15, 0.2],
  ];

  it("keeps both endpoints exactly, so zones still meet", () => {
    const out = smoothProfile(profile);
    expect(out[0]).toEqual([0, 1]);
    expect(out.at(-1)).toEqual([0.15, 0.2]);
  });

  it("adds points between the measured ones and never a negative radius", () => {
    const out = smoothProfile(profile, 8);
    expect(out.length).toBe((profile.length - 1) * 8 + 1);
    for (const [r] of out) expect(r).toBeGreaterThanOrEqual(0);
  });
});
