"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useState, type ReactNode } from "react";
import { resolveTorsoRegion, type RegionId } from "@/lib/bodyRegions";

/**
 * Interactive 3D body, built procedurally from primitives.
 *
 * No downloaded model on purpose: zero licence risk, 0 KB of asset to ship,
 * works offline, and every body part is its own mesh so a click maps to a
 * region exactly (a purchased model fuses everything into one mesh).
 *
 * The body never rotates. The camera orbits it, so world coordinates equal
 * body coordinates and "z < 0" reliably means "the back of the body".
 */

// Obsidian Amethyst, mirrored from the tokens in globals.css. three.js
// materials cannot read CSS variables, so the hex values live here.
const COLOR = {
  base: "#3d2c57",
  baseGlow: "#2a0a4d",
  hover: "#a77de6",
  hoverGlow: "#6420a8",
  selected: "#c7a8f0",
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
      emissiveIntensity={isSelected ? 0.75 : isHovered ? 0.55 : 0.32}
      roughness={0.45}
      metalness={0.15}
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

interface BodyMapSceneProps {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  /** False under prefers-reduced-motion: no auto-rotation, render on demand. */
  animate: boolean;
  /** Called if the GPU drops the WebGL context, so the UI can fall back. */
  onContextLost?: () => void;
}

export default function BodyMapScene({
  selected,
  onSelect,
  animate,
  onContextLost,
}: BodyMapSceneProps) {
  const [hovered, setHovered] = useState<RegionId | null>(null);

  // Pointer cursor over a clickable part. Writes to the DOM only; no setState.
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  const common = { selected, hovered, onHover: setHovered, onSelect };
  const fixed = (id: RegionId) => () => id;
  const facingBack = (e: ClickEvent) => e.point.z < 0;

  // Mirrored limbs: build once per side.
  const sides = [-1, 1] as const;

  return (
    <div
      role="img"
      aria-label="Interactive 3D human body. Click a body part to describe where it hurts. A list view is available for keyboard and screen reader use."
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
            onContextLost?.();
          });
        }}
      >
        {/* Neutral key light shows the form; a lilac rim from behind gives the
            amethyst edge without flooding every surface violet. */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={2.6} color="#f4effa" />
        <pointLight position={[-2.5, 1.8, -2]} intensity={34} color="#c7a8f0" />
        <pointLight position={[2.5, 0.5, 2]} intensity={10} color="#3b0a6b" />

        {/* Head and neck */}
        <Part {...common} regions={["head"]} resolve={fixed("head")} position={[0, 1.62, 0]}>
          {(m) => (
            <mesh>
              <sphereGeometry args={[0.115, 32, 32]} />
              {m}
            </mesh>
          )}
        </Part>
        <Part {...common} regions={["neck"]} resolve={fixed("neck")} position={[0, 1.47, 0]}>
          {(m) => (
            <mesh>
              <cylinderGeometry args={[0.05, 0.058, 0.1, 20]} />
              {m}
            </mesh>
          )}
        </Part>

        {/* Torso: one mesh per zone, front/back decided by where it was hit */}
        <Part
          {...common}
          regions={["chest", "back"]}
          resolve={(e) => resolveTorsoRegion("upper", facingBack(e))}
          position={[0, 1.2, 0]}
        >
          {(m) => (
            <RoundedBox args={[0.38, 0.32, 0.2]} radius={0.07} smoothness={4}>
              {m}
            </RoundedBox>
          )}
        </Part>
        <Part
          {...common}
          regions={["abdomen", "back"]}
          resolve={(e) => resolveTorsoRegion("lower", facingBack(e))}
          position={[0, 0.94, 0]}
        >
          {(m) => (
            <RoundedBox args={[0.33, 0.26, 0.19]} radius={0.06} smoothness={4}>
              {m}
            </RoundedBox>
          )}
        </Part>
        <Part {...common} regions={["hip"]} resolve={fixed("hip")} position={[0, 0.74, 0]}>
          {(m) => (
            <RoundedBox args={[0.35, 0.16, 0.2]} radius={0.06} smoothness={4}>
              {m}
            </RoundedBox>
          )}
        </Part>

        {/* Arms */}
        {sides.map((s) => (
          <group key={`arm-${s}`}>
            <Part {...common} regions={["shoulder"]} resolve={fixed("shoulder")} position={[0.23 * s, 1.34, 0]}>
              {(m) => (
                <mesh>
                  <sphereGeometry args={[0.075, 24, 24]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["arm"]} resolve={fixed("arm")} position={[0.27 * s, 1.14, 0]}>
              {(m) => (
                <mesh>
                  <capsuleGeometry args={[0.048, 0.26, 8, 16]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["arm"]} resolve={fixed("arm")} position={[0.285 * s, 0.86, 0]}>
              {(m) => (
                <mesh>
                  <capsuleGeometry args={[0.04, 0.22, 8, 16]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["wrist"]} resolve={fixed("wrist")} position={[0.295 * s, 0.715, 0]}>
              {(m) => (
                <mesh>
                  <sphereGeometry args={[0.04, 20, 20]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["hand"]} resolve={fixed("hand")} position={[0.3 * s, 0.64, 0]}>
              {(m) => (
                <mesh scale={[0.9, 1.25, 0.55]}>
                  <sphereGeometry args={[0.052, 20, 20]} />
                  {m}
                </mesh>
              )}
            </Part>
          </group>
        ))}

        {/* Legs */}
        {sides.map((s) => (
          <group key={`leg-${s}`}>
            <Part {...common} regions={["leg"]} resolve={fixed("leg")} position={[0.1 * s, 0.5, 0]}>
              {(m) => (
                <mesh>
                  <capsuleGeometry args={[0.075, 0.3, 8, 16]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["knee"]} resolve={fixed("knee")} position={[0.1 * s, 0.29, 0.01]}>
              {(m) => (
                <mesh>
                  <sphereGeometry args={[0.06, 24, 24]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["leg"]} resolve={fixed("leg")} position={[0.1 * s, 0.11, 0]}>
              {(m) => (
                <mesh>
                  <capsuleGeometry args={[0.05, 0.22, 8, 16]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["ankle"]} resolve={fixed("ankle")} position={[0.1 * s, -0.09, 0]}>
              {(m) => (
                <mesh>
                  {/* Wider than the shin's rounded end, or it is buried inside it
                      and can never be clicked. */}
                  <sphereGeometry args={[0.054, 20, 20]} />
                  {m}
                </mesh>
              )}
            </Part>
            <Part {...common} regions={["foot"]} resolve={fixed("foot")} position={[0.1 * s, -0.15, 0.05]}>
              {(m) => (
                <RoundedBox args={[0.09, 0.05, 0.2]} radius={0.02} smoothness={3}>
                  {m}
                </RoundedBox>
              )}
            </Part>
          </group>
        ))}

        {/* Decorative base ring (not interactive) */}
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.17, 0]}>
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
