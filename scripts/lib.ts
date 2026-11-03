/**
 * lib.ts — outils communs : poser un motif de `art.ts`, composer un SVG 480×320,
 * le rendre en PNG quantifié RGB565 (ce que le Nextion affiche réellement).
 *
 * 🔑 Le Nextion stocke ses images en RGB565 sans tramage : un dégradé sombre
 * (prune → nuit) y fait des bandes. On tramage ICI (Floyd-Steinberg vers la
 * grille 565) : l'éditeur reconvertit ensuite des couleurs déjà exactes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { PNG } from "pngjs";
import { MOTIFS, svg, type Palette } from "./art/octobre-art.ts";

export const W = 480;
export const H = 320;
/** Le NSPanel EU masque ses 30 px de droite : rien d'utile au-delà. */
export const VISIBLE_W = 450;

export interface PlaceOptions {
  readonly rot?: number;
  readonly opacity?: number;
  readonly flip?: boolean;
}

const viewBox = (name: string): [number, number, number, number] => {
  const [x = 0, y = 0, w = 100, h = 100] = MOTIFS[name]!.viewBox.split(/[\s,]+/).map(Number);
  return [x, y, w, h];
};

const inner = (svgString: string): string =>
  svgString.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** Pose un motif par son PIED (milieu du bas) en (x, y), haut de `height` (même convention que le mur). */
export function place(name: string, palette: Palette, x: number, y: number, height: number, opts: PlaceOptions = {}): string {
  if (!(name in MOTIFS)) throw new Error(`motif inconnu : ${name}`);
  const [vx, vy, vw, vh] = viewBox(name);
  const scale = height / vh;
  const sx = opts.flip ? -scale : scale;
  const op = opts.opacity !== undefined ? ` opacity="${opts.opacity}"` : "";
  return (
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(opts.rot ?? 0).toFixed(1)}) ` +
    `scale(${sx.toFixed(4)} ${scale.toFixed(4)}) translate(${(-vx - vw / 2).toFixed(1)} ${(-vy - vh).toFixed(1)})"${op}>` +
    `${inner(svg(name, palette))}</g>`
  );
}

export function compose(body: string, width = W, height = H): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

/** Une palette où toutes les feuilles prennent la couleur `tone`. */
export function leafTint(palette: Palette, tone: "leafA" | "leafB" | "leafC" | "leafD"): Palette {
  const c = palette[tone];
  return { ...palette, leafA: c, leafB: c, leafC: c, leafD: c };
}

/** Une palette « silhouette » : tout d'une seule couleur. */
export function flat(palette: Palette, color: string): Palette {
  const out = { ...palette };
  for (const key of Object.keys(out) as (keyof Palette)[]) out[key] = color;
  return out;
}

/** Générateur à graine (positions reproductibles d'un build à l'autre). */
export function rng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LEAF_SHAPES = ["maple", "oak", "birch", "ginkgo", "chestnut", "beech", "leafCurl"];

/** Couleur #rrggbb → entier RGB565 (format des attributs pco/bco du Nextion). */
export function rgb565(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}

/** Valeur 8 bits la plus proche représentable sur `bits` bits (5 ou 6), réétendue en 8 bits. */
function q(value: number, bits: number): number {
  const levels = (1 << bits) - 1;
  const v = Math.round((Math.min(255, Math.max(0, value)) / 255) * levels);
  return Math.round((v / levels) * 255);
}

/**
 * Rend un SVG en PNG opaque (ou transparent si `keepAlpha`), tramé vers RGB565.
 * Les pixels transparents ne sont pas tramés : ils seront composités plus tard.
 * `dither: false` = simple arrondi 565 (fonds clairs : le tramage y dessine des stries).
 */
export function renderPng(svgString: string, outPath: string, opts: { keepAlpha?: boolean; background?: string; dither?: boolean } = {}): void {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "original" },
    background: opts.keepAlpha ? undefined : (opts.background ?? "#000000"),
    font: { loadSystemFonts: true, defaultFontFamily: "Segoe UI" },
  });
  const rendered = resvg.render();
  const { width, height } = rendered;
  const px = Float32Array.from(rendered.pixels);
  // Floyd-Steinberg sur les canaux couleur ; R/B sur 5 bits, G sur 6.
  const bits = [5, 6, 5];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (opts.keepAlpha && px[i + 3]! < 255) continue;
      for (let c = 0; c < 3; c += 1) {
        const old = px[i + c]!;
        const nv = q(old, bits[c]!);
        px[i + c] = nv;
        if (opts.dither === false) continue;
        const err = old - nv;
        if (x + 1 < width) px[i + 4 + c]! += (err * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) px[i + width * 4 - 4 + c]! += (err * 3) / 16;
          px[i + width * 4 + c]! += (err * 5) / 16;
          if (x + 1 < width) px[i + width * 4 + 4 + c]! += (err * 1) / 16;
        }
      }
    }
  }
  const png = new PNG({ width, height });
  for (let i = 0; i < px.length; i += 1) png.data[i] = Math.round(Math.min(255, Math.max(0, px[i]!)));
  if (!opts.keepAlpha) for (let i = 3; i < px.length; i += 4) png.data[i] = 255;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, PNG.sync.write(png));
}
