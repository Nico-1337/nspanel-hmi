/**
 * render-theme.ts — rend les images d'un thème dans `themes/<theme>/` :
 *   • les SOURCES attendues par `hmi/dev/pics` de NSPanel Easy (mêmes noms de fichiers),
 *     copiées par-dessus le dépôt amont avant `generate_images.sh` ;
 *   • `overrides/<slot>.png` : slots que `mapping.yaml` ne sait pas varier jour/nuit
 *     (une seule source pour les deux fonds), recomposés ici et écrasés après génération ;
 *   • `palette.json` : couleurs de texte RGB565 à reporter dans les substitutions ESPHome.
 *
 * Usage : node scripts/render-theme.ts [octobre|novembre]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPng, compose } from "./lib.ts";
import * as octobre from "./themes/octobre.ts";
import * as novembre from "./themes/novembre.ts";

const THEMES = { octobre, novembre } as const;
const name = (process.argv[2] ?? "octobre") as keyof typeof THEMES;
const theme = THEMES[name];
if (!theme) throw new Error(`thème inconnu : ${name}`);

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "themes", name);
const src = join(root, "pics");
mkdirSync(src, { recursive: true });

renderPng(theme.backgroundDark(), join(src, "background", "background_dark_landscape.png"));
renderPng(theme.backgroundLight(), join(src, "background", "background_light_landscape.png"), { dither: false });
renderPng(theme.backgroundSplash(), join(src, "background", "background_splash_landscape.png"));
renderPng(theme.tileActive(), join(src, "buttons_pages", "buttons_pages_background_active_landscape.png"), { keepAlpha: true });
renderPng(theme.tileInactiveDark(), join(src, "buttons_pages", "buttons_pages_background_innactive_landscape.png"), { keepAlpha: true });

// Slot 79 = tuile éteinte sur fond CLAIR (mapping amont : même source que la nuit). On la recompose.
const lightBg = theme.backgroundLight().replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const tileLight = theme.tileInactiveLight().replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
renderPng(compose(lightBg + tileLight), join(root, "overrides", "79.png"), { dither: false });

writeFileSync(join(root, "palette.json"), JSON.stringify({ text: theme.TEXT, rgb565: theme.textRgb565 }, null, 2) + "\n");
console.log(`thème ${name} rendu dans ${root}`);
