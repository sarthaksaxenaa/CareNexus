"use client";

import { BODY_REGIONS, type RegionId } from "@/lib/bodyRegions";

interface BodyRegionListProps {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
}

/**
 * Accessible equivalent of the 3D body map.
 *
 * A WebGL canvas is invisible to keyboards and screen readers, so this list is
 * the primary path for them, and the fallback when WebGL is unavailable, the
 * GPU context is lost, or the user prefers reduced motion. It offers exactly
 * the same regions and calls the same handler.
 */
export default function BodyRegionList({ selected, onSelect }: BodyRegionListProps) {
  return (
    <ul className="grid grid-cols-2 gap-2" aria-label="Body regions">
      {BODY_REGIONS.map((region) => {
        const isSelected = selected === region.id;
        return (
          <li key={region.id}>
            <button
              type="button"
              onClick={() => onSelect(region.id)}
              aria-pressed={isSelected}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ${
                isSelected
                  ? "border-amethyst-400 bg-amethyst/30 text-amethyst-200 ring-1 ring-amethyst-400/50"
                  : "border-edge bg-surface-2 text-ink-3 hover:border-amethyst-600 hover:bg-surface-3 hover:text-ink-2"
              }`}
            >
              {region.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
