// Shared palettes, fonts and helpers for the generated README artwork.
// Mirrors the design tokens in src/app/globals.css.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(here, "../../..");
export const ASSETS = join(REPO, "docs/assets");

/** Dark palette: the app itself. */
export const C = {
  scheme: "dark",
  void: "#050505",
  surface: "#0a090c",
  raised: "#140a20",
  amethyst: "#3b0a6b",
  amethyst500: "#6420a8",
  lilac: "#c7a8f0",
  accent: "#c7a8f0",
  ink: "#f4effa",
  ink3: "#b1a8bd",
  ink4: "#8c8597",
  hair: "rgba(199,168,240,0.16)",
  hair2: "rgba(199,168,240,0.32)",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
};

/**
 * Light palette for GitHub's light theme: the same hues on ivory, with the
 * accent and triage colours darkened to keep text at WCAG AA contrast.
 */
export const L = {
  scheme: "light",
  void: "#faf7fc",
  surface: "#ffffff",
  raised: "#f1e9f8",
  amethyst: "#e4d4f4",
  amethyst500: "#9a6bd1",
  lilac: "#6420a8",
  accent: "#5b1a9c",
  ink: "#160b24",
  ink3: "#4a3f57",
  ink4: "#625870",
  hair: "rgba(59,10,107,0.14)",
  hair2: "rgba(59,10,107,0.28)",
  green: "#047857",
  amber: "#b45309",
  red: "#b91c1c",
};

export const THEMES = [C, L];

const require = createRequire(import.meta.url);
const FONTS = {
  Cormorant: {
    normal: ["@fontsource-variable/cormorant-garamond", "cormorant-garamond-latin-wght-normal.woff2"],
    italic: ["@fontsource-variable/cormorant-garamond", "cormorant-garamond-latin-wght-italic.woff2"],
  },
  Jost: { normal: ["@fontsource-variable/jost", "jost-latin-wght-normal.woff2"] },
};
const fontPath = ([pkg, file]) => join(dirname(require.resolve(`${pkg}/package.json`)), "files", file);

/**
 * Keep only the glyphs an image actually uses. Full fonts made each SVG about
 * 140 KB; a subset is a few KB. Needs Python's fontTools (with brotli for
 * WOFF2); without it the full font is embedded, so the output is still correct.
 */
function subset(path, text) {
  const dir = mkdtempSync(join(tmpdir(), "readme-font-"));
  try {
    const textFile = join(dir, "text.txt");
    const out = join(dir, "out.woff2");
    // The text is final when this runs; digits and common punctuation are
    // added anyway so a figure never falls back to another font.
    writeFileSync(textFile, text + "0123456789%.,:;·—–-+/()'’“” ");
    execFileSync(
      process.env.PYTHON ?? "python3",
      ["-m", "fontTools.subset", path, `--text-file=${textFile}`, "--flavor=woff2", `--output-file=${out}`, "--layout-features=*", "--no-hinting"],
      { stdio: "ignore" },
    );
    return readFileSync(out);
  } catch {
    return readFileSync(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * @font-face rules with the fonts inlined. GitHub serves README images through
 * a proxy that blocks external requests, so an SVG must carry its own fonts.
 * `textByFace` maps "Family style" to the text set in it; a face that sets no
 * text is left out entirely.
 */
export function fontFaces(textByFace) {
  const rules = [];
  for (const [family, styles] of Object.entries(FONTS)) {
    for (const [style, spec] of Object.entries(styles)) {
      const text = textByFace[`${family} ${style}`];
      if (!text || !text.trim()) continue;
      const data = subset(fontPath(spec), text).toString("base64");
      rules.push(
        `@font-face{font-family:'${family}';font-style:${style};font-weight:300 700;` +
          `src:url(data:font/woff2;base64,${data}) format('woff2');}`,
      );
    }
  }
  return rules.join("");
}

const plain = (markup) => markup.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ");

/**
 * Which text each face sets, read from the <text> elements' classes: "serif"
 * or "sans", italic when the element or one of its tspans says so, and
 * upper case added for tracked labels (CSS uppercases them at render time).
 */
export function textByFace(body) {
  const faces = { "Cormorant normal": "", "Cormorant italic": "", "Jost normal": "" };
  for (const [, attrs, inner] of body.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const cls = attrs.match(/class="([^"]*)"/)?.[1] ?? "";
    let text = plain(inner);
    if (/\btrack\b/.test(cls)) text += text.toUpperCase();
    if (/\bserif\b/.test(cls)) {
      const italicAll = /font-style="italic"/.test(attrs);
      const italicSome = /font-style="italic"/.test(inner);
      if (!italicAll) faces["Cormorant normal"] += text;
      if (italicAll || italicSome) faces["Cormorant italic"] += text;
    } else if (/\bsans\b/.test(cls)) {
      faces["Jost normal"] += text;
    }
  }
  return faces;
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Wrap an SVG body with the shared styles and subset fonts. */
export function svgDoc({ w, h, title, desc, css = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>
${fontFaces(textByFace(body))}
.serif{font-family:Cormorant,Georgia,serif;font-variant-numeric:lining-nums}
.sans{font-family:Jost,Helvetica,Arial,sans-serif}
.track{letter-spacing:.28em;text-transform:uppercase}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
${body}
</svg>
`;
}
