// Shared palette and fonts for the generated README artwork.
// Mirrors the design tokens in src/app/globals.css.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(here, "../../..");
export const ASSETS = join(REPO, "docs/assets");

export const C = {
  void: "#050505",
  surface: "#0a090c",
  amethyst: "#3b0a6b",
  amethyst500: "#6420a8",
  lilac: "#c7a8f0",
  ink: "#f4effa",
  ink3: "#b1a8bd",
  ink4: "#8c8597",
  hair: "rgba(199,168,240,0.16)",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
};

const require = createRequire(import.meta.url);
const fontFile = (pkg, file) =>
  readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), "files", file)).toString("base64");

/**
 * @font-face rules with the fonts inlined. GitHub serves README images through
 * a proxy that blocks external requests, so an SVG must carry its own fonts.
 */
export function fontFaces() {
  const face = (family, style, data) =>
    `@font-face{font-family:'${family}';font-style:${style};font-weight:300 700;` +
    `src:url(data:font/woff2;base64,${data}) format('woff2');}`;
  return [
    face("Cormorant", "normal", fontFile("@fontsource-variable/cormorant-garamond", "cormorant-garamond-latin-wght-normal.woff2")),
    face("Cormorant", "italic", fontFile("@fontsource-variable/cormorant-garamond", "cormorant-garamond-latin-wght-italic.woff2")),
    face("Jost", "normal", fontFile("@fontsource-variable/jost", "jost-latin-wght-normal.woff2")),
  ].join("");
}

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
