/**
 * art.ts — bibliothèque d'illustrations du thème « octobre » (automne le jour, Halloween la nuit).
 *
 * Style : illustration PLATE, 2-3 tons par motif, contours implicites (aucun trait : tout est
 * rempli, les « lignes » sont des rubans effilés), lisible de 24 à 160 px.
 *
 * Les couleurs ne sont PAS dans les tracés : chaque calque porte un TON, résolu par une PALETTE
 * (`JOUR` sur crème #f2e9e1, `NUIT` sur prune #1a1222). Recolorer un motif = passer une palette
 * dérivée, ex. `svg("maple", { ...JOUR, leafA: JOUR.leafC })`.
 *
 * ⛔ Aucun ton ne se lit comme l'ambre du signal « allumé » (#ff9800) : ΔE76 ≥ 40 pour tout ce
 * qui est grand ou fréquent ; la citrouille est orange BRÛLÉ, la braise est rouge-orangé.
 *
 * Sous-parties ADRESSABLES (`Layer.part`) : `svg()` regroupe chaque partie dans
 * `<g data-part="…" class="part-…">` pour l'animer en CSS (`transform-box: fill-box`).
 * `svg(nom, pal, { parts: "static" })` rend le motif SANS ses parties ; `parts: ["eyes"]` ne rend
 * QUE ces parties (même viewBox : à superposer exactement au rendu statique).
 *
 * Tracés générés au chargement (géométrie déterministe, graines fixes) : uniquement des commandes
 * absolues M/L/C/Z, coordonnées arrondies au dixième. Syntaxe TypeScript effaçable uniquement
 * (importable tel quel par Node ≥ 22.18 / 23.6).
 */

/* ───────────────────────────── Types publics ───────────────────────────── */

export type Tone =
  | "leafA" // rouille
  | "leafB" // bordeaux
  | "leafC" // ocre / or
  | "leafD" // olive
  | "moss" // vert mousse
  | "bark" // brun d'écorce
  | "wood" // brun clair (écailles, cupule)
  | "nut" // noisette / marron luisant
  | "husk" // bogue (vert-jaune éteint)
  | "pumpkin" // orange brûlé
  | "stem" // pédoncule, vrille
  | "cap" // chapeau de cèpe
  | "capRed" // chapeau d'amanite
  | "pale" // pied de champignon, points, ventres
  | "berry" // baies de sorbier
  | "fur" // roux d'écureuil
  | "furLight" // ventre, museau
  | "owl" // plumage du hibou
  | "owlLight" // disque facial
  | "eye" // iris (hibou, chat)
  | "ink" // silhouettes (chauve-souris, chat, sorcière, corbeau)
  | "goose" // oie cendrée
  | "ghost" // drap du fantôme
  | "moon" // disque lunaire et son halo
  | "glow" // braise (visage de lanterne, flamme)
  | "flame" // cœur clair de flamme
  | "wax" // cire de bougie
  | "star" // étoile
  | "web" // fil et toile d'araignée
  | "shade" // ombre portée INTERNE (toujours avec opacité)
  | "light"; // reflet (toujours avec opacité)

export type Palette = Record<Tone, string>;

export interface Layer {
  d: string;
  tone: Tone;
  opacity?: number;
  /** sous-partie adressable (animée) ; absente = partie statique */
  part?: string;
}

export interface Motif {
  viewBox: string;
  layers: readonly Layer[];
  /** ornements de carte : point du viewBox à poser sur le COIN haut-droit de la carte */
  anchor?: readonly [number, number];
}

/* ───────────────────────────── Palettes ───────────────────────────── */

/** Sur crème #f2e9e1 : rouille, bordeaux, ocre, olive, brun chaud, vert mousse. */
export const JOUR: Palette = {
  leafA: "#a94a2c",
  leafB: "#7c2b36",
  leafC: "#a17c3c",
  leafD: "#6e6a36",
  moss: "#56603a",
  bark: "#5b3d2e",
  wood: "#94673f",
  nut: "#7a4527",
  husk: "#8f8a4a",
  pumpkin: "#a8501f",
  stem: "#5c5a2c",
  cap: "#7b4b2b",
  capRed: "#a5322b",
  pale: "#e0cdb1",
  berry: "#ab2f2a",
  fur: "#9c5430",
  furLight: "#e3cdae",
  owl: "#7a5a40",
  owlLight: "#d8c1a0",
  eye: "#e9dfa0",
  ink: "#2c2129",
  goose: "#857a70",
  ghost: "#fbf7f1",
  moon: "#efe4d2",
  glow: "#c84a2a",
  flame: "#f4d98f",
  wax: "#ece0cb",
  star: "#bfa065",
  web: "#7f6e68",
  shade: "#2a1810",
  light: "#fff8ee",
};

/** Sur prune #1a1222 : tons assombris et désaturés, silhouettes « encre », lune ivoire-lavande. */
export const NUIT: Palette = {
  leafA: "#7a3a2b",
  leafB: "#5a2533",
  leafC: "#77603a",
  leafD: "#4e4b2f",
  moss: "#3b4230",
  bark: "#2f2229",
  wood: "#5e4434",
  nut: "#58362a",
  husk: "#5a573a",
  pumpkin: "#93421f",
  stem: "#3e3d26",
  cap: "#5a3b2b",
  capRed: "#7e2b29",
  pale: "#b8aa98",
  berry: "#8c2c2a",
  fur: "#6b3c28",
  furLight: "#a8947e",
  owl: "#4a3a33",
  owlLight: "#8c7a6c",
  eye: "#e4dc8c",
  ink: "#0b0610",
  goose: "#4c4250",
  ghost: "#ece6f3",
  moon: "#efeaf2",
  glow: "#cc5a33",
  flame: "#f7dc9c",
  wax: "#d8cbbb",
  star: "#ebe4f3",
  web: "#cfc2de",
  shade: "#07040a",
  light: "#f4eef8",
};

/* ───────────────────────────── Géométrie ───────────────────────────── */

/** point ; un 3ᵉ élément (=1) marque un point ANGULEUX (tangente nulle dans le lissage) */
type Pt = readonly [number, number] | readonly [number, number, number];
type M6 = readonly [number, number, number, number, number, number];

const PI = Math.PI;
const rad = (deg: number): number => (deg * PI) / 180;
const rd = (v: number): number => Math.round(v * 10) / 10;
const fp = (x: number, y: number): string => `${rd(x)} ${rd(y)}`;
function at<T>(a: readonly T[], i: number): T {
  const n = a.length;
  return a[((i % n) + n) % n] as T;
}
const isSharp = (p: Pt): boolean => p.length === 3;
const X = (p: Pt): number => p[0];
const Y = (p: Pt): number => p[1];

function area(pts: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = at(pts, i);
    const b = at(pts, i + 1);
    s += X(a) * Y(b) - X(b) * Y(a);
  }
  return s;
}
/** même sens de parcours pour tout le monde ⇒ les sous-chemins d'un calque s'UNISSENT (nonzero) */
const orient = (pts: readonly Pt[]): readonly Pt[] => (area(pts) < 0 ? pts.slice().reverse() : pts);

/** polygone fermé à angles vifs */
function poly(pts: readonly Pt[]): string {
  return "M" + orient(pts).map((p) => fp(X(p), Y(p))).join("L") + "Z";
}

/** contour fermé lissé (Catmull-Rom → cubiques) ; les points marqués restent anguleux */
function S(pts: readonly Pt[], k = 1): string {
  const q = orient(pts);
  const t = k / 6;
  const tan = (i: number): readonly [number, number] => {
    const p = at(q, i);
    if (isSharp(p)) return [0, 0];
    const a = at(q, i - 1);
    const b = at(q, i + 1);
    return [(X(b) - X(a)) * t, (Y(b) - Y(a)) * t];
  };
  const p0 = at(q, 0);
  let d = "M" + fp(X(p0), Y(p0));
  for (let i = 0; i < q.length; i++) {
    const a = at(q, i);
    const b = at(q, i + 1);
    const ta = tan(i);
    const tb = tan(i + 1);
    d += `C${fp(X(a) + ta[0], Y(a) + ta[1])} ${fp(X(b) - tb[0], Y(b) - tb[1])} ${fp(X(b), Y(b))}`;
  }
  return d + "Z";
}

/** ellipse exacte (4 cubiques), rotation en degrés */
function E(cx: number, cy: number, rx: number, ry: number = rx, rot = 0): string {
  const k = 0.5523;
  const c = Math.cos(rad(rot));
  const s = Math.sin(rad(rot));
  const P = (x: number, y: number): string => fp(cx + x * c - y * s, cy + x * s + y * c);
  return (
    `M${P(rx, 0)}C${P(rx, k * ry)} ${P(k * rx, ry)} ${P(0, ry)}C${P(-k * rx, ry)} ${P(-rx, k * ry)} ${P(-rx, 0)}` +
    `C${P(-rx, -k * ry)} ${P(-k * rx, -ry)} ${P(0, -ry)}C${P(k * rx, -ry)} ${P(rx, -k * ry)} ${P(rx, 0)}Z`
  );
}

/** largeur interpolée (liste de largeurs répartie sur les points) */
function widthAt(w: readonly number[], i: number, n: number): number {
  if (w.length === 1 || n === 1) return w[0] ?? 1;
  const u = (i / (n - 1)) * (w.length - 1);
  const j = Math.min(w.length - 2, Math.floor(u));
  const a = w[j] ?? 1;
  const b = w[j + 1] ?? a;
  return a + (b - a) * (u - j);
}

/** ruban effilé le long d'une ligne (tiges, branches, nervures, fils) ; largeur ≤ 0,3 = pointe */
function rib(pts: readonly Pt[], w: readonly number[]): string {
  const n = pts.length;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = at(pts, i);
    const a = pts[Math.max(0, i - 1)] ?? p;
    const b = pts[Math.min(n - 1, i + 1)] ?? p;
    let tx = X(b) - X(a);
    let ty = Y(b) - Y(a);
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    const h = widthAt(w, i, n) / 2;
    L.push([X(p) - ty * h, Y(p) + tx * h]);
    R.push([X(p) + ty * h, Y(p) - tx * h]);
  }
  const p0 = at(pts, 0);
  const pn = at(pts, n - 1);
  const thin0 = widthAt(w, 0, n) <= 0.3;
  const thinN = widthAt(w, n - 1, n) <= 0.3;
  const out: Pt[] = [];
  if (thin0) out.push([X(p0), Y(p0), 1]);
  for (let i = thin0 ? 1 : 0; i < (thinN ? n - 1 : n); i++) {
    const p = at(L, i);
    out.push(i === 0 || i === n - 1 ? [X(p), Y(p), 1] : p);
  }
  if (thinN) out.push([X(pn), Y(pn), 1]);
  for (let i = thinN ? n - 2 : n - 1; i >= (thin0 ? 1 : 0); i--) {
    const p = at(R, i);
    out.push(i === 0 || i === n - 1 ? [X(p), Y(p), 1] : p);
  }
  return n === 2 ? poly(out) : S(out);
}
/** segment droit effilé (nervure) */
const V = (a: Pt, b: Pt, w0: number, w1: number): string => rib([a, b], [w0, w1]);

/** symétrique d'une demi-silhouette (axe x = cx), parcours inversé */
const mirror = (pts: readonly Pt[], cx: number): Pt[] =>
  pts
    .slice()
    .reverse()
    .map((p): Pt => (isSharp(p) ? [2 * cx - X(p), Y(p), 1] : [2 * cx - X(p), Y(p)]));

/* matrices affines [a b c d e f] */
const mul = (a: M6, b: M6): M6 => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
const tr = (x: number, y: number): M6 => [1, 0, 0, 1, x, y];
const sc = (x: number, y: number = x): M6 => [x, 0, 0, y, 0, 0];
const ro = (deg: number): M6 => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [c, s, -s, c, 0, 0];
};
const chain = (...ms: M6[]): M6 => ms.reduce((acc, m) => mul(acc, m), [1, 0, 0, 1, 0, 0] as M6);
/** applique une affine à un tracé (M/L/C/Z absolus, paires « x y ») */
const xf = (d: string, m: M6): string =>
  d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_s, a: string, b: string) => {
    const x = Number(a);
    const y = Number(b);
    return fp(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]);
  });
const xp = (p: Pt, m: M6): Pt => [m[0] * X(p) + m[2] * Y(p) + m[4], m[1] * X(p) + m[3] * Y(p) + m[5]];

/** PRNG à graine (mulberry32) : même graine ⇒ même dessin */
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────────── Registre ───────────────────────────── */

const M: Record<string, Motif> = {};
const L = (d: string, tone: Tone, opacity?: number, part?: string): Layer => {
  const l: Layer = { d, tone };
  if (opacity !== undefined && opacity < 1) l.opacity = opacity;
  if (part !== undefined) l.part = part;
  return l;
};
const def = (name: string, viewBox: string, layers: Layer[], anchor?: readonly [number, number]): void => {
  M[name] = anchor ? { viewBox, layers, anchor } : { viewBox, layers };
};
const vbOf = (name: string): readonly [number, number, number, number] => {
  const m = M[name];
  if (!m) throw new Error(`motif inconnu : ${name}`);
  const [a = 0, b = 0, c = 100, d = 100] = m.viewBox.split(" ").map(Number);
  return [a, b, c, d];
};

/** recadre un motif déjà défini (affine appliquée à tous ses calques) */
const reshape = (name: string, m: M6): void => {
  const mo = M[name];
  if (mo) M[name] = { ...mo, layers: mo.layers.map((l) => ({ ...l, d: xf(l.d, m) })) };
};

/**
 * Pose un motif déjà défini dans une composition : son PIVOT (coordonnées de son viewBox,
 * défaut = centre) va en (x, y), sa HAUTEUR de viewBox devient h, rotation en degrés.
 * `part` remplace la sous-partie de tous ses calques ; `keepParts` garde les siennes.
 */
function put(
  name: string,
  x: number,
  y: number,
  h: number,
  rot = 0,
  o: { flip?: boolean; pivot?: Pt; part?: string; keepParts?: boolean; tones?: Partial<Record<Tone, Tone>>; noVeins?: boolean } = {},
): Layer[] {
  const [vx, vy, vw, vh] = vbOf(name);
  const pv = o.pivot ?? [vx + vw / 2, vy + vh / 2];
  const s = h / vh;
  const m = chain(tr(x, y), ro(rot), sc(o.flip ? -s : s, s), tr(-X(pv), -Y(pv)));
  const src = (M[name]?.layers ?? []).filter((l) => !(o.noVeins && l.tone === "shade" && l.opacity === VEIN));
  return src.map((l) => {
    const part = o.part ?? (o.keepParts ? l.part : undefined);
    return L(xf(l.d, m), o.tones?.[l.tone] ?? l.tone, l.opacity, part);
  });
}

/* ════════════════════════════ FEUILLES ════════════════════════════
 * viewBox 0 0 100 100, pétiole en bas au centre (50, 98), pointe vers le haut.
 * Calque 1 = limbe (ton propre), calque 2 = nervures (shade, opacité 0,3). */

const VEIN = 0.3;
const PETIOLE: Pt = [50, 98];

function leaf(name: string, tone: Tone, blade: string, veins: string): void {
  def(name, "0 0 100 100", [L(blade, tone), L(veins, "shade", VEIN)]);
}

/* Érable plane : 5 lobes pointus, dents franches. */
{
  const left: Pt[] = [
    [48.6, 80], [40, 79.5], [31, 84], [22, 88.5, 1], [25.5, 80], [17, 77.5, 1], [19.5, 71.5], [9, 66.5, 1],
    [4, 58.5, 1], [12.5, 55.5], [1.5, 42, 1], [13, 41.5], [16.5, 34, 1], [24.5, 40.5], [25, 30, 1], [20.5, 21.5, 1],
    [30, 25], [33.5, 16.5, 1], [40.5, 22.5], [42, 12, 1], [47, 9], [50, 0.5, 1],
  ];
  const outline = [...left, ...mirror(left, 50).slice(1)];
  const blade = poly(outline) + V([50, 76], [50, 98], 2.6, 2.2);
  const veins =
    V([50, 80], [50, 8], 2.4, 0.4) + V([50, 63], [13, 43], 1.7, 0.3) + V([50, 63], [87, 43], 1.7, 0.3) +
    V([50, 72], [23, 85], 1.4, 0.3) + V([50, 72], [77, 85], 1.4, 0.3) + V([50, 55], [27, 28], 1.2, 0.3) + V([50, 55], [73, 28], 1.2, 0.3);
  leaf("maple", "leafA", blade, veins);
}

/* Chêne pédonculé : lobes arrondis alternés, oreillettes à la base. */
{
  const right: Pt[] = [
    [50, 4], [56, 6], [59, 11], [57, 16], [62, 17], [67, 22], [66, 28], [59, 30], [65, 33], [71, 39], [69, 46],
    [60, 47], [65, 51], [69, 57], [66, 63], [58, 63], [62, 67], [63, 73], [58, 76], [54, 75], [56, 79], [55, 83], [51.5, 84],
  ];
  const leftSide: Pt[] = [
    [50, 4], [44, 6], [41, 12], [43, 19], [37, 20], [33, 26], [35, 32], [42, 33], [35, 37], [30, 44], [32, 51],
    [41, 51], [35, 55], [32, 61], [35, 67], [43, 66], [39, 70], [38, 76], [43, 78], [46, 77], [44, 81], [45, 84], [48.5, 84],
  ];
  const outline = [...right, ...leftSide.slice(1).reverse()];
  // proportions : un peu élargi pour la lecture à petite taille
  const blade = xf(S(outline), chain(tr(50, 0), sc(1.25, 1), tr(-50, 0))) + V([50, 82], [50, 98], 2.6, 2.1);
  const veins = xf(
    V([50, 90], [50.5, 8], 2.2, 0.4) + V([50.3, 24], [63, 22], 1.1, 0.3) + V([50.2, 40], [67, 41], 1.2, 0.3) +
      V([50, 57], [65, 58], 1.2, 0.3) + V([49.9, 71], [59, 72], 1, 0.3) + V([50.4, 27], [37, 26], 1.1, 0.3) +
      V([50.2, 45], [34, 46], 1.2, 0.3) + V([50, 62], [35, 62], 1.2, 0.3) + V([49.9, 74], [41, 74], 1, 0.3),
    chain(tr(50, 0), sc(1.25, 1), tr(-50, 0)),
  );
  leaf("oak", "leafD", blade, veins);
}

/* Bouleau verruqueux : deltoïde, pointe acuminée, bord doublement denté. */
{
  const prof: readonly (readonly [number, number])[] = [
    [5, 0], [12, 3], [20, 7.5], [30, 14], [40, 21], [50, 27], [58, 30], [64, 29], [69, 23], [72, 13], [73.5, 4],
  ];
  const W = (y: number): number => {
    for (let i = 0; i < prof.length - 1; i++) {
      const [y0, w0] = at(prof, i);
      const [y1, w1] = at(prof, i + 1);
      if (y >= y0 && y <= y1) {
        const t = (y - y0) / (y1 - y0);
        const s = t * t * (3 - 2 * t);
        return w0 + (w1 - w0) * (0.5 * t + 0.5 * s);
      }
    }
    return 0;
  };
  const N = 30;
  const R: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const y = 5 + (68.5 * i) / N;
    let w = W(y) * 1.1;
    if (i > 2 && i < N - 1) w += i % 2 ? 1.8 : 0;
    R.push(i % 2 && i > 2 && i < N - 1 ? [50 + w, y, 1] : [50 + w, y]);
  }
  const outline = [...R, ...mirror(R, 50).slice(1)];
  const blade = poly(outline) + V([50, 72], [50, 98], 2.2, 1.8);
  const veins =
    V([50, 90], [50, 8], 2, 0.4) + V([50, 28], [60, 20], 1, 0.3) + V([50, 38], [67, 29], 1.1, 0.3) + V([50, 48], [74, 40], 1.2, 0.3) +
    V([50, 58], [79, 52], 1.2, 0.3) + V([50, 28], [40, 20], 1, 0.3) + V([50, 38], [33, 29], 1.1, 0.3) + V([50, 48], [26, 40], 1.2, 0.3) +
    V([50, 58], [21, 52], 1.2, 0.3);
  leaf("birch", "leafC", blade, veins);
}

/* Ginkgo : éventail bilobé, bord ondulé, nervures en rayons. */
{
  const left: Pt[] = [
    [50, 64, 1], [42, 56], [28, 45], [14, 33], [5, 22], [7, 14], [15, 9], [24, 7], [30, 8.5], [36, 6.5], [43, 8], [47.5, 13], [50, 24, 1],
  ];
  const outline = [...left, ...mirror(left, 50).slice(1, -1)];
  const blade = S(outline) + V([50, 60], [50, 98], 2.8, 2.2);
  let veins = "";
  for (const a of [-142, -126, -110, -96, -84, -70, -54, -38]) {
    const r = Math.abs(a + 90) > 40 ? 46 : 50;
    veins += V([50, 62], [50 + r * Math.cos(rad(a)), 62 + r * Math.sin(rad(a))], 1.1, 0.3);
  }
  leaf("ginkgo", "leafC", blade, veins);
}

/* Marronnier : 7 folioles obovales en éventail (feuille palmée). */
{
  // folioles obovales SÉPARÉES (base étroite, largeur max aux 2/3), bord finement denté
  const leaflet = (len: number, wid: number): Pt[] => {
    const half: Pt[] = [[0, -3, 1], [wid * 0.1, -len * 0.2], [wid * 0.3, -len * 0.45], [wid * 0.45, -len * 0.68], [wid * 0.42, -len * 0.86], [wid * 0.2, -len * 0.97]];
    return [...half, [0, -len - 2, 1], ...mirror(half, 0).slice(0, -1)];
  };
  const spec: readonly (readonly [number, number, number])[] = [
    [-100, 19, 9.5], [-66, 35, 16], [-33, 46, 19], [0, 53, 20], [33, 46, 19], [66, 35, 16], [100, 19, 9.5],
  ];
  let blade = V([50, 62], [50, 98], 2.8, 2.2) + E(50, 63, 3.2);
  let veins = "";
  for (const [a, len, wid] of spec) {
    const m = chain(tr(50, 63), ro(a));
    blade += xf(S(leaflet(len, wid)), m);
    veins += V(xp([0, -3], m), xp([0, -len * 0.92], m), 1.4, 0.3);
  }
  leaf("chestnut", "leafB", blade, veins);
}

/* Hêtre : ovale à pointe, bord ondulé, nervures latérales parallèles. */
{
  const left: Pt[] = [
    [50, 82, 1], [43, 80], [35.5, 75.5], [29, 68], [25.5, 59], [24, 50], [25.5, 41], [29, 32], [34, 24.5], [40, 16], [45, 9], [50, 3, 1],
  ];
  const outline = [...left, ...mirror(left, 50).slice(1, -1)];
  const blade = S(outline) + V([50, 80], [50, 98], 2.4, 2);
  let veins = V([50, 90], [50, 7], 2, 0.4);
  for (const y of [74, 65, 56, 47, 38, 29, 20]) {
    const half = y > 60 ? 18 - (y - 60) * 0.5 : y < 30 ? 6 + (y - 14) * 0.6 : 20;
    veins += V([50, y], [50 - half, y - 10], 1.1, 0.3) + V([50, y], [50 + half, y - 10], 1.1, 0.3);
  }
  leaf("beech", "leafB", blade, veins);
}

/* Feuille recroquevillée vue de profil (pour les feuilles qui tournoient). */
{
  const outer: Pt[] = [
    [18, 84, 1], [16, 70], [20, 56, 1], [25, 52], [27, 41, 1], [34, 37], [40, 26, 1], [48, 25], [57, 15, 1], [65, 17], [76, 11, 1],
    [82, 17], [92, 18, 1], [88, 24], [79, 26], [66, 30], [54, 38], [44, 50], [35, 64], [27, 78],
  ];
  const under: Pt[] = [[25, 78], [33, 62], [43, 47], [55, 35], [68, 27], [83, 23], [88, 24], [77, 29], [62, 37], [49, 50], [38, 65], [29, 80]];
  const blade = S(outer) + rib([[22, 80], [17, 90], [10, 96]], [2.6, 2.2, 2]);
  def("leafCurl", "0 0 100 100", [L(blade, "leafA"), L(S(under), "light", 0.22), L(rib([[24, 78], [40, 50], [62, 30], [86, 20]], [1.8, 1.2, 0.8, 0.3]), "shade", VEIN)]);
}

/* ═════════════════════ FRUITS, GRAINES, CHAMPIGNONS ═════════════════════ */

/* Gland : cupule écailleuse, akène luisant. viewBox 0 0 60 90 */
{
  const nut = S([[30, 30], [46, 34], [52, 48], [48, 66], [38, 80], [30, 87, 1], [22, 80], [12, 66], [8, 48], [14, 34]]);
  const cup = S([[30, 18], [46, 21], [55, 29], [56, 37], [50, 40], [40, 42], [30, 42.5], [20, 42], [10, 40], [4, 37], [5, 29], [14, 21]]);
  let scales = "";
  for (const [x, y] of [[14, 30], [24, 27], [36, 27], [46, 30], [10, 36], [20, 35], [30, 34], [40, 35], [50, 36]] as const) {
    scales += E(x, y, 3.2, 2.4);
  }
  def("acorn", "0 0 60 90", [
    L(nut, "nut"),
    L(S([[14, 48], [20, 42], [22, 52], [20, 66], [16, 64]]), "light", 0.25),
    L(rib([[30, 20], [31, 12], [35, 5]], [4.5, 3.6, 3.2]), "bark"),
    L(cup, "wood"),
    L(scales, "shade", 0.22),
  ]);
}

/* Pomme de pin : écailles en quinconce, bord festonné. viewBox 0 0 70 100 */
{
  // cœur sombre + rangées d'écailles en losange, celles du bord pointent vers l'extérieur
  const core = S([[35, 8], [50, 18], [56, 40], [52, 64], [42, 86], [35, 94, 1], [28, 86], [18, 64], [14, 40], [20, 18]]);
  let scales = "";
  let hi = "";
  const rows = 7;
  for (let r = 0; r < rows; r++) {
    const y = 18 + r * 11;
    const t = r / (rows - 1);
    const half = 9 + 17 * Math.sin(PI * (0.2 + 0.7 * t)) - 7 * t * t;
    const n = r % 2 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1; // −1 … 1
      const x = 35 + u * half;
      const w = Math.max(5, (2 * half) / n / 2 + 3);
      const m = chain(tr(x, y), ro(u * 30 - u * t * 10));
      const scl: Pt[] = [[-w, -2], [0, -5], [w, -2], [w * 0.7, 4], [0, 8.5 - t * 1.5, 1], [-w * 0.7, 4]];
      scales += xf(S(scl), m);
      hi += xf(S([[-w * 0.6, -1.5], [0, -4], [w * 0.6, -1.5], [0, 0.5]]), m);
    }
  }
  def("pinecone", "0 0 70 100", [
    L(rib([[35, 1], [35, 12]], [4, 4.6]) + core, "bark"),
    L(scales, "wood"),
    L(hi, "light", 0.22),
  ]);
}

/* Bogue de châtaigne entrouverte, deux châtaignes luisantes. viewBox 0 0 100 90 */
{
  const spiky = (cx: number, cy: number, r: number, a0: number, a1: number, n: number, spike: number, close: Pt[]): string => {
    const pts: Pt[] = [];
    for (let i = 0; i <= n * 2; i++) {
      const a = rad(a0 + ((a1 - a0) * i) / (n * 2));
      const rr = i % 2 ? r + spike : r;
      pts.push(i % 2 ? [cx + rr * Math.cos(a + 0.05), cy + rr * Math.sin(a + 0.05), 1] : [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return poly([...pts, ...close]);
  };
  const back = spiky(50, 54, 30, 185, 355, 16, 7, [[50, 54]]);
  const front = spiky(50, 50, 33, -5, 185, 18, 7, [[18, 58], [34, 66], [50, 68], [66, 66], [82, 58]]);
  const nutShape = (cx: number, cy: number, s: number, flip: number): string =>
    S([[cx, cy - 18 * s, 1], [cx + 9 * s * flip, cy - 10 * s], [cx + 14 * s * flip, cy + 2 * s], [cx + 10 * s * flip, cy + 12 * s], [cx, cy + 14 * s], [cx - 12 * s * flip, cy + 10 * s], [cx - 13 * s * flip, cy - 2 * s], [cx - 7 * s * flip, cy - 11 * s]]);
  def("chestnutHusk", "0 0 100 90", [
    L(back, "husk"),
    L(back, "shade", 0.3),
    L(nutShape(38, 44, 1, -1) + nutShape(62, 46, 1.05, 1), "nut"),
    L(E(32, 40, 2.6, 7, 25) + E(57, 41, 2.6, 7, -10), "light", 0.35),
    L(front, "husk"),
    L(S([[22, 62], [50, 70], [78, 62], [70, 78], [50, 84], [30, 78]]), "shade", 0.12),
  ]);
}

/* Bouquet de cèpes : trois chapeaux bais, pieds ventrus. viewBox 0 0 100 90 */
{
  const bolete = (cx: number, base: number, h: number, w: number, lean: number): { stalk: string; cap: string; under: string; hi: string } => {
    const top = base - h;
    const m = chain(tr(cx, base), ro(lean), tr(-cx, -base));
    const stalk = S([[cx - w * 0.22, top + h * 0.35], [cx + w * 0.2, top + h * 0.35], [cx + w * 0.34, base - h * 0.25], [cx + w * 0.26, base], [cx - w * 0.28, base], [cx - w * 0.36, base - h * 0.25]]);
    const capTop = top + h * 0.38;
    const cap = S([[cx - w * 0.55, capTop, 1], [cx - w * 0.42, top + h * 0.06], [cx, top - h * 0.04], [cx + w * 0.42, top + h * 0.06], [cx + w * 0.55, capTop, 1], [cx, capTop + h * 0.05]]);
    const under = S([[cx - w * 0.5, capTop - 0.5], [cx + w * 0.5, capTop - 0.5], [cx + w * 0.36, capTop + h * 0.07], [cx, capTop + h * 0.1], [cx - w * 0.36, capTop + h * 0.07]]);
    const hi = E(cx - w * 0.24, top + h * 0.12, w * 0.12, h * 0.05, -20);
    return { stalk: xf(stalk, m), cap: xf(cap, m), under: xf(under, m), hi: xf(hi, m) };
  };
  const a = bolete(56, 86, 70, 54, 4);
  const b = bolete(26, 88, 46, 36, -14);
  const c = bolete(83, 88, 30, 24, 16);
  def("cepes", "0 0 100 90", [
    L(b.stalk + c.stalk + a.stalk, "pale"),
    L(b.under + c.under + a.under, "leafC"),
    L(b.cap + c.cap, "cap"),
    L(b.cap + c.cap, "shade", 0.15),
    L(a.cap, "cap"),
    L(a.hi + b.hi + c.hi, "light", 0.3),
    L(S([[8, 88], [30, 82], [60, 84], [94, 86], [96, 90], [6, 90]]), "moss"),
  ]);
}

/* Amanite tue-mouches : chapeau rouge à verrues, anneau, volve. viewBox 0 0 70 90 */
{
  const stalk = S([[30, 34], [40, 34], [41, 60], [44, 76], [48, 84], [46, 89], [24, 89], [22, 84], [26, 76], [29, 60]]);
  const ring = S([[26, 50], [44, 50], [47, 56], [42, 58], [35, 56.5], [28, 58], [23, 56]]);
  const cap = S([[4, 40, 1], [8, 22], [20, 10], [35, 6], [50, 10], [62, 22], [66, 40, 1], [50, 43], [35, 44], [20, 43]]);
  const gills = S([[8, 40], [62, 40], [52, 46], [35, 47.5], [18, 46]]);
  let dots = "";
  for (const [x, y, r] of [[22, 18, 3.4], [36, 13, 2.6], [49, 19, 3.6], [13, 31, 2.6], [29, 29, 3], [44, 31, 2.4], [58, 33, 2.6], [36, 22, 1.8]] as const) {
    dots += E(x, y, r, r * 0.85);
  }
  def("amanita", "0 0 70 90", [
    L(stalk, "pale"),
    L(S([[40, 36], [41, 60], [44, 76], [47, 86], [40, 86], [37, 60], [36, 38]]), "shade", 0.14),
    L(gills, "pale"),
    L(gills, "shade", 0.22),
    L(ring, "pale"),
    L(cap, "capRed"),
    L(S([[44, 10], [58, 18], [64, 34], [56, 26]]), "shade", 0.18),
    L(dots, "pale"),
  ]);
}

/* Sorbier : corymbe de baies + feuille composée. viewBox 0 0 100 90 */
const ROWAN_BERRIES: readonly (readonly [number, number, number])[] = [
  [30, 56, 5.6], [41, 50, 6], [53, 49, 6], [64, 54, 5.6], [36, 64, 6], [48, 61, 6.2], [60, 64, 5.8], [26, 66, 5], [43, 72, 5.6],
  [55, 74, 5.4], [68, 65, 5], [33, 75, 5],
];
{
  let stems = rib([[60, 14], [52, 26], [48, 36]], [2.6, 2.2, 1.8]);
  for (const [x, y] of ROWAN_BERRIES) stems += rib([[48, 36], [(48 + x) / 2, (36 + y) / 2 - 3], [x, y]], [1.4, 1, 0.8]);
  let berries = "";
  let calyx = "";
  let hi = "";
  for (const [x, y, r] of ROWAN_BERRIES) {
    berries += E(x, y, r);
    calyx += E(x + r * 0.15, y + r * 0.45, r * 0.22);
    hi += E(x - r * 0.38, y - r * 0.38, r * 0.24);
  }
  // feuille composée pennée : rachis + 4 paires de folioles + terminale
  const leaflet = (len: number): Pt[] => [[0, 0, 1], [len * 0.16, -len * 0.3], [len * 0.12, -len * 0.75], [0, -len, 1], [-len * 0.12, -len * 0.75], [-len * 0.16, -len * 0.3]];
  let leafD = rib([[58, 16], [72, 18], [86, 22]], [1.6, 1.2, 0.6]);
  for (const [px, py, a, len] of [[64, 16.6, -55, 13], [64, 16.6, 45, 13], [72, 18, -50, 13], [72, 18, 50, 13], [79, 19.6, -45, 12], [79, 19.6, 55, 12], [86, 22, 12, 13]] as const) {
    leafD += xf(S(leaflet(len)), chain(tr(px, py), ro(a + 90)));
  }
  def("rowan", "0 0 100 90", [L(leafD, "leafA"), L(stems, "bark"), L(berries, "berry"), L(calyx, "shade", 0.5), L(hi, "light", 0.4)]);
}

/* ═════════════════════════ CITROUILLES ═════════════════════════ */

interface PumpkinSpec {
  vb: string;
  lobes: readonly (readonly [number, number, number, number, number])[]; // cx cy rx ry rang (0 = devant)
  stem: Pt[];
  stemW: number[];
  hi: string;
}

function pumpkinLayers(p: PumpkinSpec): Layer[] {
  const out: Layer[] = [];
  const depth = Math.max(...p.lobes.map((l) => l[4]));
  for (let k = depth; k >= 0; k--) {
    const d = p.lobes.filter((l) => l[4] === k).map(([cx, cy, rx, ry]) => E(cx, cy, rx, ry)).join("");
    out.push(L(d, "pumpkin"));
    if (k > 0) out.push(L(d, "shade", 0.12 * k));
  }
  out.push(L(p.hi, "light", 0.16));
  out.push(L(rib(p.stem, p.stemW), "stem"));
  return out;
}

const BIG: PumpkinSpec = {
  vb: "0 0 120 100",
  lobes: [[25, 66, 20, 27, 2], [95, 66, 20, 27, 2], [42, 64, 22, 31, 1], [78, 64, 22, 31, 1], [60, 63, 21, 33, 0]],
  stem: [[60, 34], [60, 24], [63, 15], [69, 9]],
  stemW: [9, 7.5, 6.5, 6.5],
  hi: E(51, 50, 3.5, 12, 12) + E(33, 54, 2.5, 8, 20),
};
const SMALL: PumpkinSpec = {
  vb: "0 0 100 80",
  lobes: [[30, 52, 22, 23, 1], [70, 52, 22, 23, 1], [50, 51, 22, 26, 0]],
  stem: [[50, 27], [51, 18], [55, 11]],
  stemW: [8, 6.5, 6],
  hi: E(42, 42, 3, 9, 15),
};

/* feuille de courge : 5 lobes arrondis */
const SQUASH_LEAF = S([
  [0, 0, 1], [-9, 2], [-17, -2], [-15, -9], [-21, -14], [-15, -22], [-8, -21], [-7, -30], [0, -34], [7, -30], [8, -21], [15, -22], [21, -14], [15, -9], [17, -2], [9, 2],
]);
const TENDRIL: Pt[] = [[66, 28], [74, 30], [82, 26], [83, 19], [78, 16], [74, 20], [77, 23], [80, 21]];

def("pumpkin", BIG.vb, [
  L(xf(SQUASH_LEAF, chain(tr(56, 34), ro(-58), sc(0.95))), "leafD"),
  L(xf(V([0, 0], [0, -30], 1.6, 0.3) + V([0, -8], [-15, -20], 1.2, 0.3) + V([0, -8], [15, -20], 1.2, 0.3), chain(tr(56, 34), ro(-58), sc(0.95))), "shade", VEIN),
  ...pumpkinLayers(BIG),
  L(rib(TENDRIL, [1.8, 1.6, 1.4, 1.2, 1, 0.9, 0.8, 0.3]), "stem"),
]);
def("pumpkinSmall", SMALL.vb, pumpkinLayers(SMALL));

/* lanternes : visage découpé (part « face ») en braise + cœur clair */
function face(shapes: Pt[][], m: M6): Layer[] {
  const cut = shapes.map((s) => S(s)).join("");
  const core = shapes
    .map((s) => {
      const cx = s.reduce((a, p) => a + X(p), 0) / s.length;
      const cy = s.reduce((a, p) => a + Y(p), 0) / s.length;
      return S(s.map((p): Pt => (isSharp(p) ? [cx + (X(p) - cx) * 0.62, cy + 1.2 + (Y(p) - cy) * 0.55, 1] : [cx + (X(p) - cx) * 0.62, cy + 1.2 + (Y(p) - cy) * 0.55])));
    })
    .join("");
  return [L(xf(cut, m), "glow", undefined, "face"), L(xf(core, m), "flame", 0.75, "face")];
}
const FACE: Pt[][] = [
  [[34, 56, 1], [49, 56, 1], [42, 43, 1]], // œil gauche
  [[71, 56, 1], [86, 56, 1], [78, 43, 1]], // œil droit
  [[56, 66, 1], [64, 66, 1], [60, 59, 1]], // nez
  [
    [29, 70, 1], [40, 76], [48, 77, 1], [50, 82, 1], [53, 77.5, 1], [67, 77.5, 1], [70, 82, 1], [72, 77, 1], [80, 76], [91, 70, 1],
    [86, 81], [74, 88], [64, 90, 1], [61, 85, 1], [58, 90, 1], [46, 88], [34, 81],
  ], // sourire à dents
];
def("lantern", BIG.vb, [...pumpkinLayers(BIG), ...face(FACE, [1, 0, 0, 1, 0, 0])]);
def("lanternSmall", SMALL.vb, [...pumpkinLayers(SMALL), ...face(FACE, chain(tr(50, 50), sc(0.78), tr(-60, -66)))]);

/* ═════════════════════════════ ARBRES ═════════════════════════════ */

/** branchage récursif tortueux ; renvoie un tracé (union de rubans) */
function boughs(
  seed: number,
  roots: readonly (readonly [number, number, number, number, number])[], // x y angle(°) longueur largeur
  o: { depth: number; twist: number; lift: number; spread: number; shrink: number },
): string {
  const R = rng(seed);
  let d = "";
  const grow = (x: number, y: number, a: number, len: number, w: number, k: number): void => {
    const pts: Pt[] = [[x, y]];
    let cx = x;
    let cy = y;
    let ca = a;
    const steps = k >= o.depth - 1 ? 2 : 3; // brindilles : moins de points (tracé plus léger)
    for (let i = 0; i < steps; i++) {
      ca += (R() - 0.5) * o.twist;
      const toUp = Math.atan2(Math.sin(-PI / 2 - ca), Math.cos(-PI / 2 - ca));
      ca += toUp * o.lift;
      cx += (Math.cos(ca) * len) / steps;
      cy += (Math.sin(ca) * len) / steps;
      pts.push([cx, cy]);
    }
    const last = k >= o.depth;
    const wEnd = last ? 0 : w * 0.66;
    d += rib(pts, [w, (w + wEnd) / 2 + w * 0.05, wEnd]);
    if (last) return;
    const side = R() < 0.5 ? -1 : 1;
    grow(cx, cy, ca + side * (0.12 + R() * 0.22), len * o.shrink * (0.95 + R() * 0.15), wEnd, k + 1);
    grow(cx, cy, ca - side * o.spread * (0.75 + R() * 0.5), len * o.shrink * (0.65 + R() * 0.2), wEnd * 0.78, k + 1);
    if (R() < 0.35 && k < o.depth - 1) {
      const mid = at(pts, 1);
      grow(X(mid), Y(mid), ca + side * o.spread * (0.9 + R() * 0.3), len * 0.45, w * 0.45, k + 2);
    }
  };
  for (const [x, y, a, len, w] of roots) grow(x, y, rad(a), len, w, 0);
  return d;
}

/* Arbre d'automne (jour) : houppier en masses feuillues, branches visibles entre les masses. viewBox 0 0 100 120 */
/** masse feuillue : ellipse festonnée (n festons, creux relatif `dip`) */
function lumpy(cx: number, cy: number, rx: number, ry: number, n: number, dip: number, phase = 0): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rad(phase + (i * 180) / n);
    const k = i % 2 ? 1 - dip : 1;
    pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
  }
  return S(pts, 1.25);
}
/** touffe de feuillage : trois disques serrés */
const dab = (cx: number, cy: number, r: number): string => E(cx, cy, r) + E(cx + r * 0.75, cy + r * 0.35, r * 0.72) + E(cx - r * 0.7, cy + r * 0.4, r * 0.68);
{
  const trunk =
    rib([[50, 118], [49.5, 104], [50, 92], [51, 80], [50, 70]], [12, 9.5, 8, 7, 6]) +
    rib([[49, 115], [40, 118], [32, 119.5]], [5, 2.6, 0.3]) +
    rib([[51, 115], [60, 118], [68, 119.5]], [5, 2.6, 0.3]) +
    rib([[50, 84], [42, 74], [34, 66], [28, 60]], [4.6, 3.4, 2.2, 0.3]) +
    rib([[51, 78], [60, 68], [68, 62], [74, 56]], [4.2, 3, 2, 0.3]) +
    rib([[50, 70], [48, 58], [50, 48]], [4.4, 3, 0.3]);
  def("treeAutumn", "0 0 100 120", [
    L(lumpy(50, 46, 44, 38, 11, 0.1, 8), "leafA"),
    L(lumpy(57, 56, 26, 19, 7, 0.12, 20), "shade", 0.16),
    L(trunk, "bark"),
    L(dab(31, 64, 6) + dab(70, 59, 6) + dab(52, 50, 5.5), "leafA"),
    L(dab(32, 30, 8) + dab(60, 20, 5.5) + dab(19, 48, 4.5), "leafC"),
    L(S([[47, 104], [51, 92], [53, 80], [55, 92], [54, 106], [51, 116]]), "shade", 0.22),
  ]);
}

/* Arbre nu tortueux (nuit) : tronc noueux penché, racines, branches en griffes. viewBox 0 0 120 130 */
function bareTree(seed: number): Layer[] {
  const limbs = boughs(
    seed,
    [
      [57, 80, -104, 24, 8.5],
      [55, 86, -152, 22, 6],
      [63, 82, -48, 24, 6.5],
      [60, 78, -80, 16, 5],
    ],
    { depth: 4, twist: 0.85, lift: 0.08, spread: 0.7, shrink: 0.8 },
  );
  const trunk =
    S([[40, 130], [47, 123], [50, 112], [48, 100], [52, 88], [55, 80], [62, 79], [66, 88], [64, 100], [67, 112], [72, 123], [82, 130]]) +
    rib([[48, 125], [36, 127], [24, 130]], [7, 4, 0.3]) +
    rib([[68, 125], [82, 126.5], [96, 130]], [7, 4, 0.3]);
  return [L(trunk + limbs, "bark"), L(E(58, 104, 2.6, 4.4, 8), "shade", 0.6), L(S([[61, 84], [64, 96], [63, 110], [66, 122], [60, 112], [60, 96]]), "light", 0.06)];
}
def("treeBare", "0 0 120 130", bareTree(53));

/* Branche horizontale feuillue : 4 grappes PENDANTES adressables (cluster1…4).
 * Chaque grappe a son point d'attache en HAUT-CENTRE de sa boîte : transform-origin 50% 0. viewBox 0 0 200 110 */
{
  const branch =
    rib([[0, 14], [40, 18], [90, 21], [140, 26], [176, 32], [198, 36]], [9, 7.5, 6, 4.2, 2.6, 0.3]) +
    rib([[62, 20], [76, 10], [88, 5]], [3, 1.8, 0.3]) +
    rib([[150, 28], [162, 18], [168, 12]], [2.4, 1.4, 0.3]) +
    rib([[112, 24], [124, 32], [130, 34]], [2.2, 1.2, 0.3]);
  const clusters: readonly (readonly [number, number, string, string, string, Tone, Tone, Tone])[] = [
    [38, 18, "maple", "oak", "birch", "leafA", "leafD", "leafC"],
    [88, 21, "birch", "maple", "beech", "leafC", "leafB", "leafA"],
    [136, 25, "oak", "birch", "maple", "leafA", "leafC", "leafB"],
    [178, 32, "maple", "beech", "birch", "leafB", "leafC", "leafA"],
  ];
  const layers: Layer[] = [L(branch, "bark")];
  clusters.forEach(([x, y, a, b, c, ta, tb, tc], i) => {
    const part = `cluster${i + 1}`;
    const pv = { pivot: PETIOLE, part };
    layers.push(L(rib([[x, y], [x, y + 5], [x, y + 9]], [2, 1.6, 1.4]), "bark", undefined, part));
    layers.push(...put(b, x - 2, y + 9, 26, 150, { ...pv, tones: { leafA: tb, leafB: tb, leafC: tb, leafD: tb } }));
    layers.push(...put(c, x + 2, y + 9, 24, 212, { ...pv, tones: { leafA: tc, leafB: tc, leafC: tc, leafD: tc } }));
    layers.push(...put(a, x, y + 8, 32, 180, { ...pv, tones: { leafA: ta, leafB: ta, leafC: ta, leafD: ta } }));
  });
  def("branchLeaves", "0 0 200 110", layers);
}

/* Branche nue (à croiser la lune), entre par le bord DROIT. viewBox 0 0 200 100 */
{
  const d = boughs(
    23,
    [[204, 30, 192, 58, 8]],
    { depth: 4, twist: 0.6, lift: -0.02, spread: 0.7, shrink: 0.74 },
  );
  def("branchBare", "0 0 200 100", [L(d, "bark")]);
}

/* ═════════════════════════════ FAUNE ═════════════════════════════ */

/* Écureuil assis, de profil (vers la gauche), gland entre les pattes, queue en panache. viewBox 0 0 100 100 */
{
  // panache en point d'interrogation : remonte le long du dos puis s'enroule vers l'arrière ;
  // bord « duveteux » = largeur modulée point par point
  const tailC: Pt[] = [[60, 94], [70, 93], [79, 89], [86, 82], [90, 73], [91, 63], [89, 53], [85, 44], [80, 36], [77, 27], [78, 18], [83, 11], [90, 8], [96, 10]];
  const tailW = [6, 10, 16, 19, 23, 21, 25, 23, 25, 22, 22, 17, 11, 0.3].map((w, i) => w * (i % 2 ? 1.06 : 0.94));
  const tail = rib(tailC, tailW);
  const tailIn = rib(tailC.slice(3, 12), [3, 5, 5, 6, 6, 6, 5, 4, 0.3]);
  const body =
    S([[40, 50], [50, 46], [60, 54], [68, 68], [70, 82], [64, 92], [52, 95], [40, 92], [36, 80], [36, 64]]) +
    S([[30, 30], [37, 25], [45, 27], [50, 34], [50, 44], [44, 50], [34, 50], [26, 48], [21, 44, 1], [23, 39]]) + // tête + museau
    S([[38, 28], [40, 15, 1], [46, 22], [46, 29]]) + // oreille à pinceau
    S([[34, 93], [40, 89], [58, 92], [58, 97], [36, 97, 1]]) + // pied
    rib([[42, 58], [36, 62], [30, 58]], [6, 5, 4]); // bras
  const belly = S([[34, 52], [40, 54], [42, 66], [44, 80], [40, 89], [36, 80], [34, 64]]);
  def("squirrel", "0 0 100 100", [
    L(tail, "fur", undefined, "tail"),
    L(tail, "shade", 0.16, "tail"),
    L(tailIn, "light", 0.12, "tail"),
    L(body, "fur"),
    L(belly, "furLight"),
    L(E(24, 51, 4.6, 5.6, -10), "nut"),
    L(E(24.5, 46.5, 5.4, 3, -10), "wood"),
    L(E(35, 37, 2.1) + E(21.5, 43, 1.6), "ink"),
    L(E(34.3, 36.3, 0.7), "light", 0.8),
  ]);
  reshape("squirrel", chain(tr(48, 99), sc(0.93), tr(-52, -100)));
}

/* Hérisson de profil (vers la gauche) : dôme de piquants rabattus. viewBox 0 0 100 64 */
{
  const spines = (cx: number, cy: number, rx: number, ry: number, n: number, len: number, phase: number): string => {
    const pts: Pt[] = [];
    const a0 = 192;
    const a1 = 368;
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + ((a1 - a0) * (i + phase)) / n);
      const b = rad(a0 + ((a1 - a0) * (i + phase + 0.75)) / n);
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
      pts.push([cx + (rx + len) * Math.cos(b), cy + (ry + len) * Math.sin(b), 1]);
    }
    pts.push([cx + rx * Math.cos(rad(a1)), cy + 10], [cx - rx * 0.6, cy + 12]);
    return poly(pts);
  };
  const face = S([[5, 46, 1], [14, 40], [24, 33], [33, 34], [36, 46], [32, 55], [22, 56], [12, 52]]);
  def("hedgehog", "0 0 100 64", [
    L(E(30, 58, 4, 3) + E(70, 58, 4.5, 3), "bark"),
    L(spines(58, 46, 36, 30, 22, 9, 0), "bark"),
    L(spines(60, 48, 30, 25, 18, 8, 0.5), "wood"),
    L(face, "furLight"),
    L(S([[30, 36], [36, 46], [32, 55], [26, 56], [30, 46]]), "shade", 0.15),
    L(E(5.5, 45.5, 2.8) + E(20, 42, 1.9), "ink"),
  ]);
}

/* Corbeau perché, de profil (vers la gauche). viewBox 0 0 100 90 */
{
  const bird = S([
    [6, 31, 1], [18, 24], [26, 18], [36, 15], [45, 19], [56, 28], [70, 38], [84, 50], [99, 64, 1], [90, 66], [78, 62], [66, 62],
    [54, 64], [42, 58], [32, 48], [25, 37], [18, 33],
  ]);
  const wing = S([[40, 30], [56, 32], [72, 44], [88, 60, 1], [72, 56], [54, 54], [44, 46]]);
  def("crow", "0 0 100 90", [
    L(rib([[0, 78], [50, 76], [100, 71]], [5.5, 4.5, 3.4]) + rib([[70, 74], [80, 82], [86, 88]], [2.4, 1.6, 0.3]), "bark"),
    L(rib([[50, 60], [51, 70], [52, 76]], [2.6, 2, 1.8]) + rib([[58, 60], [60, 70], [61, 75]], [2.6, 2, 1.8]), "ink"),
    L(bird, "ink"),
    L(wing, "light", 0.1),
    L(E(29, 24, 1.9), "eye"),
  ]);
}

/* Oie en vol vue DU SOL (comme dans un V migrateur) : cou tendu vers la gauche, ailes en croix.
 * Les AILES (part « wings ») battent par scaleY autour de l'axe du corps (y = 40) :
 * gooseUp = ailes déployées, gooseDown = ailes ramenées vers l'avant. viewBox 0 0 120 80 */
{
  const wingHalf = (sweep: number, span: number): Pt[] => {
    // aile supérieure ; rémiges digitées au bout
    const m = (x: number, y: number, ...f: number[]): Pt => {
      const yy = 40 - (40 - y) * span;
      const xx = x + (40 - yy) * sweep;
      return f.length ? [xx, yy, 1] : [xx, yy];
    };
    return [
      m(53, 38), m(51, 29), m(49.5, 21), m(52, 12), m(58, 4), m(63, 0.5, 1), m(64.5, 5), m(67, 3, 1), m(67.5, 9), m(69.5, 8, 1), m(69, 15), m(68.5, 24), m(67, 38),
    ];
  };
  const wings = (sweep: number, span: number): string => {
    const up = wingHalf(sweep, span);
    const down = up.map((p): Pt => (isSharp(p) ? [X(p), 80 - Y(p), 1] : [X(p), 80 - Y(p)]));
    return S(up) + S(down);
  };
  const body = E(63, 40, 25, 8.5) + S([[84, 35.5], [96, 33, 1], [93, 37], [99, 40, 1], [93, 43], [96, 47, 1], [84, 44.5]]);
  const neck = rib([[42, 40], [30, 40], [20, 40], [14, 40]], [8, 4.6, 4, 4.4]) + E(11, 40, 5, 3.6) + S([[7, 38.4], [1, 40, 1], [7, 41.6]]);
  const pose = (sweep: number, span: number): Layer[] => [
    L(body, "goose"),
    L(E(70, 42.5, 18, 3.4), "light", 0.25),
    L(wings(sweep, span), "goose", undefined, "wings"),
    L(neck, "ink"),
    L(E(12, 41.6, 2.4, 1.3), "light", 0.85),
  ];
  def("gooseUp", "0 0 120 80", pose(0.1, 1));
  def("gooseDown", "0 0 120 80", pose(-0.35, 0.55));
}

/* Hibou perché, de face : aigrettes, disque facial, YEUX et PAUPIÈRES adressables. viewBox 0 0 80 110 */
{
  const body = S([
    [13, 6, 1], [24, 15], [40, 18], [56, 15], [67, 6, 1], [69, 26], [71, 46], [68, 70], [60, 88], [48, 98], [32, 98], [20, 88], [12, 70], [9, 46], [11, 26],
  ]);
  const disc = E(27, 37, 14.5, 14) + E(53, 37, 14.5, 14);
  const eyes = E(27, 38, 9.5) + E(53, 38, 9.5);
  const pupils = E(28, 39, 4.8) + E(52, 39, 4.8);
  const glints = E(25.5, 36, 1.5) + E(49.5, 36, 1.5);
  const lid = (cx: number): string => S([[cx - 10, 34, 1], [cx - 7, 29.5], [cx, 28], [cx + 7, 29.5], [cx + 10, 34, 1], [cx, 32]]);
  let chev = "";
  for (const [x, y] of [[32, 66], [48, 66], [40, 74], [30, 80], [50, 80], [40, 87]] as const) {
    chev += S([[x - 4, y - 1.5, 1], [x, y + 1.5, 1], [x + 4, y - 1.5, 1], [x, y + 3.5]]);
  }
  def("owl", "0 0 80 110", [
    L(rib([[0, 100], [40, 99], [80, 103]], [7, 6, 5]), "bark"),
    L(body, "owl"),
    L(S([[11, 46], [18, 64], [20, 88], [14, 76], [10, 60]]) + S([[69, 46], [62, 64], [60, 88], [66, 76], [70, 60]]), "shade", 0.25),
    L(E(40, 76, 17, 20), "owlLight", 0.55),
    L(chev, "owl", 0.7),
    L(disc, "owlLight"),
    L(S([[37, 44], [40, 42], [43, 44], [40, 53, 1]]), "wood"),
    L(eyes, "eye", undefined, "eyes"),
    L(pupils, "ink", undefined, "eyes"),
    L(glints, "light", 0.9, "eyes"),
    L(lid(27) + lid(53), "owl", undefined, "lids"),
    L(E(33, 100, 4.5, 3) + E(47, 100, 4.5, 3), "wood"),
  ]);
}

/* ═════════════════════════════ HALLOWEEN ═════════════════════════════ */

/* Chauve-souris ailes déployées — AILES adressables (wingL, wingR) ; pose basse « batDown ».
 * Épaules en (55, 24) et (65, 24). viewBox 0 0 120 60 */
const BAT_WING: Pt[] = [
  [57, 22], [48, 13], [36, 7], [22, 5], [12, 7, 1], [2, 18, 1], [10, 20], [15, 28, 1], [22, 27], [29, 33, 1], [36, 31], [44, 37, 1], [50, 34], [56, 34],
];
const BAT_BODY =
  E(60, 30, 6.5, 10.5) +
  S([[54, 20], [53, 11, 1], [57, 15], [60, 14.5], [63, 15], [67, 11, 1], [66, 20], [60, 24]]) +
  S([[57, 39], [60, 46, 1], [63, 39]]);
function batLayers(angle: number, squash: number): Layer[] {
  const wl = xf(S(BAT_WING), chain(tr(56, 25), ro(angle), sc(1, squash), tr(-56, -25)));
  const wr = xf(S(mirror(BAT_WING, 60)), chain(tr(64, 25), ro(-angle), sc(1, squash), tr(-64, -25)));
  return [L(wl, "ink", undefined, "wingL"), L(wr, "ink", undefined, "wingR"), L(BAT_BODY, "ink"), L(E(57.5, 21, 1) + E(62.5, 21, 1), "eye", 0.9, "eyes")];
}
def("bat", "0 0 120 60", batLayers(0, 1));
def("batDown", "0 0 120 60", batLayers(-28, 0.85));

/* Chauve-souris suspendue tête en bas : pieds accrochés en haut, coudes des ailes repliées
 * pointés vers le haut, grandes oreilles en bas. viewBox 0 0 40 72 */
def("batHang", "0 0 40 72", [
  L(
    rib([[17, 0], [17.5, 7]], [2, 2.4]) + rib([[23, 0], [22.5, 7]], [2, 2.4]) +
      S([
        [20, 6], [26, 7], [33, 3, 1], [34, 12], [36, 24], [34, 36], [29, 46], [26, 51], [28, 58], [30, 68, 1], [23, 61], [20, 62], [17, 61],
        [10, 68, 1], [12, 58], [14, 51], [11, 46], [6, 36], [4, 24], [6, 12], [7, 3, 1], [14, 7],
      ]),
    "ink",
  ),
  L(S([[33, 4], [31, 18], [26, 34], [22, 44], [24, 30], [27, 14]]) + S([[7, 4], [9, 18], [14, 34], [18, 44], [16, 30], [13, 14]]), "light", 0.07),
  L(E(16.6, 55.5, 1.2) + E(23.4, 55.5, 1.2), "eye", 0.9, "eyes"),
]);

/* Chat noir assis, de face, queue enroulée ; YEUX adressables. viewBox 0 0 100 110 */
const CAT_BODY = S([
  [26, 6, 1], [38, 19], [50, 17.5], [62, 19], [74, 6, 1], [77, 24], [78, 34], [73, 45], [65, 51], [68, 62], [76, 78], [80, 92], [74, 104],
  [58, 106], [50, 103, 1], [42, 106], [26, 104], [20, 92], [24, 78], [32, 62], [35, 51], [27, 45], [22, 34], [23, 24],
]);
const CAT_EYES = E(40, 33, 5.2, 3.6, 12) + E(60, 33, 5.2, 3.6, -12);
const CAT_PUPILS = E(40.3, 33, 1.3, 3.2) + E(59.7, 33, 1.3, 3.2);
const CAT_HEAD_EARS = S([[29, 12], [36, 21], [32, 20]]) + S([[71, 12], [64, 21], [68, 20]]);
function catLayers(tail: string): Layer[] {
  return [
    L(tail, "ink", undefined, "tail"),
    L(CAT_BODY, "ink"),
    L(CAT_HEAD_EARS, "light", 0.08),
    L(S([[44, 70], [46, 104], [50, 103, 1], [54, 104], [56, 70], [50, 56]]), "light", 0.05),
    L(CAT_EYES, "eye", undefined, "eyes"),
    L(CAT_PUPILS, "ink", undefined, "eyes"),
  ];
}
def("cat", "0 0 100 110", catLayers(rib([[70, 102], [86, 100], [94, 88], [92, 74], [97, 64]], [8, 7, 6, 5, 3.6])));
/* Chat assis sur un REBORD (y = 106), la queue pend par-dessus. viewBox 0 0 100 150 */
def("catEdge", "0 0 100 150", catLayers(rib([[66, 102], [80, 108], [84, 120], [80, 134], [86, 146]], [9, 8, 7, 6, 4.6])));

/* Fantôme : drap mignon, ourlet ondulé ; YEUX adressables. viewBox 0 0 80 100 */
def("ghost", "0 0 80 100", [
  L(
    S([
      [40, 5], [56, 9], [66, 22], [69, 40], [76, 50], [73, 56], [70, 56], [71, 74], [75, 93, 1], [65, 86], [56, 95, 1], [47, 86], [37, 95, 1], [28, 86],
      [18, 93, 1], [11, 84], [10, 56], [6, 56], [3, 50], [11, 40], [14, 22], [24, 9],
    ]),
    "ghost",
  ),
  L(S([[56, 12], [66, 24], [69, 44], [70, 74], [74, 92], [64, 84], [62, 60], [62, 34]]), "shade", 0.1),
  L(E(26, 50, 4.5, 2.6) + E(54, 50, 4.5, 2.6), "berry", 0.25),
  L(E(31, 40, 3.6, 5.2) + E(49, 40, 3.6, 5.2), "ink", undefined, "eyes"),
  L(E(40, 52, 3, 3.6), "ink"),
]);

/* Sorcière sur son balai (vers la droite), chapeau, cape au vent. viewBox 0 0 140 90 */
def("witch", "0 0 140 90", [
  L(
    // manche (monte vers l'avant) + fagot de brindilles
    rib([[26, 66], [80, 57], [136, 47]], [3.4, 3.2, 2.8]) +
      S([[30, 61, 1], [18, 57], [4, 52, 1], [11, 59], [1, 63, 1], [11, 66], [4, 74, 1], [18, 69], [30, 71, 1]]) +
      // cape au vent, trois pointes
      S([[94, 29], [80, 26], [66, 25], [52, 21, 1], [60, 30], [48, 35, 1], [60, 38], [53, 46, 1], [68, 43], [82, 48], [88, 42]]) +
      // buste penché en avant
      S([[84, 56], [82, 45], [86, 35], [92, 29.5], [99, 30.5], [103, 37], [101, 47], [98, 56]]) +
      // bras tendu, main sur le manche
      rib([[99, 34], [106, 42], [113, 50]], [6, 4.6, 3.6]) + E(114, 51, 2.8, 2.3) +
      // jambe et bottine pointue
      rib([[86, 55], [98, 57.5], [101, 63], [101, 69]], [8, 6.4, 5.2, 5]) +
      S([[97, 67.5], [106, 67.5], [112, 67.5], [117, 64, 1], [115, 70], [106, 73], [97, 73]]) +
      // tête de profil, nez et menton pointus
      E(98, 22.5, 5, 5.6) + S([[102, 20], [109.5, 24, 1], [102, 25.5]]) + S([[100, 26], [104, 29.5, 1], [97.5, 28.5]]) +
      // chapeau : large bord incliné + cône à pointe cassée vers l'arrière
      E(97, 16.5, 15.5, 2.4, -8) + S([[89, 16.5], [91, 9], [88, 4], [79, 0.6, 1], [89, 2.6], [96, 6], [99.5, 15]]) +
      // mèches au vent
      S([[94, 19], [84, 20], [73, 19, 1], [82, 23], [75, 28, 1], [86, 26], [93, 27]]),
    "ink",
  ),
  L(E(104, 22, 0.9), "eye", 0.9),
  L(rib([[28.6, 59.5], [29.4, 72.5]], [3.4, 3.4]) + S([[60, 29], [74, 29], [84, 33], [70, 33]]), "light", 0.08),
]);

/* Araignée suspendue à son fil — FIL (thread, origine en haut) et ARAIGNÉE (spider) adressables. viewBox 0 0 60 100 */
{
  let legs = "";
  for (const s of [-1, 1]) {
    for (const [ky, ty, kx, tx] of [[54, 42, 12, 20], [58, 54, 16, 26], [62, 70, 15, 25], [64, 82, 10, 18]] as const) {
      legs += rib([[30 + s * 4, ky - 2], [30 + s * kx, ky - 8 + (ty - ky) * 0.2], [30 + s * tx, ty]], [2, 1.6, 0.3]);
    }
  }
  def("spider", "0 0 60 100", [
    L(rib([[30, 0], [30, 50]], [1.1, 1.1]), "web", 0.85, "thread"),
    L(legs + E(30, 54, 5.5, 5) + E(30, 68, 9, 11), "ink", undefined, "spider"),
    L(E(27.5, 53, 1) + E(32.5, 53, 1), "eye", 0.9, "spider"),
    L(E(27, 64, 2.4, 3.4, 20), "light", 0.1, "spider"),
  ]);
}

/* Toile d'araignée de COIN (coin haut-droit du viewBox = coin de la carte). viewBox 0 0 100 100 */
{
  const C: Pt = [100, 0];
  const angles = [90, 105, 120, 135, 150, 165, 180];
  const ray = (a: number, r: number): Pt => [100 + r * Math.cos(rad(a)), r * Math.sin(rad(a))];
  let d = "";
  for (const a of angles) d += V(C, ray(a, 98), 1.3, 0.9);
  for (const r of [16, 30, 45, 61, 78]) {
    for (let i = 0; i < angles.length - 1; i++) {
      const a0 = at(angles, i);
      const a1 = at(angles, i + 1);
      const p0 = ray(a0, r);
      const p1 = ray(a1, r);
      const m = ray((a0 + a1) / 2, r * 0.9);
      d += rib([p0, m, p1], [1, 0.9, 1]);
    }
  }
  def("webCorner", "0 0 100 100", [L(d, "web", 0.8)]);
}

/* Bougie : cire coulée, mèche, FLAMME et HALO adressables. viewBox 0 0 40 100 */
def("candle", "0 0 40 100", [
  L(E(20, 28, 19) , "glow", 0.08, "halo"),
  L(E(20, 29, 11.5), "glow", 0.12, "halo"),
  L(E(20, 95, 17, 4.5), "bark"),
  L(S([[10, 46], [14, 44.5], [20, 46], [26, 44.5], [30, 46], [30, 94, 1], [10, 94, 1]]) + rib([[12.5, 46], [12, 52], [12.6, 58]], [4, 3.6, 3]) + rib([[26, 46], [27, 50]], [3.4, 3.2]), "wax"),
  L(S([[24, 47], [30, 46], [30, 94, 1], [24, 94, 1]]), "shade", 0.12),
  L(rib([[20, 38], [20, 46]], [1.6, 1.6]), "ink"),
  L(S([[20, 12, 1], [24.5, 25], [24, 33], [20, 37], [16, 33], [15.5, 25]]), "glow", undefined, "flame"),
  L(S([[20, 22, 1], [22.4, 29], [20, 34], [17.6, 29]]), "flame", undefined, "flame"),
]);

/* ═════════════════════════════ CIEL ═════════════════════════════ */

/* Lune : HALO adressable (2 anneaux doux) + disque + cratères. viewBox 0 0 100 100 */
def("moon", "0 0 100 100", [
  L(E(50, 50, 48), "moon", 0.06, "halo"),
  L(E(50, 50, 39), "moon", 0.1, "halo"),
  L(E(50, 50, 30), "moon"),
  L(E(40, 40, 7, 6) + E(60, 58, 9, 7.5) + E(58, 34, 3.6) + E(37, 61, 4.2) + E(66, 45, 2.6), "shade", 0.1),
  L(S([[34, 30], [44, 24], [36, 36], [28, 48], [26, 42]]), "light", 0.35),
]);

/* Étoile scintillante à 4 branches. viewBox 0 0 20 20 */
def("star", "0 0 20 20", [
  L(S([[10, 0, 1], [11.6, 8.4], [20, 10, 1], [11.6, 11.6], [10, 20, 1], [8.4, 11.6], [0, 10, 1], [8.4, 8.4]], 0.5), "star"),
]);
/* Étoile à 5 branches arrondies. viewBox 0 0 20 20 */
{
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = rad(-90 + i * 36);
    const r = i % 2 ? 4.2 : 9.6;
    pts.push([10 + r * Math.cos(a), 10.6 + r * Math.sin(a)]);
  }
  def("star5", "0 0 20 20", [L(S(pts, 0.35), "star")]);
}

/* ═════════════════════════ ORNEMENTS DE CARTE ═════════════════════════
 * viewBox 0 0 100 100 ; `anchor` = point à poser sur le coin haut-droit de la carte. */

const A_CORNER: readonly [number, number] = [80, 20];
const tone1 = (t: Tone): Partial<Record<Tone, Tone>> => ({ leafA: t, leafB: t, leafC: t, leafD: t });
/** feuille dont le pétiole part du moyeu (hx, hy) ; rot 0 = pointe en haut, −90 = vers la gauche, 180 = vers le bas */
const spray = (name: string, hx: number, hy: number, h: number, rot: number, t: Tone): Layer[] =>
  put(name, hx, hy, h, rot, { pivot: PETIOLE, tones: tone1(t) });

/** agrandit une composition autour de son ancre */
const zoom = (ls: Layer[], k: number, c: readonly [number, number] = A_CORNER): Layer[] =>
  ls.map((l) => ({ ...l, d: xf(l.d, chain(tr(c[0], c[1]), sc(k), tr(-c[0], -c[1]))) }));

def(
  "ornLeavesAcorn",
  "0 0 100 100",
  zoom(
    [
      ...spray("oak", 84, 16, 54, -92, "leafD"),
      ...spray("birch", 84, 16, 46, -178, "leafC"),
      ...spray("maple", 84, 16, 62, -135, "leafA"),
      ...put("acorn", 78, 25, 26, 32),
      ...put("acorn", 89, 27, 23, -14),
    ],
    1.28,
  ),
  A_CORNER,
);
def(
  "ornPumpkin",
  "0 0 100 100",
  zoom([...spray("maple", 82, 18, 54, -100, "leafB"), ...spray("oak", 82, 18, 46, -172, "leafD"), ...put("pumpkinSmall", 64, 38, 40)], 1.3),
  A_CORNER,
);
def(
  "ornCepes",
  "0 0 100 100",
  zoom([...spray("beech", 84, 16, 50, -104, "leafA"), ...spray("maple", 84, 16, 40, -166, "leafC"), ...put("cepes", 62, 40, 46)], 1.3),
  A_CORNER,
);
def(
  "ornPinecone",
  "0 0 100 100",
  zoom([...spray("oak", 86, 14, 54, -98, "leafA"), ...spray("birch", 86, 14, 44, -160, "leafC"), ...put("pinecone", 68, 40, 48, 38)], 1.25),
  A_CORNER,
);
def("ornRowan", "0 0 100 100", zoom(put("rowan", 90, 8, 78, 22, { pivot: [60, 14] }), 1.2), A_CORNER);

def(
  "ornLantern",
  "0 0 100 100",
  zoom([...spray("maple", 80, 20, 48, -108, "leafB"), ...spray("oak", 80, 20, 40, -170, "leafD"), ...put("lanternSmall", 64, 40, 44, 0, { keepParts: true })], 1.2),
  A_CORNER,
);
def("ornWeb", "0 0 100 100", [...put("webCorner", 50, 50, 100), ...put("spider", 66, 33, 66, 0, { pivot: [30, 0], keepParts: true })], [100, 0]);
/* chat assis SUR le bord supérieur de la carte (y = 66,5), la queue pend par-dessus */
def("ornCat", "0 0 100 100", put("catEdge", 58, 50, 80, 0, { keepParts: true }), [86, 66.5]);
/* chauve-souris pendue SOUS le bord supérieur (y = 18) ; part « bat » : transform-origin 50% 0 */
def("ornBat", "0 0 100 100", put("batHang", 64, 18, 56, 0, { pivot: [20, 0], part: "bat" }), [84, 18]);
/* hibou perché sur le bord supérieur (y ≈ 66) */
def("ornOwl", "0 0 100 100", put("owl", 60, 40, 64, 0, { keepParts: true }), [86, 66]);

/* Guirlande horizontale RÉPÉTABLE (bord gauche = bord droit), ~24 px de haut. viewBox 0 0 240 24 */
{
  const vine: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const x = -4 + (248 * i) / 16;
    vine.push([x, 6 + 2.4 * Math.sin((2 * PI * 2 * x) / 240)]);
  }
  const yAt = (x: number): number => 6 + 2.4 * Math.sin((2 * PI * 2 * x) / 240);
  const layers: Layer[] = [L(rib(vine, [1.6]), "bark")];
  const kinds = ["maple", "oak", "birch", "beech", "maple", "ginkgo", "oak", "birch", "maple", "beech", "oak", "birch"];
  const tones: Tone[] = ["leafA", "leafD", "leafC", "leafB", "leafC", "leafC", "leafA", "leafB", "leafB", "leafA", "leafC", "leafD"];
  kinds.forEach((k, i) => {
    const x = 11 + i * 19.8;
    const rot = 180 + (i % 2 ? 16 : -16) + ((i * 7) % 5) - 2;
    layers.push(...put(k, x, yAt(x), 19, rot, { pivot: PETIOLE, tones: tone1(at(tones, i)), noVeins: true }));
  });
  for (const x of [60.5, 179.3]) {
    const y = yAt(x);
    layers.push(L(E(x - 2.4, y + 6, 2.2) + E(x + 2.2, y + 5, 2.2) + E(x, y + 9, 2.2), "berry"));
  }
  def("garland", "0 0 240 24", layers);
}

/* ───────────────────────────── API ───────────────────────────── */

export const MOTIFS: Record<string, Motif> = M;
export const ORNAMENTS_JOUR: readonly string[] = ["ornLeavesAcorn", "ornPumpkin", "ornCepes", "ornPinecone", "ornRowan"];
export const ORNAMENTS_NUIT: readonly string[] = ["ornLantern", "ornWeb", "ornCat", "ornBat", "ornOwl"];

const esc = (s: string): string => s.replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Chaîne SVG autonome (viewBox seul : le conteneur fixe la taille).
 * - parts "all" (défaut) : tout ; "static" : sans les sous-parties ; ["eyes", …] : SEULEMENT ces parties.
 * - chaque sous-partie est enveloppée dans <g data-part="nom" class="part-nom">.
 */
export function svg(name: string, palette: Palette, opts: { parts?: "all" | "static" | string[]; className?: string } = {}): string {
  const m = MOTIFS[name];
  if (!m) throw new Error(`motif inconnu : ${name}`);
  const parts = opts.parts ?? "all";
  const keep = (l: Layer): boolean =>
    parts === "all" ? true : parts === "static" ? l.part === undefined : l.part !== undefined && parts.includes(l.part);
  let body = "";
  let open: string | undefined;
  for (const l of m.layers) {
    if (!keep(l)) continue;
    if (l.part !== open) {
      if (open !== undefined) body += "</g>";
      if (l.part !== undefined) body += `<g data-part="${esc(l.part)}" class="part-${esc(l.part)}">`;
      open = l.part;
    }
    body += `<path fill="${palette[l.tone]}"${l.opacity !== undefined ? ` opacity="${l.opacity}"` : ""} d="${l.d}"/>`;
  }
  if (open !== undefined) body += "</g>";
  const cls = opts.className ? ` class="${esc(opts.className)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox}"${cls}>${body}</svg>`;
}

/** URI `data:` pour CSS — à employer entre GUILLEMETS DOUBLES : `url("${dataUri(s)}")`. */
export function dataUri(svgString: string): string {
  const s = svgString.replace(/"/g, "'").replace(/\s+/g, " ").trim();
  return "data:image/svg+xml," + s.replace(/[%#<>?[\\\]^`{|}()"\n\r]/g, (c) => "%" + ("0" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-2));
}
