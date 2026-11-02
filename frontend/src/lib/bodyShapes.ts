/**
 * Proportions of the male and female mannequins on the 3D body map.
 *
 * Pure data, free of three.js, so the anatomy can be unit-tested: the male
 * figure is broader at the shoulder than the hip (a V-taper), the female
 * figure has narrower shoulders, a defined waist and wider hips, and only it
 * has breast and pelvis regions.
 *
 * Units are scene units (about 1.9 for the full height). The torso and limbs
 * are lathe surfaces: a profile of [radius, height] points spun around the
 * vertical axis, then flattened front-to-back by `depth`.
 */

import type { Sex } from "./sex";

export type Profile = readonly (readonly [radius: number, y: number])[];

export interface Limb {
  /** Profile from the joint downwards, y relative to the joint (negative). */
  profile: Profile;
}

export interface BodyShape {
  head: { y: number; radii: readonly [number, number, number] };
  neck: { y: number; radius: number; height: number };
  /** Torso zones, top to bottom, sharing radii where they meet. */
  chest: Profile;
  abdomen: Profile;
  hips: Profile;
  /** Front-to-back flattening of the torso (1 would be round). */
  depth: number;
  shoulder: { x: number; y: number; radius: number };
  /** Outward tilt of the arms from vertical, radians (an A-pose). */
  armSpread: number;
  upperArm: Limb;
  forearm: Limb;
  hand: { radii: readonly [number, number, number] };
  legX: number;
  thigh: Limb;
  shin: Limb;
  hipJointY: number;
  kneeY: number;
  ankleY: number;
  foot: { size: readonly [number, number, number] };
  breast?: { x: number; y: number; z: number; radius: number };
}

const MALE: BodyShape = {
  head: { y: 1.635, radii: [0.1, 0.122, 0.112] },
  neck: { y: 1.48, radius: 0.052, height: 0.12 },
  chest: [
    [0, 1.445],
    [0.07, 1.44],
    [0.155, 1.415],
    [0.218, 1.365],
    [0.212, 1.3],
    [0.188, 1.2],
    [0.155, 1.09],
  ],
  abdomen: [
    [0.155, 1.09],
    [0.14, 1.02],
    [0.145, 0.95],
    [0.153, 0.88],
  ],
  hips: [
    [0.153, 0.88],
    [0.16, 0.81],
    [0.152, 0.75],
    [0.115, 0.705],
    [0, 0.69],
  ],
  depth: 0.6,
  shoulder: { x: 0.228, y: 1.345, radius: 0.07 },
  armSpread: 0.11,
  upperArm: {
    profile: [
      [0.055, 0],
      [0.058, -0.06],
      [0.05, -0.18],
      [0.042, -0.27],
    ],
  },
  forearm: {
    profile: [
      [0.042, 0],
      [0.045, -0.05],
      [0.036, -0.17],
      [0.03, -0.25],
    ],
  },
  hand: { radii: [0.042, 0.068, 0.024] },
  legX: 0.088,
  thigh: {
    // Starts above the hip joint with a rounded cap, hidden inside the hips,
    // so no flat disc shows where the leg meets the pelvis.
    profile: [
      [0.035, 0.07],
      [0.08, 0.03],
      [0.09, -0.01],
      [0.088, -0.08],
      [0.072, -0.24],
      [0.058, -0.36],
    ],
  },
  shin: {
    profile: [
      [0.056, 0],
      [0.062, -0.08],
      [0.05, -0.2],
      [0.036, -0.34],
    ],
  },
  hipJointY: 0.74,
  kneeY: 0.37,
  ankleY: -0.01,
  foot: { size: [0.085, 0.05, 0.21] },
};

const FEMALE: BodyShape = {
  head: { y: 1.62, radii: [0.094, 0.118, 0.108] },
  neck: { y: 1.47, radius: 0.044, height: 0.12 },
  chest: [
    [0, 1.43],
    [0.06, 1.425],
    [0.13, 1.4],
    [0.172, 1.355],
    [0.165, 1.29],
    [0.155, 1.2],
    [0.13, 1.09],
  ],
  abdomen: [
    [0.13, 1.09],
    [0.118, 1.03],
    [0.132, 0.95],
    [0.168, 0.88],
  ],
  hips: [
    [0.168, 0.88],
    [0.188, 0.8],
    [0.18, 0.745],
    [0.125, 0.7],
    [0, 0.685],
  ],
  depth: 0.62,
  shoulder: { x: 0.18, y: 1.335, radius: 0.058 },
  armSpread: 0.2,
  upperArm: {
    profile: [
      [0.046, 0],
      [0.048, -0.06],
      [0.042, -0.18],
      [0.036, -0.26],
    ],
  },
  forearm: {
    profile: [
      [0.036, 0],
      [0.038, -0.05],
      [0.031, -0.16],
      [0.026, -0.24],
    ],
  },
  hand: { radii: [0.036, 0.062, 0.021] },
  legX: 0.095,
  thigh: {
    profile: [
      [0.04, 0.07],
      [0.088, 0.03],
      [0.097, -0.01],
      [0.095, -0.08],
      [0.072, -0.24],
      [0.055, -0.36],
    ],
  },
  shin: {
    profile: [
      [0.053, 0],
      [0.058, -0.08],
      [0.045, -0.2],
      [0.032, -0.34],
    ],
  },
  hipJointY: 0.73,
  kneeY: 0.36,
  ankleY: -0.02,
  foot: { size: [0.075, 0.045, 0.19] },
  breast: { x: 0.068, y: 1.212, z: 0.066, radius: 0.055 },
};

export function bodyShape(sex: Sex): BodyShape {
  return sex === "female" ? FEMALE : MALE;
}

/** Widest radius of a profile. */
export const widest = (profile: Profile): number => Math.max(...profile.map(([r]) => r));

/** Radius at the narrowest point between two heights (e.g. the waist). */
export function narrowestBetween(profiles: readonly Profile[], top: number, bottom: number): number {
  const radii = profiles.flat().filter(([, y]) => y <= top && y >= bottom).map(([r]) => r);
  return Math.min(...radii);
}

/**
 * Smooth a profile with a Catmull-Rom spline, so a handful of measured points
 * becomes a continuous silhouette. Endpoints are kept exactly, so adjacent
 * zones still meet.
 */
export function smoothProfile(profile: Profile, segmentsPerSpan = 6): [number, number][] {
  const pts = profile.map(([r, y]) => [r, y] as [number, number]);
  if (pts.length < 3) return pts;
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < segmentsPerSpan; s++) {
      const t = s / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([Math.max(0, at(0)), at(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
