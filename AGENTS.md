# AGENTS.md — nspanel-hmi

## But

Habillage du HMI Nextion de NSPanel Easy (Sonoff NSPanel EU, paysage) : on garde pages, objets et macros amont et on
remplace uniquement les images (fonds jour/nuit, splash, tuiles) par des thèmes saisonniers (`octobre`, `novembre`).

## Carte des fichiers

| Fichier | Rôle |
| --- | --- |
| `package.json` | Scripts `render` / `preview`, dépendances : `@resvg/resvg-js` (SVG → pixels), `pngjs`, `@mdi/js` (icônes des maquettes). `"type": "module"`. |
| `scripts/lib.ts` | Constantes `W=480`, `H=320`, `VISIBLE_W=450` ; `place()` (pose un motif d'octobre par son pied), `compose()`, `rng()` (graine fixe), `rgb565()`, `renderPng()` (rendu + quantification RGB565, Floyd-Steinberg optionnel). |
| `scripts/render-theme.ts` | Rend un thème dans `themes/<thème>/` : `pics/` (sources sous les noms amont), `overrides/79.png`, `palette.json`. |
| `scripts/render-preview.ts` | Maquettes 450×320 par pièce et par moment, à partir de `themes/<thème>/dist/slots/*.png` et de la géométrie du HMI amont relevée à la main (positions codées en dur). Sortie `themes/<thème>/dist/preview/`. |
| `scripts/themes/octobre.ts` | Thème octobre : `TEXT`, `textRgb565`, `backgroundDark/Light/Splash()`, `tileActive()`, `tileInactiveDark/Light()`. |
| `scripts/themes/novembre.ts` | Thème novembre, même interface. `TEXT` volontairement IDENTIQUE à octobre. |
| `scripts/art/octobre-art.ts` | Bibliothèque de motifs tonnés (`MOTIFS`, palettes `JOUR` / `NUIT`, `svg(nom, palette)`). Repris de l'application des écrans muraux. |
| `scripts/art/novembre-art.ts` | Dessins de la Saint-Martin en SVG brut, une fonction par motif ; n'importe rien d'octobre. Même origine. |
| `build.sh` | Dans WSL. `images` : clone NSPanel Easy au tag, `generate_images.sh landscape`, overrides, trous comblés par `placeholder.png` → `dist/slots/`. `tft` : Nextion Editor 1.68.2 sous Wine dans `sztupy/nextion-scripts` → `dist/nspanel_landscape.tft` + `.hmi`. |
| `nextion/UpdateImagesFixed.ahk` | Supprime puis réimporte les images `C:\pics\0..N`, sauvegarde, exporte le TFT. Dérivé de `UpdateImages.ahk` (sztupy/nextion-editor-docker) + `WinActivate` avant chaque séquence clavier. |
| `nextion/CompileFixed.ahk` | Sauvegarde le HMI ouvert et l'exporte en TFT, même correctif. |
| `nextion/compile-in-container.sh` | Exécuté dans le conteneur : compile `input.hmi` tel quel (sans réimport d'images). `DEBUG=1` : captures d'écran. |
| `scripts/esphome_ingress.py` | Client du Device Builder ESPHome via l'ingress HA : `get <chemin>`, `run <yaml>` (ancien `/run`), `install <yaml>` (websocket `/ws`, `firmware/install` + `firmware/follow_job`, OTA), `ws <commande> '<json>'`. |
| `scripts/builder_jobs.py` | Liste les 4 derniers jobs du Device Builder ; `[job_id]` affiche les 40 dernières lignes de sortie. |
| `scripts/hmi_patch.py` | Réécrit en place des attributs entiers (x, y, w, h, font, pco…) d'objets d'un `.hmi`, sur leur largeur d'origine. Nécessite un dossier Nextion2Text (non fourni). |
| `scripts/hmi_crc_search.py` | Outil de recherche : essaie des variantes de CRC32 pour retrouver le CRC de page d'un `.hmi`. Nécessite Nextion2Text. |
| `docs/preview/*.png` | Maquettes publiées du thème octobre (sorties de `render-preview.ts`). |
| `themes/` | Généré, absent du dépôt ; `themes/*/dist/` est ignoré par git. |

## Flux de données

```
scripts/art/*.ts → scripts/themes/<t>.ts (SVG 480×320) → lib.renderPng (RGB565)
  → themes/<t>/pics/{background,buttons_pages}/*.png + overrides/79.png + palette.json
  → build.sh images : copie sur hmi/dev/pics amont → generate_images.sh landscape → slots 0..N
  → themes/<t>/dist/slots/ → render-preview.ts (maquettes)
  → build.sh tft : slots → C:\pics dans le conteneur → UpdateImagesFixed.ahk → .tft
```

Fichiers sources écrits par `render-theme.ts` (noms imposés par l'amont, y compris la faute `innactive`) :
`background/background_dark_landscape.png`, `background/background_light_landscape.png`,
`background/background_splash_landscape.png`, `buttons_pages/buttons_pages_background_active_landscape.png`,
`buttons_pages/buttons_pages_background_innactive_landscape.png`.

## Commandes

```sh
npm install                                  # Node ≥ 22.18 (exécution directe des .ts, syntaxe effaçable seulement)
node scripts/render-theme.ts octobre         # ou novembre ; défaut octobre
bash build.sh octobre images                 # WSL : Docker, ImageMagick, python3-yaml, git
node scripts/render-preview.ts octobre       # exige dist/slots (étape précédente)
bash build.sh octobre tft                    # exige l'étape images (lit ~/nspanel/work-<t>/last_slot)
bash build.sh octobre                        # images + tft
PYTHONIOENCODING=utf-8 python scripts/esphome_ingress.py install <panneau>.yaml   # pip install websockets
python scripts/builder_jobs.py [job_id]
python3 scripts/hmi_patch.py <in.hmi> <out.hmi> <Nextion2Text_dir> <patch.json>
```

Caches de `build.sh` : `~/nspanel/upstream-<UPSTREAM_TAG>` (clone amont, réutilisé), `~/nspanel/work-<thème>`.

## Variables d'environnement

| Variable | Défaut | Utilisée par |
| --- | --- | --- |
| `UPSTREAM_TAG` | `v2026.10.7` | `build.sh` : tag de NSPanel Easy cloné. Doit être la version flashée. |
| `HA_HOST` | `homeassistant.local:8123` | `esphome_ingress.py`, `builder_jobs.py` (hôte:port, sans schéma ; `http`/`ws` en clair). |
| `HA_TOKEN` | — | Jeton longue durée HA. À défaut, lu dans la variable utilisateur Windows via `powershell`. |
| `ESPHOME_SLUG` | `5c53de3b_esphome-dev` | Slug de l'add-on ESPHome dont on ouvre l'ingress. |
| `DEBUG` | — | `nextion/compile-in-container.sh` : captures d'écran du conteneur. |

## Conventions

- Commentaires et messages en français. TypeScript strict de fait (`!` non nul, `as const`), modules ES, imports
  avec extension `.ts`, aucune étape de compilation : n'utiliser que de la syntaxe TypeScript effaçable (pas
  d'`enum`, pas de `namespace`, pas de propriétés de paramètres).
- Python : scripts courts, bibliothèque standard + `websockets`, pas de dépendances ajoutées sans raison.
- Dessins : positions aléatoires toujours via `rng(graine)` pour des builds reproductibles.
- Un thème exporte exactement : `TEXT`, `textRgb565`, `backgroundDark`, `backgroundLight`, `backgroundSplash`,
  `tileActive`, `tileInactiveDark`, `tileInactiveLight`. Un nouveau thème s'enregistre dans `THEMES` de
  `render-theme.ts` ET de `render-preview.ts`.

## Invariants à ne pas casser

- Images 480×320 ; les 30 px de droite sont masqués sur le NSPanel EU (`VISIBLE_W = 450`) : rien d'utile au-delà.
  Les maquettes font 450×320.
- Sortie RGB565 : `renderPng` quantifie R/B sur 5 bits, G sur 6. Fonds sombres et splash tramés ; fond clair et
  slot 79 avec `{ dither: false }` (le tramage y fait des stries). Tuiles en `keepAlpha` (pixels transparents non
  tramés, composités plus tard par l'amont).
- Tous les textes du HMI découpent leur fond dans l'image (« crop image ») : décor franc seulement dans les coins bas
  (x < 78 et x > 380) et au centre de l'accueil ; ailleurs, faible contraste. Libellés des boutons physiques à
  x 47-167 et 288-408, y ≈ 288-315.
- Ambre `#ff9800` = signal « allumé ». Aucun décor ne doit s'en approcher ; seule la tuile active (`#fbbd63`) est ambre.
- Positions des 8 tuiles : `[17,45] [124,45] [231,45] [338,45] [17,176] [124,176] [231,176] [338,176]`, 100×100,
  rayon 18 (positions du HMI officiel).
- Numérotation des slots (mapping amont, version taguée) : fond nuit = 0, fond jour = 48, tuile éteinte nuit = 46,
  tuile active nuit = 47, tuile éteinte jour = 79 (surchargée par `overrides/79.png`), tuile active jour = 80,
  météo « partiellement nuageux » nuit = 12, jour = 59. Toute nouvelle version amont peut renuméroter : vérifier.
- `TEXT` identique entre thèmes : la palette est compilée dans le firmware (substitutions `THEME_*_COLOR_PCO_*`),
  alors que le TFT se téléverse depuis une URL. La changer impose une recompilation ESPHome de chaque panneau.
- Texte des tuiles codé en dur dans l'ESPHome amont : blanc sur tuile éteinte, gris foncé sur tuile allumée. Les
  tuiles éteintes doivent rester assez sombres, de jour comme de nuit.
- `build.sh` vide `dist/slots` fichier par fichier au lieu de `rm -rf` le dossier (un explorateur Windows ouvert le
  bloquerait) : garder ce comportement.

## Pièges connus

- TFT d'une autre version que le firmware → « Version mismatch ». `UPSTREAM_TAG` = version flashée.
- Un firmware dont le TFT est plus ancien que celui qu'il exige téléverse seul `nextion_update_url` au redémarrage :
  publier le TFT avant de flasher.
- AHK amont sans `WinActivate` : « Could not find element AutomationId=buttonX2 AND Name=Output ».
- `render-preview.ts` : géométrie relevée sur le HMI v2026.10.6, polices système (Segoe UI) au lieu des polices du
  HMI. Si l'amont déplace des objets, les maquettes mentent.
- `lib.ts` n'importe que `octobre-art.ts` : `place()` ne connaît que les motifs d'octobre ; novembre a son propre
  `foot()`.
- `esphome_ingress.py` : protocole du Device Builder 2026.11 pour `install`/`ws` ; `run` vise l'ancienne API.

## Ne jamais commiter

- Jetons (`HA_TOKEN`), mots de passe, clés.
- Adresses IP, noms d'hôte ou de domaine d'une maison réelle, slugs ou URL internes autres que les défauts génériques.
- Prénoms réels, noms de pièces ou d'appareils personnels dans `render-preview.ts` et dans les maquettes publiées ;
  utiliser des libellés génériques ou les prénoms fictifs ALEX et SAM.
- Photos de personnes, captures d'un vrai tableau de bord.
- `themes/` généré, `node_modules/`, TFT et HMI compilés (ils embarquent le HMI amont).

## Vérifier un changement

1. `node scripts/render-theme.ts octobre` (et `novembre`) : doit finir par « thème … rendu dans … » sans exception.
2. Dans WSL : `bash build.sh octobre images` → « images : slots 0..N → … ».
3. `node scripts/render-preview.ts octobre` → « N maquettes dans … » ; ouvrir les PNG jour ET nuit, contrôler la
   lisibilité des textes et l'absence d'ambre hors tuile active.
4. Pour un TFT : `bash build.sh octobre tft`, puis tester sur un panneau avant de publier.
