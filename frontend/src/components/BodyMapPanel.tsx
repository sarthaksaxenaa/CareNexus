"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import BodyRegionList from "@/components/BodyRegionList";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getRegion, regionsFor, type RegionId } from "@/lib/bodyRegions";
import { SEX_OPTIONS, type Sex } from "@/lib/sex";
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

// ─── Remembered view ─────────────────────────────────────────────────────────
// A per-viewer convenience: whichever view was last chosen opens next time.
// Storage can be blocked (private mode), so every access is guarded.

const VIEW_KEY = "carenexus.bodymap.view";

function readSavedView(): Mode | null {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "3d" || v === "list" ? v : null;
  } catch {
    return null;
  }
}

function saveView(view: Mode) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Not remembered; the switch still works.
  }
}

function CubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M8 1.5 14 4.8v6.4L8 14.5 2 11.2V4.8Z" />
      <path d="M2 4.8 8 8l6-3.2M8 8v6.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M5.5 4h8M5.5 8h8M5.5 12h8" />
      <circle cx="2.5" cy="4" r=".6" fill="currentColor" />
      <circle cx="2.5" cy="8" r=".6" fill="currentColor" />
      <circle cx="2.5" cy="12" r=".6" fill="currentColor" />
    </svg>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

interface BodyMapPanelProps {
  /** The account's sex; null for signed-out visitors, who may pick a body. */
  sex: Sex | null;
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  /** Close the panel (× button, Escape). */
  onClose: () => void;
}

type Mode = "3d" | "list";

export default function BodyMapPanel({ sex, selected, onSelect, onClose }: BodyMapPanelProps) {
  const supportsWebGL = useSyncExternalStore(subscribeNever, detectWebGL, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  // The panel only renders after a click, never on the server, so reading
  // storage in the initialiser cannot cause a hydration mismatch.
  const [chosen, setChosen] = useState<Mode | null>(readSavedView);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ "3d": null, list: null });
  const [contextLost, setContextLost] = useState(false);
  const [visitorBody, setVisitorBody] = useState<Sex>("female");
  const body: Sex = sex ?? visitorBody;

  // Default to 3D only when it is safe and welcome; otherwise the list.
  const can3D = supportsWebGL && !contextLost;
  const mode: Mode = chosen ?? (can3D && !reducedMotion ? "3d" : "list");
  const effective: Mode = mode === "3d" && !can3D ? "list" : mode;

  // Move focus into the panel when it opens, so keyboard users land on it.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes the panel from anywhere on the page.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choose = (view: Mode) => {
    setChosen(view);
    saveView(view);
  };

  // Tablist keyboard model: arrows (and Home/End) move between the views.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const order: Mode[] = can3D ? ["3d", "list"] : ["list"];
    const at = order.indexOf(effective);
    let next: Mode | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = order[(at + 1) % order.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = order[(at - 1 + order.length) % order.length];
    else if (e.key === "Home") next = order[0];
    else if (e.key === "End") next = order[order.length - 1];
    if (!next) return;
    e.preventDefault();
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const listView = <BodyRegionList regions={regionsFor(body)} selected={selected} onSelect={onSelect} />;

  return (
    <section aria-label="Body map" className="flex h-full flex-col gap-4 p-5 pt-16 lg:pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Where does it hurt?</h2>
          <p className="mt-1 text-sm font-light text-ink-4">
            {effective === "3d"
              ? "Drag to turn the figure, then click a body part."
              : "Choose a body region."}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close body map"
          title="Close (Esc)"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge text-ink-3 transition-colors duration-200 hover:border-lilac/60 hover:bg-surface-3 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-lilac/70"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {sex === null && (
        <div role="radiogroup" aria-label="Body" className="flex items-center gap-2">
          <span className={`${TRACKED} text-ink-4`}>Body</span>
          {SEX_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={body === o.value}
              onClick={() => setVisitorBody(o.value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${
                body === o.value
                  ? "border-lilac/70 bg-amethyst text-ink"
                  : "border-edge text-ink-4 hover:text-ink-2"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div
        role="tablist"
        aria-label="Body map view"
        className="grid grid-cols-2 gap-1 rounded-full border border-edge bg-abyss p-1"
      >
        {(["3d", "list"] as const).map((m) => {
          const disabled = m === "3d" && !can3D;
          const active = effective === m;
          return (
            <button
              key={m}
              ref={(el) => {
                tabRefs.current[m] = el;
              }}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="body-map-view"
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              title={disabled ? "3D view is not available on this device" : undefined}
              onClick={() => choose(m)}
              onKeyDown={onTabKey}
              className={`${TRACKED} flex items-center justify-center gap-2 rounded-full py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-lilac/70 disabled:cursor-not-allowed disabled:opacity-40 ${
                active ? "bg-amethyst text-ink ring-1 ring-inset ring-lilac/40" : "text-ink-4 hover:text-ink-2"
              }`}
            >
              {m === "3d" ? <CubeIcon /> : <ListIcon />}
              {m === "3d" ? "3D view" : "List"}
            </button>
          );
        })}
      </div>

      <div id="body-map-view" role="tabpanel" aria-label={effective === "3d" ? "3D view" : "List"} className="min-h-0 flex-1 overflow-hidden rounded-sm border border-edge-soft">
        {effective === "3d" ? (
          // If WebGL throws at render time, drop to the list instead of a blank panel.
          <ErrorBoundary fallback={<div className="p-3">{listView}</div>}>
            <BodyMapScene
              sex={body}
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
