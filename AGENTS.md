# AGENTS.md — nspanel-hmi

## Purpose

Reskin of the NSPanel Easy Nextion HMI (Sonoff NSPanel EU, landscape): the upstream pages, objects and macros are
kept and only the images (day/night backgrounds, splash, tiles) are replaced by seasonal themes (`octobre`, `novembre`).

## File map

| File | Role |
| --- | --- |
| `package.json` | `render` / `preview` scripts, dependencies: `@resvg/resvg-js` (SVG → pixels), `pngjs`, `@mdi/js` (mockup icons). `"type": "module"`. |
| `scripts/lib.ts` | Constants `W=480`, `H=320`, `VISIBLE_W=450`; `place()` (places an October motif by its base), `compose()`, `rng()` (fixed seed), `rgb565()`, `renderPng()` (render + RGB565 quantization, optional Floyd-Steinberg). |
| `scripts/render-theme.ts` | Renders a theme into `themes/<theme>/`: `pics/` (sources under the upstream names), `overrides/79.png`, `palette.json`. |
| `scripts/render-preview.ts` | 450×320 mockups per room and per time of day, from `themes/<theme>/dist/slots/*.png` and the upstream HMI geometry measured by hand (hard-coded positions). Output `themes/<theme>/dist/preview/`. |
| `scripts/themes/octobre.ts` | October theme: `TEXT`, `textRgb565`, `backgroundDark/Light/Splash()`, `tileActive()`, `tileInactiveDark/Light()`. |
| `scripts/themes/novembre.ts` | November theme, same interface. `TEXT` deliberately IDENTICAL to October. |
| `scripts/art/octobre-art.ts` | Library of toned motifs (`MOTIFS`, `JOUR` / `NUIT` palettes, `svg(nom, palette)`). Taken from the wall screens app. |
| `scripts/art/novembre-art.ts` | St. Martin's Day drawings in raw SVG, one function per motif; imports nothing from October. Same origin. |
| `build.sh` | In WSL. `images`: clones NSPanel Easy at the tag, `generate_images.sh landscape`, overrides, gaps filled with `placeholder.png` → `dist/slots/`. `tft`: Nextion Editor 1.68.2 under Wine in `sztupy/nextion-scripts` → `dist/nspanel_landscape.tft` + `.hmi`. |
| `nextion/UpdateImagesFixed.ahk` | Deletes then re-imports the images `C:\pics\0..N`, saves, exports the TFT. Derived from `UpdateImages.ahk` (sztupy/nextion-editor-docker) + `WinActivate` before each key sequence. |
| `nextion/CompileFixed.ahk` | Saves the open HMI and exports it as TFT, same fix. |
| `nextion/compile-in-container.sh` | Runs in the container: compiles `input.hmi` as is (no image re-import). `DEBUG=1`: screenshots. |
| `scripts/esphome_ingress.py` | Client for the ESPHome Device Builder through the HA ingress: `get <path>`, `run <yaml>` (old `/run`), `install <yaml>` (websocket `/ws`, `firmware/install` + `firmware/follow_job`, OTA), `ws <command> '<json>'`. |
| `scripts/builder_jobs.py` | Lists the last 4 Device Builder jobs; `[job_id]` shows the last 40 lines of output. |
| `scripts/hmi_patch.py` | Rewrites whole attributes (x, y, w, h, font, pco…) of objects in a `.hmi` in place, on their original width. Requires a Nextion2Text folder (not provided). |
| `scripts/hmi_crc_search.py` | Research tool: tries CRC32 variants to find the page CRC of a `.hmi`. Requires Nextion2Text. |
| `docs/preview/*.png` | Published mockups of the October theme (outputs of `render-preview.ts`). |
| `themes/` | Generated, not in the repository; `themes/*/dist/` is ignored by git. |

## Data flow

```
scripts/art/*.ts → scripts/themes/<t>.ts (SVG 480×320) → lib.renderPng (RGB565)
  → themes/<t>/pics/{background,buttons_pages}/*.png + overrides/79.png + palette.json
  → build.sh images: copy onto upstream hmi/dev/pics → generate_images.sh landscape → slots 0..N
  → themes/<t>/dist/slots/ → render-preview.ts (mockups)
  → build.sh tft: slots → C:\pics in the container → UpdateImagesFixed.ahk → .tft
```

Source files written by `render-theme.ts` (names imposed by upstream, including the `innactive` typo):
`background/background_dark_landscape.png`, `background/background_light_landscape.png`,
`background/background_splash_landscape.png`, `buttons_pages/buttons_pages_background_active_landscape.png`,
`buttons_pages/buttons_pages_background_innactive_landscape.png`.

## Commands

```sh
npm install                                  # Node ≥ 22.18 (runs .ts directly, erasable syntax only)
node scripts/render-theme.ts octobre         # or novembre; default octobre
bash build.sh octobre images                 # WSL: Docker, ImageMagick, python3-yaml, git
node scripts/render-preview.ts octobre       # needs dist/slots (previous step)
bash build.sh octobre tft                    # needs the images step (reads ~/nspanel/work-<t>/last_slot)
bash build.sh octobre                        # images + tft
PYTHONIOENCODING=utf-8 python scripts/esphome_ingress.py install <panel>.yaml   # pip install websockets
python scripts/builder_jobs.py [job_id]
python3 scripts/hmi_patch.py <in.hmi> <out.hmi> <Nextion2Text_dir> <patch.json>
```

`build.sh` caches: `~/nspanel/upstream-<UPSTREAM_TAG>` (upstream clone, reused), `~/nspanel/work-<theme>`.

## Environment variables

| Variable | Default | Used by |
| --- | --- | --- |
| `UPSTREAM_TAG` | `v2026.10.7` | `build.sh`: NSPanel Easy tag to clone. Must be the flashed version. |
| `HA_HOST` | `homeassistant.local:8123` | `esphome_ingress.py`, `builder_jobs.py` (host:port, no scheme; plain `http`/`ws`). |
| `HA_TOKEN` | — | HA long-lived token. If unset, read from the Windows user variable through `powershell`. |
| `ESPHOME_SLUG` | `5c53de3b_esphome-dev` | Slug of the ESPHome add-on whose ingress is opened. |
| `DEBUG` | — | `nextion/compile-in-container.sh`: screenshots of the container. |

## Conventions

- Comments and messages in French. TypeScript strict in practice (`!` non-null, `as const`), ES modules, imports
  with the `.ts` extension, no compilation step: only use erasable TypeScript syntax (no `enum`, no `namespace`, no
  parameter properties).
- Python: short scripts, standard library + `websockets`, no dependencies added without a reason.
- Drawings: random positions always through `rng(seed)` for reproducible builds.
- A theme exports exactly: `TEXT`, `textRgb565`, `backgroundDark`, `backgroundLight`, `backgroundSplash`,
  `tileActive`, `tileInactiveDark`, `tileInactiveLight`. A new theme is registered in `THEMES` of
  `render-theme.ts` AND of `render-preview.ts`.

## Invariants not to break

- Images 480×320; the 30 px on the right are hidden on the NSPanel EU (`VISIBLE_W = 450`): nothing useful beyond.
  The mockups are 450×320.
- RGB565 output: `renderPng` quantizes R/B to 5 bits, G to 6. Dark backgrounds and splash dithered; light background
  and slot 79 with `{ dither: false }` (dithering creates streaks there). Tiles in `keepAlpha` (transparent pixels
  not dithered, composited later by upstream).
- Every text in the HMI crops its background from the image ("crop image"): bold artwork only in the bottom corners
  (x < 78 and x > 380) and in the center of the home page; elsewhere, low contrast. Labels of the physical buttons at
  x 47-167 and 288-408, y ≈ 288-315.
- Amber `#ff9800` = "on" signal. No artwork may come close to it; only the active tile (`#fbbd63`) is amber.
- Positions of the 8 tiles: `[17,45] [124,45] [231,45] [338,45] [17,176] [124,176] [231,176] [338,176]`, 100×100,
  radius 18 (positions from the official HMI).
- Slot numbering (upstream mapping, tagged version): night background = 0, day background = 48, night off tile = 46,
  night active tile = 47, day off tile = 79 (overridden by `overrides/79.png`), day active tile = 80,
  "partly cloudy" weather night = 12, day = 59. Any new upstream version may renumber: check.
- `TEXT` identical across themes: the palette is compiled into the firmware (substitutions `THEME_*_COLOR_PCO_*`),
  while the TFT is uploaded from a URL. Changing it requires an ESPHome recompile of every panel.
- Tile text hard-coded in the upstream ESPHome: white on an off tile, dark gray on an on tile. The off tiles must
  stay dark enough, by day as by night.
- `build.sh` empties `dist/slots` file by file instead of `rm -rf` on the folder (an open Windows Explorer window
  would block it): keep this behavior.

## Known pitfalls

- TFT from another version than the firmware → "Version mismatch". `UPSTREAM_TAG` = flashed version.
- A firmware whose TFT is older than the one it requires uploads `nextion_update_url` on its own at reboot:
  publish the TFT before flashing.
- Upstream AHK without `WinActivate`: "Could not find element AutomationId=buttonX2 AND Name=Output".
- `render-preview.ts`: geometry measured on HMI v2026.10.6, system fonts (Segoe UI) instead of the HMI fonts. If
  upstream moves objects, the mockups lie.
- `lib.ts` only imports `octobre-art.ts`: `place()` only knows the October motifs; November has its own
  `foot()`.
- `esphome_ingress.py`: Device Builder 2026.11 protocol for `install`/`ws`; `run` targets the old API.

## Never commit

- Tokens (`HA_TOKEN`), passwords, keys.
- IP addresses, host or domain names of a real house, slugs or internal URLs other than the generic defaults.
- Real first names, names of personal rooms or devices in `render-preview.ts` and in the published mockups;
  use generic labels or the fictional first names ALEX and SAM.
- Photos of people, screenshots of a real dashboard.
- Generated `themes/`, `node_modules/`, compiled TFT and HMI (they embed the upstream HMI).

## Check a change

1. `node scripts/render-theme.ts octobre` (and `novembre`): must end with "thème … rendu dans …" without an exception.
2. In WSL: `bash build.sh octobre images` → "images : slots 0..N → …".
3. `node scripts/render-preview.ts octobre` → "N maquettes dans …"; open the PNGs for day AND night, check that
   the texts are readable and that there is no amber outside the active tile.
4. For a TFT: `bash build.sh octobre tft`, then test on a panel before publishing.
