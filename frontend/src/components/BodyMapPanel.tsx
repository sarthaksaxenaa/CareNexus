"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import BodyRegionList from "@/components/BodyRegionList";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getRegion, type RegionId } from "@/lib/bodyRegions";
import { TRACKED } from "@/lib/styles";

// three.js touches `window`, so it can only render in the browser. Loading it
// lazily with ssr:false also keeps ~1 MB of 3D code out of the initial bundle
// of every page that does not show the map.
const BodyMapScene = dynamic(() => import("@/components/BodyMapScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-4">
      Loading 3D body…
    </div>
  ),
});

// ─── Capability detection ────────────────────────────────────────────────────
// useSyncExternalStore reads browser-only facts without a setState-in-effect
// and without a hydration mismatch: the server snapshot is the safe answer
// (no 3D), the client snapshot is the real one.

let webglSupport: boolean | null = null;

function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    webglSupport = gl !== null;
    // Browsers cap live contexts (~16); release the probe immediately.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const subscribeNever = () => () => {};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

// ─── Panel ───────────────────────────────────────────────────────────────────

interface BodyMapPanelProps {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
}

type Mode = "3d" | "list";

export default function BodyMapPanel({ selected, onSelect }: BodyMapPanelProps) {
  const supportsWebGL = useSyncExternalStore(subscribeNever, detectWebGL, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const [chosen, setChosen] = useState<Mode | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Default to 3D only when it is safe and welcome; otherwise the list.
  const can3D = supportsWebGL && !contextLost;
  const mode: Mode = chosen ?? (can3D && !reducedMotion ? "3d" : "list");
  const effective: Mode = mode === "3d" && !can3D ? "list" : mode;

  const listView = <BodyRegionList selected={selected} onSelect={onSelect} />;

  return (
    <section aria-label="Body map" className="flex h-full flex-col gap-4 p-5 pt-16 lg:pt-5">
      <div>
        <h2 className="font-display text-2xl text-ink">Where does it hurt?</h2>
        <p className="mt-1 text-sm font-light text-ink-4">
          {effective === "3d"
            ? "Drag to turn the figure, then click a body part."
            : "Choose a body region."}
        </p>
      </div>

      <div role="tablist" aria-label="Body map view" className="flex gap-6 border-b border-edge-soft">
        {(["3d", "list"] as const).map((m) => {
          const disabled = m === "3d" && !can3D;
          return (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={effective === m}
              disabled={disabled}
              title={disabled ? "3D view is not available on this device" : undefined}
              onClick={() => setChosen(m)}
              className={`${TRACKED} -mb-px border-b py-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                effective === m
                  ? "border-lilac text-ink"
                  : "border-transparent text-ink-4 hover:text-ink-2"
              }`}
            >
              {m === "3d" ? "3D view" : "List"}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-edge-soft">
        {effective === "3d" ? (
          // If WebGL throws at render time, drop to the list instead of a blank panel.
          <ErrorBoundary fallback={<div className="p-3">{listView}</div>}>
            <BodyMapScene
              selected={selected}
              onSelect={onSelect}
              animate={!reducedMotion}
              onContextLost={() => setContextLost(true)}
            />
          </ErrorBoundary>
        ) : (
          <div className="p-3">{listView}</div>
        )}
      </div>

      <p className="text-sm font-light text-ink-3" aria-live="polite">
        {selected ? `Selected: ${getRegion(selected).label}` : "Nothing selected yet"}
      </p>
    </section>
  );
}
