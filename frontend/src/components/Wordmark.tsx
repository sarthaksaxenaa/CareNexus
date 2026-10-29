import { WORDMARK_ACCENT } from "@/lib/styles";

/** CareNexus logotype: Cormorant Garamond, with "Nexus" in lilac italic. */
export default function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-display font-normal tracking-tight text-ink ${className}`}>
      Care<span className={WORDMARK_ACCENT}>Nexus</span>
    </span>
  );
}
