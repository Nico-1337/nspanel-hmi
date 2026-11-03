/**
 * novembre-art.ts — les DESSINS du thème de novembre (« Saint-Martin »).
 *
 * Direction artistique (canevas « DA Saint-Martin », 2026-10-24) : papier
 * découpé le jour, papier vitrail la nuit. Le 11 novembre, en Alsace, les
 * enfants défilent avec leurs lanternes derrière Martin à cheval et son manteau
 * rouge. Le jour on prépare la fête (lanternes éteintes, oies au pré, cigogne
 * sur le clocher, lumière dorée de « l'été de la Saint-Martin ») ; la nuit le
 * cortège passe.
 *
 * Contrairement à octobre (bibliothèque de motifs tonnés `octobre/art.ts`), les
 * motifs sont peu nombreux et écrits ici en SVG brut, une fonction par motif.
 * Ce module n'importe RIEN d'octobre : la bibliothèque d'octobre (58 ko) ne
 * doit pas voyager dans le chunk de novembre.
 *
 * ── LES RÈGLES DE LA DA, TENUES ICI ────────────────────────────────────────
 *   • L'AMBRE reste le seul signal « allumé » : aucune lanterne n'est jaune ni
 *     orange. Papiers vermillon, bleu, vert, rose, violet ; leur LUMIÈRE est
 *     crème (#fff1d0), jamais ambre.
 *   • Tout est PAPIER : aplats découpés, bord net. L'ombre « calque du
 *     dessous » (2 px, sans flou) n'est posée que sur les images STATIQUES
 *     (fonds, occupants) : un filtre dans un SVG animé se recalculerait.
 */

/* ───────────────────────────── Palettes ───────────────────────────── */

export type Moment = "jour" | "nuit";

/** Les cinq papiers de lanterne, dans l'ordre fixe de la guirlande. */
export const PAPERS: Readonly<Record<Moment, readonly string[]>> = {
  // vermillon, bleu vitrail, vert volet, rose crépon, violet
  jour: ["#d9452e", "#2f6fa3", "#3e7a52", "#e48aa0", "#6b4fa0"],
  // les mêmes, éclaircis : la nuit ils sont éclairés de l'intérieur
  nuit: ["#ff6a4d", "#7fb6f0", "#8fd27a", "#f08bb0", "#a68cf0"],
};

/** Fil de fer et capuchons des lanternes. */
const WIRE: Readonly<Record<Moment, { wire: string; cap: string; cord: string }>> = {
  jour: { wire: "#4a2f22", cap: "#4a2f22", cord: "#6b4a33" },
  nuit: { wire: "#8a86b0", cap: "#2a2440", cord: "#8a86b0" },
};

/** La lumière d'une lanterne : crème, JAMAIS ambre (règle 1 de la DA). */
export const CREAM = "#fff1d0";

/* ───────────────────────────── Outils ───────────────────────────── */

/** `url("data:…")`-ready : même encodage qu'octobre (guillemets simples, % des réservés). */
export function dataUri(svgString: string): string {
  const s = svgString.replace(/"/g, "'").replace(/\s+/g, " ").trim();
  return (
    "data:image/svg+xml," +
    s.replace(/[%#<>?[\\\]^`{|}()"\n\r]/g, (c) => "%" + ("0" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-2))
  );
}

export const url = (svgString: string): string => `url("${dataUri(svgString)}")`;

export function compose(width: number, height: number, body: string, extra = ""): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"${extra ? ` ${extra}` : ""}>${body}</svg>`
  );
}

/** L'ombre « calque du dessous » : décalage 1,6 / 1,8 px, sans flou. Images STATIQUES seulement. */
function paperFilter(id: string, moment: Moment): string {
  const color = moment === "jour" ? "#3a2418" : "#05060f";
  const alpha = moment === "jour" ? 0.28 : 0.6;
  return (
    `<filter id="${id}" x="-15%" y="-15%" width="140%" height="140%">` +
    `<feDropShadow dx="1.6" dy="1.8" stdDeviation="0" flood-color="${color}" flood-opacity="${alpha}"/></filter>`
  );
}

/** Le halo d'une lanterne allumée (dégradé radial crème). */
function glowDef(id: string, strength = 1): string {
  return (
    `<radialGradient id="${id}"><stop offset="0" stop-color="${CREAM}" stop-opacity="${(0.8 * strength).toFixed(2)}"/>` +
    `<stop offset=".45" stop-color="#ffd9a8" stop-opacity="${(0.3 * strength).toFixed(2)}"/>` +
    `<stop offset="1" stop-color="#ffd9a8" stop-opacity="0"/></radialGradient>`
  );
}

/** Place un dessin de viewBox `vw × vh` dans la boîte (x, y, w, h). */
const at = (x: number, y: number, w: number, h: number, vw: number, vh: number, body: string): string =>
  `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(w / vw).toFixed(4)} ${(h / vh).toFixed(4)})">${body}</g>`;

/* ───────────────────────────── Lanternes (viewBox 48 × 48) ───────────────────────────── */

export type LanternKind = "lampion" | "etoile" | "lune" | "accordeon";

/** Le croissant de la lanterne-lune (intersections calculées : (23,8 ; 9) et (37,7 ; 33,3)). */
const CRESCENT = "M23.8 9A16 16 0 1 0 37.7 33.3A14 14 0 0 1 23.8 9z";

/** L'ordre fixe des formes, aligné sur `PAPERS`. */
export const LANTERN_ORDER: readonly LanternKind[] = ["lampion", "etoile", "lune", "accordeon", "lampion"];

/**
 * Une lanterne, fil compris (son point d'accroche est en haut, au milieu).
 * `light` = 0 (éteinte, le jour), sinon l'intensité du cœur crème (nuit).
 */
export function lantern(kind: LanternKind, paper: string, moment: Moment, light = 0): string {
  const { wire, cap } = WIRE[moment];
  const core = (shape: string): string => (light > 0 ? shape.replace("FILL", `fill="${CREAM}" opacity="${light.toFixed(2)}"`) : "");
  switch (kind) {
    case "lampion":
      return (
        `<path d="M24 1v7" stroke="${wire}" stroke-width="1.5"/>` +
        `<rect x="18" y="8" width="12" height="3" rx="1" fill="${cap}"/>` +
        `<ellipse cx="24" cy="25" rx="15" ry="14" fill="${paper}"/>` +
        core(`<ellipse cx="24" cy="26" rx="7" ry="8" FILL/>`) +
        `<g fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.2"><ellipse cx="24" cy="25" rx="9" ry="14"/><ellipse cx="24" cy="25" rx="3.5" ry="14"/></g>` +
        `<rect x="18" y="38" width="12" height="3" rx="1" fill="${cap}"/>`
      );
    case "etoile":
      return (
        `<path d="M24 1v9" stroke="${wire}" stroke-width="1.5"/>` +
        `<polygon points="24,10 28.5,20 39,21 31,28 33.5,39 24,33.5 14.5,39 17,28 9,21 19.5,20" fill="${paper}" stroke="#000" stroke-opacity=".25" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<polygon points="24,17 26.4,22.4 32,23 27.8,26.6 29,32.4 24,29.4 19,32.4 20.2,26.6 16,23 21.6,22.4" ` +
        (light > 0 ? `fill="${CREAM}" opacity="${Math.min(1, light + 0.15).toFixed(2)}"/>` : `fill="#fff" opacity=".35"/>`)
      );
    case "lune":
      // Croissant = disque (24, 25) r 16 privé du disque (31, 21) r 14 ; les deux arcs
      // vont d'une intersection à l'autre. ⚠️ Deux arcs de même corde et de rayons
      // trop petits pour elle sont agrandis par le moteur SVG jusqu'au même cercle :
      // le croissant d'épaisseur nulle de la 1ʳᵉ version (vu en capture).
      return (
        `<path d="M24 1v8" stroke="${wire}" stroke-width="1.5"/>` +
        `<path d="${CRESCENT}" fill="${paper}" stroke="#000" stroke-opacity=".22" stroke-width="1.2"/>` +
        (light > 0
          ? core(`<path d="${CRESCENT}" transform="translate(24 25) scale(.58) translate(-23 -24)" FILL/>`)
          : `<circle cx="14" cy="22" r="1.6" fill="#fff" opacity=".45"/><circle cx="14" cy="30" r="1.2" fill="#fff" opacity=".45"/>`)
      );
    case "accordeon":
      return (
        `<path d="M24 1v6" stroke="${wire}" stroke-width="1.5"/>` +
        `<rect x="14" y="9" width="20" height="30" rx="4" fill="${paper}"/>` +
        core(`<rect x="18" y="12" width="12" height="24" rx="3" FILL/>`) +
        `<path d="M14 14h20M14 19h20M14 24h20M14 29h20M14 34h20" stroke="#000" stroke-opacity=".2"/>` +
        `<rect x="13" y="7" width="22" height="3" rx="1" fill="${cap}"/><rect x="13" y="38" width="22" height="3" rx="1" fill="${cap}"/>`
      );
  }
}

/** Une lanterne autonome (SVG 48 × 48), avec son halo si elle est allumée. */
export function lanternSvg(kind: LanternKind, paper: string, moment: Moment, light = 0, halo = 0, shadow = false): string {
  const defs = (halo > 0 ? glowDef("g", halo) : "") + (shadow ? paperFilter("p", moment) : "");
  const glow = halo > 0 ? `<circle cx="24" cy="25" r="24" fill="url(#g)"/>` : "";
  const body = shadow ? `<g filter="url(#p)">${lantern(kind, paper, moment, light)}</g>` : lantern(kind, paper, moment, light);
  return compose(48, 48, `${defs ? `<defs>${defs}</defs>` : ""}${glow}${body}`, `overflow="visible"`);
}

/* ───────────────────────────── Personnages ───────────────────────────── */

/** L'oie blanche, debout, tête à droite (viewBox 48). */
export function goose(): string {
  return (
    `<path d="M6 27l-4-6 8 2z" fill="#e9e3d8"/>` +
    `<ellipse cx="20" cy="30" rx="15" ry="9.5" fill="#fbf8f2"/>` +
    `<path d="M10 29q10-8 19 0q-10 6-19 0z" fill="#e4ddd0"/>` +
    `<path d="M30 26c3-8 1-13 3-18" stroke="#fbf8f2" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<circle cx="33.5" cy="8" r="4" fill="#fbf8f2"/>` +
    `<path d="M37 7l6 2-6 2z" fill="#e0662a"/>` +
    `<circle cx="34.5" cy="7.2" r="1" fill="#1b140e"/>` +
    `<path d="M17 39v5l-3 1M23 39v5l3 1" stroke="#e0662a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
  );
}

/** L'oie endormie, tête rentrée (viewBox 48) — la nuit. */
export function gooseAsleep(): string {
  return (
    `<ellipse cx="22" cy="35" rx="17" ry="10" fill="#e6e3ee"/>` +
    `<path d="M10 33q12-8 22 0q-12 6-22 0z" fill="#cfcbdc"/>` +
    `<path d="M4 32l-3-5 8 2z" fill="#cfcbdc"/>` +
    `<circle cx="31" cy="27" r="6" fill="#e6e3ee"/>` +
    `<path d="M36 28l5 1.4-5 1.4z" fill="#e0662a"/>` +
    `<path d="M30 26.5q1.6 1.2 3.2 0" stroke="#3a3550" stroke-width="1" fill="none" stroke-linecap="round"/>` +
    `<path d="M39 14h4l-4 4h4M44 6h3l-3 3h3" stroke="#b3b6d4" stroke-width="1" fill="none" stroke-linejoin="round"/>`
  );
}

/** Martin à cheval, manteau rouge au vent (viewBox 64 × 48, regarde à droite). */
export function martin(moment: Moment): string {
  const c =
    moment === "jour"
      ? { tail: "#3a2418", horse: "#6b4630", cloak: "#b3261e", tunic: "#d8c7ae", skin: "#e8c9a8", helm: "#8c8f96" }
      : { tail: "#1c1426", horse: "#3a2a30", cloak: "#d23a2a", tunic: "#8a8098", skin: "#b8a090", helm: "#6e7080" };
  return (
    `<path d="M10 28q-6 2-7 11q4-4 8-6z" fill="${c.tail}"/>` +
    `<path d="M10 30c0-6 5-9 12-9h16c4 0 6-3 8-7l3-4 3 1-1 4c3 1 4 3 3 5l-3 1c-1 3-3 6-6 7l-1 10h-3l-1-9H24l-3 9h-3l1-10c-5-1-8-3-9-7z" fill="${c.horse}"/>` +
    `<path d="M45 11q-5 4-7 10" stroke="${c.tail}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<path d="M29 12q-11 3-17 15q9 0 15-5z" fill="${c.cloak}"/>` +
    `<path d="M27 21l2-9h6l1 9z" fill="${c.tunic}"/>` +
    `<path d="M31 21l-2 8" stroke="${c.tunic}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="32" cy="8.4" r="3.3" fill="${c.skin}"/>` +
    `<path d="M28.6 7.4a3.4 3.4 0 0 1 6.8 0z" fill="${c.helm}"/>` +
    `<path d="M30 4q2-3 5-1" stroke="${c.cloak}" stroke-width="2" fill="none" stroke-linecap="round"/>`
  );
}

/** Le nid de cigogne seul (viewBox 48, posé en bas). */
export function nest(color: string): string {
  return (
    `<path d="M7 40q17 6 34 0l-2 5q-15 3-30 0z" fill="${color}"/>` +
    `<path d="M9 41l-4-3M14 42l-2-4M34 42l3-4M39 41l4-3" stroke="${color}" stroke-width="1.4"/>`
  );
}

/** La cigogne sur son nid (viewBox 48). `withNest: false` = l'oiseau seul (il bouge, le nid non). */
export function stork(withNest = true): string {
  return (
    (withNest ? nest("#7a5a3a") : "") +
    `<path d="M24 32v9" stroke="#c8361e" stroke-width="1.8"/>` +
    `<path d="M12 30q2-10 14-10q8 0 10 6q-6 6-16 6q-6 0-8-2z" fill="#fbf8f2"/>` +
    `<path d="M16 27q9-5 19 1q-7 4-15 3z" fill="#1d1a18"/>` +
    `<path d="M34 25q2.5-8 0-15" stroke="#fbf8f2" stroke-width="4.4" stroke-linecap="round" fill="none"/>` +
    `<circle cx="34" cy="9" r="3.2" fill="#fbf8f2"/>` +
    `<path d="M36.5 8l10 3.2-10 1.2z" fill="#c8361e"/>` +
    `<circle cx="34.6" cy="8.2" r=".9" fill="#1b140e"/>`
  );
}

/** Le bretzel (viewBox 48). */
export function bretzel(moment: Moment): string {
  const [dark, light] = moment === "jour" ? ["#9a5a2a", "#c27c43"] : ["#a8683a", "#d0925a"];
  return (
    `<path d="M11 30C4 19 15 9 24 20C33 9 44 19 37 30C32 38 16 38 11 30zM16 35L31 18M32 35L17 18" stroke="${dark}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M11 30C4 19 15 9 24 20C33 9 44 19 37 30" stroke="${light}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<g fill="#fffaf0"><circle cx="13" cy="20" r="1"/><circle cx="35" cy="20" r="1"/><circle cx="24" cy="35" r="1"/><circle cx="18" cy="28" r=".9"/><circle cx="30" cy="27" r=".9"/></g>`
  );
}

/** Deux croches : la chanson (« Ich geh mit meiner Laterne »), viewBox 48. */
export function notes(color: string): string {
  return (
    `<path d="M16 36V13l20-5v23" stroke="${color}" stroke-width="2.6" fill="none"/>` +
    `<path d="M16 18l20-5" stroke="${color}" stroke-width="2.6"/>` +
    `<ellipse cx="12.5" cy="36" rx="5" ry="3.8" fill="${color}"/><ellipse cx="32.5" cy="31" rx="5" ry="3.8" fill="${color}"/>`
  );
}

/** Un enfant du cortège, silhouette (viewBox 40 × 80) ; bâton levé vers l'avant, bout en (32, 20). */
export function kid(color: string): string {
  return (
    `<g fill="${color}"><circle cx="14" cy="38" r="5.5"/><path d="M6 78l3-28q5-5 10 0l3 28z"/><path d="M8 36q6-10 12 0"/></g>` +
    `<path d="M18 52L32 20" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`
  );
}

/* ───────────────────────────── Maisons à colombages (viewBox 140 × 230) ───────────────────────────── */

interface HouseInk {
  readonly wall: string;
  readonly timber: string;
  readonly roof: string;
  readonly glass: string;
}

/** Une maison ; `chimney` ajoute une cheminée sur le toit (point de départ d'une fumée). */
function house(ink: HouseInk, chimney: boolean): string {
  return (
    (chimney ? `<rect x="96" y="20" width="14" height="40" fill="${ink.timber}"/>` : "") +
    `<polygon points="0,92 70,0 140,92" fill="${ink.roof}"/>` +
    `<rect x="8" y="92" width="124" height="138" fill="${ink.wall}"/>` +
    `<g stroke="${ink.timber}" stroke-width="5" fill="none"><path d="M8 92h124M8 140h124M8 186h124M10 92v138M50 92v138M90 92v138M130 92v138M50 140L90 186M90 140L50 186"/></g>` +
    `<g fill="${ink.glass}" stroke="${ink.timber}" stroke-width="2"><rect x="18" y="100" width="22" height="30"/><rect x="100" y="100" width="22" height="30"/><rect x="18" y="148" width="22" height="30"/><rect x="100" y="148" width="22" height="30"/></g>` +
    `<rect x="59" y="42" width="22" height="24" fill="${ink.wall}" stroke="${ink.timber}" stroke-width="3"/>`
  );
}

/* ───────────────────────────── Compositions du fond (colonne 4 du mur) ───────────────────────────── */

/**
 * Le village du bas de la colonne 4 : 480 × 200, posé `right 0 bottom 0`.
 * ⚠️ Le texte des actus passe DEVANT : le jour en pastels très pâles, la nuit en
 * silhouettes à peine plus claires que le ciel (audit d'octobre : du texte
 * « dim » ne tolère qu'un décor faible derrière lui).
 */
export const VILLAGE = { width: 480, height: 200, scale: 0.8 } as const;

/** Les maisons : x du coin gauche, décalage du toit, cheminée ? (repère du village). */
const HOUSES: readonly { x: number; y: number; chimney: boolean }[] = [
  { x: -10, y: 16, chimney: false },
  { x: 90, y: 0, chimney: true },
  { x: 190, y: 22, chimney: false },
  { x: 290, y: 6, chimney: true },
  { x: 390, y: 18, chimney: false },
];

const WALLS: Readonly<Record<Moment, readonly string[]>> = {
  jour: ["#f2e9d6", "#efe1dc", "#e6ece2", "#e4eaf0", "#f2e9d6"],
  nuit: ["#1e2342", "#222040", "#1c2442", "#211f41", "#1e2342"],
};

const HOUSE_INK: Readonly<Record<Moment, Omit<HouseInk, "wall">>> = {
  jour: { timber: "#cdb9a3", roof: "#dcb3a2", glass: "#e3ecf0" },
  nuit: { timber: "#0e1026", roof: "#191530", glass: "#161a36" },
};

/** Les fenêtres du village dans le repère du village (pour celles qui s'allument). */
export function villageWindows(): { x: number; y: number; w: number; h: number }[] {
  const s = VILLAGE.scale;
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (const h of HOUSES) {
    for (const [wx, wy] of [[18, 100], [100, 100], [18, 148], [100, 148]] as const) {
      out.push({ x: h.x + wx * s, y: h.y + wy * s, w: 22 * s, h: 30 * s });
    }
  }
  return out;
}

/** Le point de départ des fumées (haut des cheminées), repère du village. */
export function villageChimneys(): { x: number; y: number }[] {
  const s = VILLAGE.scale;
  return HOUSES.filter((h) => h.chimney).map((h) => ({ x: h.x + 103 * s, y: h.y + 20 * s }));
}

/** Fenêtres TOUJOURS allumées la nuit (index dans `villageWindows()`) ; trois autres clignent (scène). */
export const LIT_WINDOWS = [1, 6, 14, 19] as const;
export const BLINK_WINDOWS = [3, 9, 16] as const;
/** Opacité d'une fenêtre allumée : basse, du texte clair passe devant. */
export const WINDOW_ALPHA = 0.42;

export function village(moment: Moment): string {
  const ink = HOUSE_INK[moment];
  const s = VILLAGE.scale;
  let body = "";
  HOUSES.forEach((h, index) => {
    body += at(h.x, h.y, 140 * s, 230 * s, 140, 230, house({ ...ink, wall: WALLS[moment][index]! }, h.chimney));
  });
  if (moment === "nuit") {
    const windows = villageWindows();
    for (const i of LIT_WINDOWS) {
      const w = windows[i]!;
      body += `<rect x="${w.x.toFixed(1)}" y="${w.y.toFixed(1)}" width="${w.w.toFixed(1)}" height="${w.h.toFixed(1)}" fill="${CREAM}" opacity="${WINDOW_ALPHA}"/>`;
    }
  }
  // Atténué en bloc : les actus de Niles passent DEVANT (vu en capture le
  // 2026-10-24 : à pleine teinte, colombages et toits roses brouillaient le
  // texte rose des messages).
  body = `<g opacity="${moment === "jour" ? 0.5 : 0.8}">${body}</g>`;
  // Le pré (jour) ou la rue (nuit), sur lequel marchent les oies et le cortège.
  body += `<rect x="0" y="${VILLAGE.height - 18}" width="${VILLAGE.width}" height="18" fill="${moment === "jour" ? "#dfe4d4" : "#141834"}"/>`;
  return compose(VILLAGE.width, VILLAGE.height, `<defs>${paperFilter("p", moment)}</defs><g filter="url(#p)">${body}</g>`);
}

/**
 * Le ciel du coin de l'horloge : 480 × 320, posé `right top`. Le soleil bas (jour)
 * ou le croissant de lune (nuit) à droite de l'horloge, la tour au nid de
 * cigogne et une flèche d'église entre l'heure et les min/max de la météo.
 * ⚠️ La cigogne du jour n'y est PAS : elle bouge (scène) ; son nid, si.
 */
export const SKY = { width: 480, height: 320, towerX: 312, towerTop: 150, sun: [390, 128] as const } as const;

export function sky(moment: Moment): string {
  const tower = moment === "jour" ? "#e8dece" : "#151a38";
  const towerTop = moment === "jour" ? "#d9c9b2" : "#11152f";
  const spire = moment === "jour" ? "#e4d8c6" : "#141938";
  const [sx, sy] = SKY.sun;
  let body = "";
  if (moment === "jour") {
    body += `<circle cx="${sx}" cy="${sy}" r="40" fill="#fbf0d4"/>`;
  } else {
    body += `<path d="M${sx + 8} ${sy - 40}a40 40 0 1 0 32 64a33 33 0 1 1-32-64z" fill="#f2ecd2"/>`;
  }
  const tx = SKY.towerX;
  const tt = SKY.towerTop;
  body +=
    `<g filter="url(#p)">` +
    `<path d="M262 320V200l14-40 14 40v120z" fill="${spire}"/>` +
    `<rect x="${tx}" y="${tt}" width="34" height="${SKY.height - tt}" fill="${tower}"/>` +
    `<path d="M${tx - 4} ${tt + 2}h42v-8h-42z" fill="${towerTop}"/>` +
    `<rect x="${tx + 10}" y="${tt + 36}" width="14" height="22" rx="7" fill="${moment === "jour" ? "#d6c4ab" : CREAM}" opacity="${moment === "jour" ? 1 : 0.85}"/>` +
    // Le nid, posé sur la tour : 48 → 52 px, son bas sur le haut de la tour.
    at(tx - 9, tt - 47, 52, 52, 48, 48, nest(moment === "jour" ? "#7a5a3a" : "#0f1230")) +
    `</g>`;
  return compose(SKY.width, SKY.height, `<defs>${paperFilter("p", moment)}</defs>${body}`);
}

/** La lune seule, réduite (téléphone, voiture, télécommandes) — 120 × 120. */
export function moonCompact(): string {
  return compose(120, 120, `<path d="M68 20a40 40 0 1 0 32 64a33 33 0 1 1-32-64z" fill="#f2ecd2"/>`);
}

/** Le ciel étoilé (haut de l'écran), hors du halo de la lune — 1920 × 320. */
export function starField(): string {
  let seed = 1111;
  const random = (): number => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  let body = `<g fill="#e9e6ff">`;
  for (let i = 0; i < 70; i += 1) {
    const x = random() * 1920;
    const y = 8 + random() * 300;
    if (x > 1700 && y < 220) continue; // la lune
    body += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.5 + random() * 0.9).toFixed(1)}" opacity="${(0.22 + random() * 0.5).toFixed(2)}"/>`;
  }
  return compose(1920, 320, `${body}</g>`);
}

/* ───────────────────────────── Habillage des cartes ───────────────────────────── */

/** La guirlande : 120 × 18, cinq lanternes sur une cordelette (repeat-x). */
export function garland(moment: Moment): string {
  const { cord } = WIRE[moment];
  let body = `<path d="M0 3Q15 7 30 4T60 3T90 4T120 3" stroke="${cord}" stroke-width="1.1" fill="none"/>`;
  if (moment === "nuit") {
    body = `<defs>${glowDef("g")}</defs>` + body;
    for (let i = 0; i < 5; i += 1) body += `<circle cx="${12 + i * 24}" cy="11" r="9" fill="url(#g)"/>`;
  }
  LANTERN_ORDER.forEach((kind, i) => {
    body += at(4 + i * 24, 2, 16, 16, 48, 48, lantern(kind, PAPERS[moment][i]!, moment, moment === "nuit" ? 0.55 : 0));
  });
  return compose(120, 18, body, `overflow="visible"`);
}

/** Un occupant posé sur son pied, viewBox d'origine (le CSS l'ajuste en `contain`). */
export function sitter(body: string, vw: number, vh: number, moment: Moment, shadow = true): string {
  return compose(vw, vh, shadow ? `<defs>${paperFilter("p", moment)}</defs><g filter="url(#p)">${body}</g>` : body, `overflow="visible"`);
}

/** Le filigrane des boutons : une étoile, une lune ou un lampion PERFORÉS (pointillés). */
export function watermark(shape: 0 | 1 | 2, color: string): string {
  const path = [
    "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
    "M15 4a8.5 8.5 0 1 0 0 16a7 7 0 1 1 0-16z",
    "M12 2v3M8 6h8M7 6.5q-3 5.5 0 11.5h10q3-6 0-11.5M8 18h8M12 6.5v11.5",
  ][shape]!;
  return compose(
    24,
    24,
    `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="2 1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
}

/* ───────────────────────────── La scène (SVG inline, animés) ───────────────────────────── */

/** La feuille qui tombe (le jour) — viewBox 18 × 10. */
export function leaf(color: string): string {
  return `<svg viewBox="0 -6 18 12"><path d="M0 0C7-7 16-5 18 4C11 9 4 9 0 0z" fill="${color}"/><path d="M1 0.5L15 3" stroke="#000" stroke-opacity=".18" stroke-width=".8"/></svg>`;
}

/** Le pas des oies du pré : trois oies, 130 × 44. */
export function geese(): string {
  return (
    `<svg viewBox="0 0 130 44">` +
    at(0, 4, 40, 40, 48, 48, goose()) +
    at(44, 10, 34, 34, 48, 48, goose()) +
    at(82, 6, 38, 38, 48, 48, goose()) +
    `</svg>`
  );
}

/** La cigogne SEULE (sans nid), pour le claquement de bec — 52 × 52. */
export function storkAlone(): string {
  return `<svg viewBox="0 0 48 48" overflow="visible">${stork(false)}</svg>`;
}

/** Une lanterne du fil de la colonne 4, en SVG inline (sans filtre : elle se balance). */
export function stringLantern(index: number, moment: Moment): string {
  const kind = LANTERN_ORDER[index % LANTERN_ORDER.length]!;
  const paper = PAPERS[moment][index % 5]!;
  return `<svg viewBox="0 0 48 48" overflow="visible">${lantern(kind, paper, moment, moment === "nuit" ? 0.6 : 0)}</svg>`;
}

/** La cordelette du fil de lanternes, 480 × 40 (ses points d'accroche : `STRING_HOOKS`). */
export function stringCord(moment: Moment): string {
  return `<svg viewBox="0 0 480 40"><path d="M0 6Q120 40 240 18T480 10" stroke="${WIRE[moment].cord}" stroke-width="1.6" fill="none"/></svg>`;
}

/** x (repère du fil, 480 de large) et y du point d'accroche sur la cordelette. */
export const STRING_HOOKS: readonly (readonly [number, number])[] = [
  [40, 16],
  [120, 26],
  [200, 24],
  [280, 12],
  [360, 5],
  [440, 6],
];

/* ── Le cortège : Martin devant, sept enfants derrière, une lanterne chacun ── */

export const CORTEGE = { width: 430, height: 90 } as const;

interface Walker {
  readonly x: number;
  readonly h: number;
}

const WALKERS: readonly Walker[] = [
  { x: 0, h: 62 },
  { x: 42, h: 56 },
  { x: 84, h: 60 },
  { x: 126, h: 54 },
  { x: 168, h: 64 },
  { x: 210, h: 54 },
  { x: 252, h: 60 },
];

/** Le centre de chaque lanterne du cortège (repère du cortège), pour les halos. */
export function cortegeLanterns(): { x: number; y: number }[] {
  return WALKERS.map(({ x, h }) => {
    const s = h / 80;
    return { x: x + 32 * s, y: CORTEGE.height - h + 20 * s + 9 };
  });
}

/** Le cortège, dessin fixe (les halos qui vacillent sont posés par la scène). */
export function cortege(): string {
  const ground = CORTEGE.height;
  let body = "";
  WALKERS.forEach(({ x, h }, i) => {
    const s = h / 80;
    body += at(x, ground - h, 40 * s, h, 40, 80, kid("#0a0c1c"));
    const tipX = x + 32 * s;
    const tipY = ground - h + 20 * s;
    const kind = LANTERN_ORDER[(i + 1) % LANTERN_ORDER.length]!;
    body += at(tipX - 8, tipY, 16, 16, 48, 48, lantern(kind, PAPERS.nuit[i % 5]!, "nuit", 0.7));
  });
  body += at(320, ground - 70, 94, 70, 64, 48, martin("nuit"));
  return `<svg viewBox="0 0 ${CORTEGE.width} ${CORTEGE.height}" overflow="visible">${body}</svg>`;
}
