"use client";

import { useGLTF } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  Color,
  Material,
  Mesh,
  PMREMGenerator,
  type Object3D,
  type Scene,
  type WebGLProgramParametersWithUniforms,
  type WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { RegionId } from "@/lib/bodyRegions";
import { REGION_CODES, regionFromCode } from "@/lib/regionCodes";
import type { Sex } from "@/lib/sex";

/**
 * A photorealistic body, generated with MakeHuman (see
 * scripts/models/make_body.py and public/models/CREDITS.md).
 *
 * The body is one skinned-looking mesh, so regions are not separate meshes:
 * every vertex carries a `_REGION` code. A click reads the code of the
 * triangle it hit; the glow is done in the shader, so it follows the skin
 * exactly instead of floating a shape over it.
 */

export const modelUrl = (sex: Sex) => `/models/body-${sex}.glb`;

// Hover and selection glows, the same amethyst as the mannequin.
const HOVER = new Color("#6420a8");
const SELECTED = new Color("#8a4fd1");

interface GlowUniforms {
  uHovered: { value: number };
  uSelected: { value: number };
  uHoverColor: { value: Color };
  uSelectedColor: { value: Color };
}

/** Teach a glTF material to glow the vertices whose region is hovered or selected. */
function addRegionGlow(material: Material, uniforms: GlowUniforms) {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    // Per-vertex 0/1 "is this region lit", interpolated across triangles and
    // then thresholded: the glow edge runs smoothly between vertices instead
    // of following the jagged triangle outline.
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float _region;\nuniform float uHovered;\nuniform float uSelected;\nvarying float vSel;\nvarying float vHov;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nfloat rCode = floor(_region + 0.5);\nvSel = (rCode > 0.5 && abs(rCode - uSelected) < 0.5) ? 1.0 : 0.0;\nvHov = (rCode > 0.5 && abs(rCode - uHovered) < 0.5) ? 1.0 : 0.0;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vSel;\nvarying float vHov;\nuniform vec3 uHoverColor;\nuniform vec3 uSelectedColor;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "float gSel = smoothstep(0.35, 0.65, vSel);",
          "float gHov = smoothstep(0.35, 0.65, vHov) * (1.0 - gSel);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.64, 0.44, 0.95), 0.55 * gSel + 0.35 * gHov);",
          "totalEmissiveRadiance += uSelectedColor * 0.6 * gSel + uHoverColor * 0.45 * gHov;",
        ].join("\n"),
      );
  };
  // One compiled program for all glowing materials, distinct from plain ones.
  material.customProgramCacheKey = () => "carenexus-region-glow";
  material.needsUpdate = true;
}

/**
 * Soft studio reflections, generated on the GPU (no HDR download), so skin
 * reads as skin rather than plastic. Returns a cleanup function.
 */
function applyStudioEnvironment(gl: WebGLRenderer, scene: Scene): () => void {
  const pmrem = new PMREMGenerator(gl);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  return () => {
    if (scene.environment === env) scene.environment = null;
    env.dispose();
    room.dispose();
    pmrem.dispose();
  };
}

interface RealisticBodyProps {
  sex: Sex;
  selected: RegionId | null;
  hovered: RegionId | null;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId) => void;
  /** Height of the floor in scene units; the feet are placed on it. */
  floorY: number;
  onReady?: () => void;
}

const codeFor = (id: RegionId | null) => (id === null ? -1 : REGION_CODES[id]);

/** Point the shader at the hovered and selected regions (three.js uniforms are mutable by design). */
function setGlow(uniforms: GlowUniforms, hovered: RegionId | null, selected: RegionId | null) {
  uniforms.uHovered.value = codeFor(hovered);
  uniforms.uSelected.value = codeFor(selected);
}

export default function RealisticBody({ sex, selected, hovered, onHover, onSelect, floorY, onReady }: RealisticBodyProps) {
  const { scene } = useGLTF(modelUrl(sex), false, true);

  const uniforms = useMemo<GlowUniforms>(
    () => ({
      uHovered: { value: -1 },
      uSelected: { value: -1 },
      uHoverColor: { value: HOVER },
      uSelectedColor: { value: SELECTED },
    }),
    [],
  );

  // A private copy, so the cached glTF is never mutated and materials get our glow.
  const body = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((o: Object3D) => {
      if (!(o instanceof Mesh)) return;
      const materials = (Array.isArray(o.material) ? o.material : [o.material]).map((m: Material) => {
        const own = m.clone();
        addRegionGlow(own, uniforms);
        return own;
      });
      o.material = Array.isArray(o.material) ? materials : materials[0];
    });
    return copy;
  }, [scene, uniforms]);

  // Uniforms change outside React's render, so ask for a frame (the canvas
  // renders on demand under reduced motion).
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const threeScene = useThree((s) => s.scene);
  useEffect(() => applyStudioEnvironment(gl, threeScene), [gl, threeScene]);
  useEffect(() => {
    setGlow(uniforms, hovered, selected);
    invalidate();
  }, [uniforms, hovered, selected, invalidate]);

  useEffect(() => {
    onReady?.();
  }, [body, onReady]);

  const regionAt = (e: ThreeEvent<MouseEvent | PointerEvent>): RegionId | null => {
    const mesh = e.object as Mesh;
    const attr = mesh.geometry?.getAttribute("_region");
    if (!attr || !e.face) return null;
    return regionFromCode(attr.getX(e.face.a), sex);
  };

  return (
    <primitive
      object={body}
      position={[0, floorY, 0]}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(regionAt(e));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const id = regionAt(e);
        if (id) onSelect(id);
      }}
    />
  );
}
