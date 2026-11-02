"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import RealisticBody from "@/components/RealisticBody";
import { Vector2 } from "three";
import { resolveTorsoRegion, type RegionId } from "@/lib/bodyRegions";
import { bodyShape, smoothProfile, type Profile } from "@/lib/bodyShapes";
import type { Sex } from "@/lib/sex";

/**
 * Interactive 3D mannequin, male or female, sculpted in code.
 *
 * No downloaded model on purpose: zero licence risk, no asset to ship, works
 * offline, and every body part is its own mesh so a click maps to a region
 * exactly (a bought model fuses everything into one mesh). The torso and
 * limbs are lathe surfaces built from the proportions in lib/bodyShapes.ts.
 *
 * The body never rotates. The camera orbits it, so world coordinates equal
 * body coordinates and "z < 0" reliably means "the back of the body".
 */

// A neutral mannequin grey that lights up in amethyst. three.js materials
// cannot read CSS variables, so the hex values live here.
const COLOR = {
  base: "#a59fb0",
  baseGlow: "#1d1528",
  hover: "#c7a8f0",
  hoverGlow: "#6420a8",
  selected: "#dcc8f8",
  selectedGlow: "#8a4fd1",
} as const;

type ClickEvent = ThreeEvent<MouseEvent | PointerEvent>;

interface PartProps {
  /** Regions this mesh can stand for (a torso mesh is chest OR back). */
  regions: readonly RegionId[];
  /** Decide which region a pointer event means. */
  resolve: (e: ClickEvent) => RegionId;
  position: [number, number, number];
  selected: RegionId | null;
  hovered: RegionId | null;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId) => void;
  children: (material: ReactNode) => ReactNode;
}

function Part({
  regions,
  resolve,
  position,
  selected,
  hovered,
  onHover,
  onSelect,
  children,
}: PartProps) {
  const isSelected = selected !== null && regions.includes(selected);
  const isHovered = hovered !== null && regions.includes(hovered);

  const material = (
    <meshStandardMaterial
      color={isSelected ? COLOR.selected : isHovered ? COLOR.hover : COLOR.base}
      emissive={
        isSelected
          ? COLOR.selectedGlow
          : isHovered
            ? COLOR.hoverGlow
            : COLOR.baseGlow
      }
      emissiveIntensity={isSelected ? 0.75 : isHovered ? 0.55 : 0.25}
      roughness={0.55}
      metalness={0.05}
    />
  );

  return (
    <group
      position={position}
      onPointerMove={(e) => {
        e.stopPropagation(); // only the nearest part reacts
        onHover(resolve(e));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(resolve(e));
      }}
    >
      {children(material)}
    </group>
  );
}

/** A lathe surface from a top-to-bottom profile, flattened by `depth`. */
function LatheMesh({ profile, depth = 1, material }: { profile: Profile; depth?: number; material: ReactNode }) {
  // LatheGeometry wants the profile bottom-to-top for outward-facing normals.
  const points = useMemo(
    () => smoothProfile(profile).reverse().map(([r, y]) => new Vector2(r, y)),
    [profile],
  );
  return (
    <mesh scale={[1, 1, depth]}>
      <latheGeometry args={[points, 56]} />
      {material}
    </mesh>
  );
}

interface MannequinProps {
  sex: Sex;
  selected: RegionId | null;
  hovered: RegionId | null;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId) => void;
}

/** The sculpted stand-in, shown while the realistic body loads or if it cannot. */
function Mannequin({ sex, selected, hovered, onHover, onSelect }: MannequinProps) {
  const shape = bodyShape(sex);
  const common = { selected, hovered, onHover, onSelect };
  const fixed = (id: RegionId) => () => id;
  const facingBack = (e: ClickEvent) => e.point.z < 0;
  // On the female body the front of the lower pelvis is its own region.
  const hipOrPelvis = (e: ClickEvent): RegionId =>
    sex === "female" && e.point.z > 0.03 && e.point.y > 0.72 ? "pelvis" : "hip";

  // Mirrored limbs: build once per side.
  const sides = [-1, 1] as const;
  const upperLen = -shape.upperArm.profile.at(-1)![1];
  const foreLen = -shape.forearm.profile.at(-1)![1];

  return (
    <group>
    {/* Head and neck */}
    <Part {...common} regions={["head"]} resolve={fixed("head")} position={[0, shape.head.y, 0]}>
      {(m) => (
        <mesh scale={shape.head.radii as [number, number, number]}>
          <sphereGeometry args={[1, 40, 40]} />
          {m}
        </mesh>
      )}
    </Part>
    <Part {...common} regions={["neck"]} resolve={fixed("neck")} position={[0, shape.neck.y, 0]}>
      {(m) => (
        <mesh>
          <cylinderGeometry args={[shape.neck.radius, shape.neck.radius * 1.15, shape.neck.height, 24]} />
          {m}
        </mesh>
      )}
    </Part>

    {/* Torso: one lathe per zone, front/back decided by where it was hit */}
    <Part
      {...common}
      regions={["chest", "back"]}
      resolve={(e) => resolveTorsoRegion("upper", facingBack(e))}
      position={[0, 0, 0]}
    >
      {(m) => <LatheMesh profile={shape.chest} depth={shape.depth} material={m} />}
    </Part>
    <Part
      {...common}
      regions={["abdomen", "back"]}
      resolve={(e) => resolveTorsoRegion("lower", facingBack(e))}
      position={[0, 0, 0]}
    >
      {(m) => <LatheMesh profile={shape.abdomen} depth={shape.depth} material={m} />}
    </Part>
    <Part
      {...common}
      regions={sex === "female" ? ["hip", "pelvis"] : ["hip"]}
      resolve={hipOrPelvis}
      position={[0, 0, 0]}
    >
      {(m) => <LatheMesh profile={shape.hips} depth={shape.depth} material={m} />}
    </Part>

    {/* Breasts (female body only) */}
    {shape.breast &&
      sides.map((s) => (
        <Part
          key={`breast-${s}`}
          {...common}
          regions={["breast"]}
          resolve={fixed("breast")}
          position={[shape.breast!.x * s, shape.breast!.y, shape.breast!.z]}
        >
          {(m) => (
            <mesh scale={[1, 0.92, 0.82]}>
              <sphereGeometry args={[shape.breast!.radius, 32, 32]} />
              {m}
            </mesh>
          )}
        </Part>
      ))}

    {/* Arms: hung from the shoulder and tilted out into an A-pose */}
    {sides.map((s) => (
      <group key={`arm-${s}`}>
        <Part {...common} regions={["shoulder"]} resolve={fixed("shoulder")} position={[shape.shoulder.x * s, shape.shoulder.y, 0]}>
          {(m) => (
            <mesh>
              <sphereGeometry args={[shape.shoulder.radius, 28, 28]} />
              {m}
            </mesh>
          )}
        </Part>
        <group position={[shape.shoulder.x * s, shape.shoulder.y, 0]} rotation={[0, 0, shape.armSpread * s]}>
          <Part {...common} regions={["arm"]} resolve={fixed("arm")} position={[0, 0, 0]}>
            {(m) => <LatheMesh profile={shape.upperArm.profile} material={m} />}
          </Part>
          <Part {...common} regions={["arm"]} resolve={fixed("arm")} position={[0, -upperLen, 0]}>
            {(m) => <LatheMesh profile={shape.forearm.profile} material={m} />}
          </Part>
          <Part {...common} regions={["wrist"]} resolve={fixed("wrist")} position={[0, -upperLen - foreLen, 0]}>
            {(m) => (
              <mesh>
                <sphereGeometry args={[shape.forearm.profile.at(-1)![0] * 1.25, 20, 20]} />
                {m}
              </mesh>
            )}
          </Part>
          <Part
            {...common}
            regions={["hand"]}
            resolve={fixed("hand")}
            position={[0, -upperLen - foreLen - shape.hand.radii[1] * 0.85, 0]}
          >
            {(m) => (
              <mesh scale={shape.hand.radii as [number, number, number]}>
                <sphereGeometry args={[1, 24, 24]} />
                {m}
              </mesh>
            )}
          </Part>
        </group>
      </group>
    ))}

    {/* Legs */}
    {sides.map((s) => (
      <group key={`leg-${s}`}>
        <Part {...common} regions={["leg"]} resolve={fixed("leg")} position={[shape.legX * s, shape.hipJointY, 0]}>
          {(m) => <LatheMesh profile={shape.thigh.profile} depth={0.95} material={m} />}
        </Part>
        <Part {...common} regions={["knee"]} resolve={fixed("knee")} position={[shape.legX * s, shape.kneeY, 0.008]}>
          {(m) => (
            <mesh>
              {/* Slightly proud of the thigh and shin, or it is buried and can never be clicked. */}
              <sphereGeometry args={[shape.thigh.profile.at(-1)![0] * 1.08, 24, 24]} />
              {m}
            </mesh>
          )}
        </Part>
        <Part {...common} regions={["leg"]} resolve={fixed("leg")} position={[shape.legX * s, shape.kneeY, 0]}>
          {(m) => <LatheMesh profile={shape.shin.profile} depth={0.95} material={m} />}
        </Part>
        <Part {...common} regions={["ankle"]} resolve={fixed("ankle")} position={[shape.legX * s, shape.ankleY, 0]}>
          {(m) => (
            <mesh>
              <sphereGeometry args={[shape.shin.profile.at(-1)![0] * 1.3, 20, 20]} />
              {m}
            </mesh>
          )}
        </Part>
        <Part
          {...common}
          regions={["foot"]}
          resolve={fixed("foot")}
          position={[shape.legX * s * 1.05, shape.ankleY - shape.foot.size[1] / 2 - 0.02, shape.foot.size[2] / 2 - 0.045]}
        >
          {(m) => (
            <RoundedBox args={shape.foot.size as [number, number, number]} radius={0.022} smoothness={3}>
              {m}
            </RoundedBox>
          )}
        </Part>
      </group>
    ))}
    </group>
  );
}

/** Falls back to the mannequin if the model fails to download or parse. */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface BodyMapSceneProps {
  /** Which mannequin to show. */
  sex: Sex;
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  /** False under prefers-reduced-motion: no auto-rotation, render on demand. */
  animate: boolean;
  /** Called if the GPU drops the WebGL context, so the UI can fall back. */
  onContextLost?: () => void;
}

export default function BodyMapScene({
  sex,
  selected,
  onSelect,
  animate,
  onContextLost,
}: BodyMapSceneProps) {
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const shape = bodyShape(sex);

  // Unmounting the canvas (switching to the list, closing the panel) makes
  // three.js release its WebGL context on purpose, which fires the same
  // "webglcontextlost" event as a GPU crash. Only a loss while mounted is real.
  const unmounting = useRef(false);
  useEffect(() => {
    unmounting.current = false;
    return () => {
      unmounting.current = true;
    };
  }, []);

  // Pointer cursor over a clickable part. Writes to the DOM only; no setState.
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  const footBottom = shape.ankleY - shape.foot.size[1] - 0.03;
  const [realistic, setRealistic] = useState(false);
  const onReady = useCallback(() => setRealistic(true), []);
  const shared = { sex, selected, hovered, onHover: setHovered, onSelect };
  const mannequin = <Mannequin {...shared} />;

  return (
    <div
      role="img"
      data-body={realistic ? "realistic" : "mannequin"}
      aria-label={`Interactive 3D ${sex} body. Click a body part to describe where it hurts. A list view is available for keyboard and screen reader use.`}
      className="h-full w-full"
    >
      <Canvas
        camera={{ position: [0, 0.85, 3.4], fov: 34 }}
        dpr={[1, 2]}
        frameloop={animate ? "always" : "demand"}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            if (!unmounting.current) onContextLost?.();
          });
        }}
      >
        {/* Soft studio light shows the form; a lilac rim from behind gives the
            amethyst edge without tinting the whole figure. */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[2.5, 4.5, 4]} intensity={2.2} color="#f4effa" />
        <directionalLight position={[-3, 2, 2]} intensity={0.6} color="#ddd5e8" />
        {/* Softer rims on the realistic body, or they tint the skin purple. */}
        <pointLight position={[-2.5, 1.8, -2]} intensity={realistic ? 9 : 30} color="#c7a8f0" />
        <pointLight position={[2.5, 0.5, -1.5]} intensity={realistic ? 3 : 14} color="#6420a8" />

        {/* The realistic body loads in the background; until then, or if it
            cannot load, the sculpted mannequin stands in. */}
        <ModelBoundary key={sex} fallback={mannequin}>
          <Suspense fallback={mannequin}>
            <RealisticBody {...shared} floorY={footBottom + 0.012} onReady={onReady} />
          </Suspense>
        </ModelBoundary>

        {/* Decorative base ring (not interactive) */}
        <mesh rotation-x={-Math.PI / 2} position={[0, footBottom, 0]}>
          <ringGeometry args={[0.5, 0.54, 64]} />
          <meshBasicMaterial color="#c7a8f0" transparent opacity={0.35} />
        </mesh>

        <OrbitControls
          target={[0, 0.78, 0]}
          enablePan={false}
          enableZoom={false}
          autoRotate={animate && hovered === null}
          autoRotateSpeed={1.4}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
        />
      </Canvas>
    </div>
  );
}
