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
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 text-center">
        Quick symptom check — tap to start
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.prompt)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
