/**
 * render-preview.ts — maquettes des écrans d'un thème, par pièce et par moment, à partir des
 * VRAIS slots générés (`themes/<theme>/dist/slots`, cf. build.sh images) et de la géométrie du
 * HMI amont (nextion2text, v2026.10.6). Sortie : `themes/<theme>/dist/preview/*.png` (450×320,
 * la zone visible du NSPanel EU).
 *
 * Ce sont des maquettes : polices système à la place de Sarasa, valeurs relevées dans HA le
 * 2026-10-22 ; la mise en page, les images et les couleurs sont celles du TFT.
 *
 * Usage : node scripts/render-preview.ts [octobre|novembre]
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as mdi from "@mdi/js";
import { Resvg } from "@resvg/resvg-js";
import * as octobre from "./themes/octobre.ts";
import * as novembre from "./themes/novembre.ts";

const THEMES = { octobre, novembre } as const;
const name = (process.argv[2] ?? "octobre") as keyof typeof THEMES;
const theme = THEMES[name];
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "themes", name, "dist");
const out = join(root, "preview");
mkdirSync(out, { recursive: true });

type Moment = "nuit" | "jour";
const AMBRE = "#ff9800";
const FONT = "Segoe UI";
/** Polices du HMI (id → hauteur px). 7, 8 et 10 = icônes MDI. */
const FONT_PX: Record<number, number> = { 0: 16, 1: 18, 2: 22, 3: 26, 4: 36, 5: 48, 6: 72, 7: 24, 8: 32, 9: 16, 10: 48 };

const slot = (n: number): string => `data:image/png;base64,${readFileSync(join(root, "slots", `${n}.png`)).toString("base64")}`;
const bgSlot = (m: Moment): number => (m === "nuit" ? 0 : 48);
const colors = (m: Moment) => (m === "nuit" ? theme.TEXT.dark : theme.TEXT.light);

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const iconPath = (icon: string): string => {
  const key = "mdi" + icon.replace(/^mdi:/, "").split("-").map((p) => p[0]!.toUpperCase() + p.slice(1)).join("");
  const path = (mdi as Record<string, string>)[key];
  if (!path) throw new Error(`icône inconnue : ${icon}`);
  return path;
};

/** Texte dans une boîte Nextion (x, y, w, h), aligné comme l'objet du HMI. */
function text(x: number, y: number, w: number, h: number, font: number, s: string, color: string,
  align: "left" | "center" | "right" = "left", valign: "top" | "center" | "bottom" = "center"): string {
  const px = FONT_PX[font]!;
  const tx = align === "left" ? x : align === "center" ? x + w / 2 : x + w;
  const anchor = align === "left" ? "start" : align === "center" ? "middle" : "end";
  const ty = valign === "top" ? y + px * 0.82 : valign === "bottom" ? y + h - px * 0.2 : y + h / 2 + px * 0.34;
  return `<text x="${tx}" y="${ty.toFixed(1)}" font-family="${FONT}" font-size="${px}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
}

/** Icône MDI centrée dans une boîte. */
function icon(x: number, y: number, w: number, h: number, font: number, name: string, color: string): string {
  const px = FONT_PX[font]!;
  const s = px / 24;
  return `<path transform="translate(${(x + (w - px) / 2).toFixed(1)} ${(y + (h - px) / 2).toFixed(1)}) scale(${s.toFixed(3)})" d="${iconPath(name)}" fill="${color}"/>`;
}

const svgDoc = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="450" height="320" viewBox="0 0 450 320">${body}</svg>`;

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

interface HwButton { label: string; on: boolean }
interface Home {
  chips: { icon: string; on: boolean }[];
  outdoor: string;
  indoor?: string;
  date: string;
  values?: { icon: string; value: string }[];
  buttons?: { icon: string; on: boolean }[];
  entities?: boolean;
  hw: [HwButton, HwButton];
}

function home(m: Moment, h: Home): string {
  const c = colors(m);
  let b = `<image width="480" height="320" href="${slot(bgSlot(m))}"/>`;
  // Météo : « partiellement nuageux », jour ou nuit (slots composités sur le fond du thème).
  b += `<image x="20" y="45" width="100" height="100" href="${slot(m === "nuit" ? 12 : 59)}"/>`;
  const chipX = [71, 100, 129, 158];
  h.chips.forEach((chip, i) => { b += icon(chipX[i]!, 2, 30, 30, 7, chip.icon, chip.on ? AMBRE : c.secondary); });
  b += icon(422, 62, 30, 30, 7, "mdi:wifi", c.secondary);
  b += text(120, 45, 125, 65, 4, h.outdoor, c.main, "left", "top");
  b += text(246, 45, 168, 62, 6, "20:14", c.main, "right", "bottom");
  b += text(121, 110, 293, 30, 3, h.date, c.secondary, "right", "bottom");
  if (h.indoor) {
    b += icon(15, 150, 35, 40, 8, "mdi:home-thermometer", c.secondary);
    b += text(50, 150, 147, 40, 4, h.indoor, c.main, "left");
  }
  const vy = [196, 224, 252];
  (h.values ?? []).forEach((v, i) => {
    b += icon(15, vy[i]!, 25, 25, 7, v.icon, c.secondary);
    b += text(42, vy[i]!, 150, 25, 2, v.value, c.main, "left");
  });
  const bx: [number, number][] = [[304, 140], [354, 140], [404, 140], [305, 185], [355, 185], [405, 185]];
  (h.buttons ?? []).forEach((btn, i) => { b += icon(bx[i]![0], bx[i]![1], 45, 42, 8, btn.icon, btn.on ? AMBRE : c.main); });
  if (h.entities) b += icon(355, 230, 45, 42, 8, "mdi:format-list-bulleted", c.navigation);
  // Boutons physiques : libellé + barre (ambre = allumé, substitutions buttons_color_on/off).
  const hw = [[47, h.hw[0]], [288, h.hw[1]]] as const;
  for (const [x, btn] of hw) {
    b += text(x, 288, 120, 20, 1, btn.label, c.main, "center");
    b += `<rect x="${x}" y="312" width="120" height="3" rx="1.5" fill="${btn.on ? AMBRE : c.unsupported}"/>`;
  }
  return svgDoc(b);
}

interface Tile { icon: string; label: string; value?: string; on: boolean }

function buttons(m: Moment, label: string, tiles: Tile[]): string {
  const c = colors(m);
  const active = slot(m === "nuit" ? 47 : 80);
  const inactive = slot(m === "nuit" ? 46 : 79);
  let b = `<image width="480" height="320" href="${slot(bgSlot(m))}"/>`;
  b += text(10, 0, 300, 30, 3, label, c.main, "left");
  b += icon(385, 0, 95, 45, 8, "mdi:close-circle", c.navigation);
  const pos: [number, number][] = [[17, 45], [124, 45], [231, 45], [338, 45], [17, 176], [124, 176], [231, 176], [338, 176]];
  tiles.forEach((t, i) => {
    const [x, y] = pos[i]!;
    b += `<clipPath id="t${i}"><rect x="${x}" y="${y}" width="100" height="100"/></clipPath>`;
    b += `<image width="480" height="320" href="${t.on ? active : inactive}" clip-path="url(#t${i})"/>`;
    // Texte des tuiles : gris foncé allumée, blanc éteinte (codé en dur dans l'ESPHome amont).
    const fg = t.on ? "#292d29" : "#ffffff";
    b += icon(x - 1, y + 4, 48, 48, 8, t.icon, t.on ? "#7a3d00" : "#ffffff");
    if (t.value) b += text(x + 46, y + 10, 48, 30, 2, t.value, fg, "center");
    b += text(x + 9, y + 51, 82, 40, 0, t.label, fg, "center");
  });
  b += text(190, 300, 100, 20, 9, "● ○", c.navigation, "center");
  return svgDoc(b);
}

interface Row { icon: string; label: string; value: string }

function entities(m: Moment, label: string, rows: Row[]): string {
  const c = colors(m);
  let b = `<image width="480" height="320" href="${slot(bgSlot(m))}"/>`;
  b += text(10, 0, 300, 30, 3, label, c.main, "left");
  b += icon(385, 0, 95, 48, 8, "mdi:close-circle", c.navigation);
  const ys = [55, 87, 118, 148, 178, 208, 238, 268];
  rows.forEach((r, i) => {
    b += icon(15, ys[i]!, 28, 28, 7, r.icon, c.secondary);
    b += text(50, ys[i]!, 270, 28, 3, r.label, c.main, "left");
    b += text(330, ys[i]!, 120, 28, 3, r.value, c.secondary, "left");
  });
  return svgDoc(b);
}

function notification(m: Moment, title: string, body: string): string {
  const c = colors(m);
  let b = `<image width="480" height="320" href="${slot(bgSlot(m))}"/>`;
  b += text(17, 7, 300, 42, 3, title, c.main, "left");
  b += icon(385, 0, 95, 48, 8, "mdi:close-circle", c.navigation);
  b += text(17, 60, 398, 150, 3, body, c.main, "center");
  b += icon(72, 222, 100, 68, 10, "mdi:check-circle", c.main);
  b += icon(245, 222, 100, 68, 10, "mdi:delete", c.navigation);
  return svgDoc(b);
}

// ---------------------------------------------------------------------------
// Contenu des 3 panneaux (automations blueprint au 2026-10-22, états relevés dans HA)
// ---------------------------------------------------------------------------

const screens: Record<string, (m: Moment) => string> = {
  "bureau-home": (m) => home(m, {
    chips: [{ icon: "mdi:air-conditioner", on: false }, { icon: "mdi:lightbulb-group", on: true }, { icon: "mdi:music", on: false }],
    outdoor: "15,3°C",
    indoor: "21,7°C",
    date: "mercredi 22 octobre 2026",
    values: [{ icon: "mdi:water-percent", value: "62 %" }, { icon: "mdi:flash", value: "382 W" }, { icon: "mdi:lightning-bolt", value: "64,4 kWh" }],
    buttons: [{ icon: "mdi:music", on: false }, { icon: "mdi:lightbulb-group", on: true }, { icon: "mdi:heart", on: false }],
    entities: true,
    hw: [{ label: "Spots", on: true }, { label: "Déco", on: false }],
  }),
  "bureau-entites": (m) => entities(m, "Bureau", [
    { icon: "mdi:ceiling-light", label: "Spots", value: "Allumé" },
    { icon: "mdi:track-light", label: "Ambiance", value: "Éteint" },
    { icon: "mdi:lightbulb-group", label: "Général", value: "Allumé" },
    { icon: "mdi:air-conditioner", label: "Clim", value: "Arrêt" },
    { icon: "mdi:speaker", label: "Musique", value: "Pause" },
    { icon: "mdi:thermometer", label: "Temp.", value: "21,7 °C" },
    { icon: "mdi:flash", label: "Conso", value: "382 W" },
    { icon: "mdi:lightning-bolt", label: "Conso mois", value: "64,4 kWh" },
  ]),
  "bureau-boutons": (m) => buttons(m, "Bureau", [
    { icon: "mdi:ceiling-light", label: "Spots", on: true },
    { icon: "mdi:track-light", label: "Déco", on: false },
    { icon: "mdi:lightbulb-group", label: "Général", on: true },
    { icon: "mdi:air-conditioner", label: "Clim", value: "24°", on: false },
    { icon: "mdi:speaker", label: "Musique", on: false },
    { icon: "mdi:heart", label: "Favori", on: false },
    { icon: "mdi:desktop-tower", label: "PC bureau", on: true },
    { icon: "mdi:speaker-multiple", label: "Enceintes PC", on: false },
  ]),
  "sdb-home": (m) => home(m, {
    chips: [],
    outdoor: "15,3°C",
    indoor: "21,6°C",
    date: "mercredi, 22 octobre",
    hw: [{ label: "Spots", on: false }, { label: "Déco", on: false }],
  }),
  "wc-home": (m) => home(m, {
    chips: [{ icon: "mdi:music", on: false }],
    outdoor: "15,3°C",
    indoor: "21,4°C",
    date: "mercredi, 22 octobre",
    buttons: [{ icon: "mdi:volume-high", on: false }],
    entities: true,
    hw: [{ label: "Spots", on: true }, { label: "Suspension", on: true }],
  }),
  "wc-notification": (m) => notification(m, "Présence", "Toujours là ?"),
  // Propositions du 2026-10-22 (réglages blueprint seulement, aucune retouche du HMI).
  "sdb-home-proposition": (m) => home(m, {
    chips: [{ icon: "mdi:music", on: false }],
    outdoor: "15,3°C",
    indoor: "21,6°C",
    date: "mercredi, 22 octobre",
    values: [{ icon: "mdi:water-boiler", value: "52 L" }],
    buttons: [{ icon: "mdi:music", on: false }, { icon: "mdi:heart", on: false }],
    entities: true,
    hw: [{ label: "Spots", on: false }, { label: "Déco", on: false }],
  }),
  "sdb-entites-proposition": (m) => entities(m, "Salle de bain", [
    { icon: "mdi:track-light", label: "Spots", value: "Éteint" },
    { icon: "mdi:lamp", label: "Déco", value: "Éteint" },
    { icon: "mdi:speaker", label: "Musique", value: "Pause" },
    { icon: "mdi:water-boiler", label: "Eau chaude", value: "52 L" },
    { icon: "mdi:thermometer", label: "Temp.", value: "21,6 °C" },
  ]),
  "wc-home-proposition": (m) => home(m, {
    chips: [{ icon: "mdi:music", on: false }],
    outdoor: "15,3°C",
    indoor: "21,4°C",
    date: "mercredi, 22 octobre",
    buttons: [{ icon: "mdi:volume-high", on: false }, { icon: "mdi:heart", on: false }],
    entities: true,
    hw: [{ label: "Spots", on: true }, { label: "Suspension", on: true }],
  }),
};

const moments: Moment[] = ["nuit", "jour"];
const written: string[] = [];
for (const [id, make] of Object.entries(screens)) {
  for (const m of moments) {
    const png = new Resvg(make(m), { font: { loadSystemFonts: true, defaultFontFamily: FONT } }).render().asPng();
    const file = join(out, `${id}-${m}.png`);
    writeFileSync(file, png);
    written.push(file);
  }
}
console.log(`${written.length} maquettes dans ${out}`);
