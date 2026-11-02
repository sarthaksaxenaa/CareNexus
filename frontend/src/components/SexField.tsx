"use client";

import { SEX_OPTIONS, type Sex } from "@/lib/sex";
import { TRACKED } from "@/lib/styles";

interface SexFieldProps {
  value: Sex | "";
  onChange: (sex: Sex) => void;
  /** Unique per page, so two pickers never share a radio group. */
  name?: string;
  disabled?: boolean;
}

/**
 * Male or female, as two large tiles. Native radio inputs underneath, so the
 * group is keyboard- and screen-reader-accessible and `required` works.
 */
export default function SexField({ value, onChange, name = "sex", disabled }: SexFieldProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="block text-sm text-ink-3 mb-2">Sex</legend>
      <div className="grid grid-cols-2 gap-3">
        {SEX_OPTIONS.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={
                "relative flex cursor-pointer flex-col items-center gap-1 rounded-sm border px-4 py-4 " +
                "transition-colors duration-200 has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-amethyst-200/60 " +
                (checked
                  ? "border-lilac/80 bg-amethyst text-ink ring-1 ring-inset ring-lilac/40"
                  : "border-edge bg-abyss text-ink-3 hover:border-amethyst-200/40 hover:text-ink")
              }
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                required
                className="sr-only"
              />
              <span className="font-display text-2xl font-light">{option.label}</span>
              <span aria-hidden="true" className={`${TRACKED} text-[10px] ${checked ? "text-lilac" : "text-ink-4"}`}>
                {checked ? "Selected" : "Choose"}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-light text-ink-4">
        Some conditions only affect one sex, so this keeps answers accurate.
      </p>
    </fieldset>
  );
}
