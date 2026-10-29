/**
 * Shared Tailwind class constants — the "Amethyst Editorial" vocabulary.
 *
 * Every colour resolves to a token in `src/app/globals.css` (@theme), so the
 * product is re-skinned from that block alone. Two families do all the work:
 * `font-display` (Cormorant Garamond) for headlines, `font-sans` (Jost) for
 * everything you read while using the app.
 *
 * Clinical triage colours live in TRIAGE_CONFIG (MessageBubble.tsx) and are
 * intentionally NOT amethyst — severity must stay universally legible.
 */

// ─── Forms ──────────────────────────────────────────────────────────────────

/** Text input / select / textarea: a quiet well with a hairline edge. */
export const INPUT_CLASS =
  "w-full px-4 py-3 rounded-sm bg-abyss border border-edge text-ink placeholder:text-ink-4/70 " +
  "transition-colors duration-200 focus:outline-none focus:border-amethyst-200/70 " +
  "focus:ring-1 focus:ring-amethyst-200/40 disabled:opacity-50 disabled:cursor-not-allowed";

/** Form field label. Sentence case; the field name is the information. */
export const LABEL_CLASS = "block text-sm text-ink-3 mb-2";

// ─── Buttons ────────────────────────────────────────────────────────────────

/** Letter-spaced capitals, the navigation/action voice of the reference. */
export const TRACKED = "text-[11px] uppercase tracking-[0.28em]";

/** Primary action — solid amethyst pill with a lilac hairline. */
export const BTN_PRIMARY =
  "w-full py-3.5 rounded-full font-medium text-ink " + TRACKED + " " +
  "bg-amethyst ring-1 ring-inset ring-amethyst-200/30 " +
  "hover:bg-amethyst-600 hover:ring-amethyst-200/60 " +
  "transition-colors duration-200 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amethyst";

/** Compact primary action — same skin, inline sizing. */
export const BTN_PRIMARY_SM =
  "px-5 py-2 rounded-full font-medium text-ink " + TRACKED + " " +
  "bg-amethyst ring-1 ring-inset ring-amethyst-200/30 " +
  "hover:bg-amethyst-600 hover:ring-amethyst-200/60 transition-colors duration-200 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

/** Secondary action — outline only. */
export const BTN_SECONDARY =
  "px-7 py-3.5 rounded-full font-medium text-ink-2 " + TRACKED + " " +
  "border border-edge hover:border-amethyst-200/60 hover:text-ink " +
  "transition-colors duration-200";

/** Low-emphasis inline action. */
export const BTN_GHOST =
  "px-3 py-1.5 rounded-full text-xs text-ink-4 " +
  "hover:bg-surface-3 hover:text-ink-2 transition-colors duration-200";

// ─── Surfaces ───────────────────────────────────────────────────────────────

/** Standard panel: hairline, square-ish corners, no drop shadow. */
export const CARD = "rounded-sm bg-surface border border-edge-soft";

/** Panel that responds to hover — interactive tiles only. */
export const CARD_INTERACTIVE =
  CARD + " transition-colors duration-200 hover:border-amethyst-200/40 hover:bg-surface-2";

/** Sticky top bar / panel header. */
export const BAR = "bg-void/85 backdrop-blur-xl border-edge";

// ─── Feedback ───────────────────────────────────────────────────────────────

export const ALERT_ERROR =
  "p-3 rounded-sm text-sm bg-triage-red/10 border border-triage-red/30 text-triage-red";

export const ALERT_SUCCESS =
  "p-3 rounded-sm text-sm bg-triage-green/10 border border-triage-green/30 text-triage-green";

/** The persistent "not medical advice" chip. Amber by clinical convention. */
export const ALERT_ADVISORY =
  "text-xs px-3 py-1 rounded-full bg-triage-amber/10 border border-triage-amber/30 text-triage-amber";

// ─── Typography ─────────────────────────────────────────────────────────────

export const HEADING_XL =
  "font-display font-light text-5xl sm:text-6xl leading-[0.95] tracking-tight text-lilac";
export const HEADING_LG = "font-display font-normal text-3xl sm:text-4xl leading-tight text-ink";
export const HEADING_MD = "font-display font-medium text-2xl leading-snug text-ink";
export const BODY = "text-ink-3 font-light leading-relaxed";
export const CAPTION = "text-xs text-ink-4";

/** The wordmark's lilac half — used in every logo lockup. */
export const WORDMARK_ACCENT = "italic text-lilac";
