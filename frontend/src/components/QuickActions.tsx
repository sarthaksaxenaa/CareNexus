"use client";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { label: "Fever", prompt: "I have a fever and chills. My temperature is around 101°F." },
  { label: "Headache", prompt: "I have a persistent headache that won't go away." },
  { label: "Breathing", prompt: "I'm having difficulty breathing and chest tightness." },
  { label: "Stomach", prompt: "I have nausea, vomiting, and stomach cramps." },
  { label: "Back pain", prompt: "I have lower back pain that's been bothering me for a few days." },
  { label: "Anxiety", prompt: "I've been feeling very anxious and having panic attacks." },
  { label: "Cold or flu", prompt: "I have a runny nose, sneezing, and sore throat." },
  { label: "Skin rash", prompt: "I have an itchy rash and hives appearing on my skin." },
];

/** Starter prompts for an empty conversation. Each sends a full sentence. */
export default function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-light text-ink-4">Or start from a common symptom</p>
      <ul className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => onSelect(item.prompt)}
              disabled={disabled}
              title={item.prompt}
              className="rounded-full border border-edge px-4 py-1.5 text-sm font-light text-ink-3
                         transition-colors duration-200 hover:border-lilac/60 hover:text-ink
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
