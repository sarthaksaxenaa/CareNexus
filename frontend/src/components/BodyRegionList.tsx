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
              className={`w-full rounded-sm border px-3 py-2 text-left text-sm font-light transition-colors duration-200 ${
                isSelected
                  ? "border-lilac/70 bg-amethyst/40 text-ink"
                  : "border-edge-soft text-ink-3 hover:border-lilac/40 hover:text-ink"
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
