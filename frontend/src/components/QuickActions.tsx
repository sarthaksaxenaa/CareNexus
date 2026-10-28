"use client";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  { emoji: "🤒", label: "Fever", prompt: "I have a fever and chills. My temperature is around 101°F." },
  { emoji: "🤕", label: "Headache", prompt: "I have a persistent headache that won't go away." },
  { emoji: "🫁", label: "Breathing", prompt: "I'm having difficulty breathing and chest tightness." },
  { emoji: "🤢", label: "Stomach", prompt: "I have nausea, vomiting, and stomach cramps." },
  { emoji: "🩹", label: "Back Pain", prompt: "I have lower back pain that's been bothering me for a few days." },
  { emoji: "😰", label: "Anxiety", prompt: "I've been feeling very anxious and having panic attacks." },
  { emoji: "🤧", label: "Cold/Flu", prompt: "I have a runny nose, sneezing, and sore throat." },
  { emoji: "⚠️", label: "Allergies", prompt: "I have an itchy rash and hives appearing on my skin." },
];

export default function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-ink-4 mb-2.5 text-center uppercase tracking-wider">
        Quick symptom check — tap to start
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.prompt)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full
                       bg-surface-2 text-ink-3 border border-edge
                       hover:bg-amethyst/20 hover:text-amethyst-200 hover:border-amethyst-600
                       hover:shadow-md hover:shadow-amethyst/25 hover:-translate-y-0.5
                       active:translate-y-0
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:hover:translate-y-0 disabled:hover:bg-surface-2
                       disabled:hover:text-ink-3 disabled:hover:border-edge"
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
