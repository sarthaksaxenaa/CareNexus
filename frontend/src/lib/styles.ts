/**
 * Shared Tailwind class constants — the "Obsidian Amethyst" vocabulary.
 *
 * Every colour here resolves to a token defined in `src/app/globals.css`
 * (@theme block). Nothing in this file hardcodes a hex value, so re-skinning
 * the product means editing the token block alone.
 *
 * Clinical triage colours live in TRIAGE_CONFIG (MessageBubble.tsx) and are
 * intentionally NOT amethyst — severity must stay universally legible.
 */

// ─── Forms ──────────────────────────────────────────────────────────────────

/** Text input / select / textarea. Amethyst focus ring, obsidian well. */
export const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-abyss border border-edge text-ink placeholder:text-ink-4/60 " +
  "transition-colors duration-200 focus:outline-none focus:border-amethyst-400 " +
  "focus:ring-2 focus:ring-amethyst-400/40 disabled:opacity-50 disabled:cursor-not-allowed";

/** Form field label. */
export const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-wider text-ink-4 mb-1.5";

// ─── Buttons ────────────────────────────────────────────────────────────────

/** Primary action — full-width amethyst gradient with a lift on hover. */
export const BTN_PRIMARY =
  "w-full py-3 rounded-xl font-semibold text-white " +
  "bg-gradient-to-r from-amethyst to-amethyst-500 " +
  "shadow-lg shadow-amethyst/30 " +
  "hover:from-amethyst-600 hover:to-amethyst-400 hover:shadow-amethyst-500/40 " +
  "active:scale-[0.99] transition-all duration-200 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amethyst/30";

/** Compact primary action — same skin, inline sizing. */
export const BTN_PRIMARY_SM =
  "px-4 py-2 rounded-lg text-sm font-medium text-white " +
  "bg-gradient-to-r from-amethyst to-amethyst-500 " +
  "hover:from-amethyst-600 hover:to-amethyst-400 " +
  "active:scale-[0.98] transition-all duration-200 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/** Secondary action — outlined obsidian. */
export const BTN_SECONDARY =
  "px-6 py-3 rounded-xl font-semibold text-ink-2 bg-surface-2 border border-edge " +
  "hover:bg-surface-3 hover:border-amethyst-600 hover:text-ink " +
  "active:scale-[0.99] transition-all duration-200";

/** Low-emphasis inline action. */
export const BTN_GHOST =
  "px-3 py-1.5 rounded-lg text-xs text-ink-4 " +
  "hover:bg-surface-3 hover:text-ink-2 transition-colors duration-200";

// ─── Surfaces ───────────────────────────────────────────────────────────────

/** Standard card. */
export const CARD =
  "rounded-2xl bg-surface border border-edge-soft shadow-xl shadow-black/40";

/** Card that responds to hover — use for interactive tiles only. */
export const CARD_INTERACTIVE =
  CARD +
  " transition-all duration-300 hover:border-amethyst-600/70 " +
  "hover:shadow-amethyst/20 hover:-translate-y-0.5";

/** Sticky top bar / panel header. */
export const BAR =
  "bg-surface/80 backdrop-blur-xl border-edge";

// ─── Feedback ───────────────────────────────────────────────────────────────

export const ALERT_ERROR =
  "p-3 rounded-xl text-sm bg-triage-red/10 border border-triage-red/30 text-triage-red";

export const ALERT_SUCCESS =
  "p-3 rounded-xl text-sm bg-triage-green/10 border border-triage-green/30 text-triage-green";

/** The persistent "not medical advice" chip. Amber by clinical convention. */
export const ALERT_ADVISORY =
  "text-xs px-3 py-1 rounded-full bg-triage-amber/10 border border-triage-amber/30 text-triage-amber";

// ─── Typography ─────────────────────────────────────────────────────────────

export const HEADING_XL = "text-4xl font-bold tracking-tight text-ink";
export const HEADING_LG = "text-2xl font-bold tracking-tight text-ink";
export const HEADING_MD = "text-lg font-semibold text-ink";
export const BODY = "text-ink-3";
export const CAPTION = "text-xs text-ink-4";

/** The wordmark's amethyst half — used in every logo lockup. */
export const WORDMARK_ACCENT =
  "bg-gradient-to-r from-amethyst-400 to-amethyst-200 bg-clip-text text-transparent";
