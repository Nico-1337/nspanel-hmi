#!/usr/bin/env bash
# build.sh — fabrique le TFT habillé d'un thème, dans WSL (Docker + ImageMagick + PyYAML).
#
#   ./build.sh <theme> [images|tft|all]     (défaut : all)
#
#   images : sources du thème → slots opaques numérotés (generate_images.sh amont) + overrides
#   tft    : réimport des slots dans le HMI amont puis compilation (Nextion Editor 1.68.2 sous Wine)
#
# Le HMI et les images sources viennent du dépôt NSPanel Easy AU TAG flashé sur les panneaux
# (UPSTREAM_TAG) : le TFT n'est valable que pour cette version (sinon « Version mismatch »).
# Sortie : themes/<theme>/dist/nspanel_landscape.tft (+ slots/ pour les maquettes).
set -euo pipefail

THEME="${1:?usage: build.sh <theme> [images|tft|all]}"
STEP="${2:-all}"
UPSTREAM_TAG="${UPSTREAM_TAG:-v2026.10.7}"
IMAGE="sztupy/nextion-scripts:latest"

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
THEME_DIR="${HERE}/themes/${THEME}"
CACHE="${HOME}/nspanel/upstream-${UPSTREAM_TAG}"
WORK="${HOME}/nspanel/work-${THEME}"
DIST="${THEME_DIR}/dist"

[[ -d "${THEME_DIR}/pics" ]] || { echo "thème non rendu : node scripts/render-theme.ts ${THEME}" >&2; exit 1; }

if [[ ! -d "${CACHE}" ]]; then
  git clone -q --depth 1 --branch "${UPSTREAM_TAG}" https://github.com/edwardtfn/NSPanel-Easy.git "${CACHE}"
fi

build_images() {
  rm -rf "${WORK}" && mkdir -p "${WORK}"
  cp -a "${CACHE}/hmi/dev/pics" "${WORK}/pics"
  # Sources du thème par-dessus les sources amont (mêmes chemins relatifs).
  cp -a "${THEME_DIR}/pics/." "${WORK}/pics/"
  bash "${WORK}/pics/generate_images.sh" landscape > "${WORK}/generate.log"
  local out="${WORK}/pics/landscape"
  # Slots que mapping.yaml ne sait pas varier jour/nuit : recomposés par render-theme.ts.
  if [[ -d "${THEME_DIR}/overrides" ]]; then
    cp "${THEME_DIR}/overrides/"*.png "${out}/"
  fi
  local count
  count=$(ls "${out}" | sed 's/\.png$//' | sort -n | tail -1)
  for i in $(seq 0 "${count}"); do
    [[ -e "${out}/${i}.png" ]] || cp "${WORK}/pics/misc/placeholder.png" "${out}/${i}.png"
  done
  echo "${count}" > "${WORK}/last_slot"
  # Vider puis remplir (pas de rm -rf du dossier : un explorateur Windows ouvert dessus le bloque).
  mkdir -p "${DIST}/slots" && rm -f "${DIST}/slots/"*.png && cp "${out}/"*.png "${DIST}/slots/"
  echo "images : slots 0..${count} → ${DIST}/slots"
}

build_tft() {
  local count
  count=$(cat "${WORK}/last_slot")
  local job="${WORK}/job"
  rm -rf "${job}" && mkdir -p "${job}" && chmod 777 "${job}"
  cp "${CACHE}/hmi/nspanel_landscape.hmi" "${job}/input.hmi"
  cp -a "${WORK}/pics/landscape" "${job}/pics"
  cp "${HERE}/nextion/"*.ahk "${job}/"
  # Scripts AHK amont + nos correctifs (WinActivate avant l'export : sans fenêtre active,
  # les touches du menu « TFT file output » se perdent et l'export échoue).
  docker run --rm -v "${job}:/app/input" "${IMAGE}" bash -c "
    set -e
    export WINEDEBUG=-all
    cp input/input.hmi /home/wineuser/.wine/drive_c/data/input.hmi
    cp -a input/pics /home/wineuser/.wine/drive_c/
    cp *.ahk input/*.ahk /home/wineuser/.wine/drive_c/data/ahk/uia/
    cd /home/wineuser/.wine/drive_c/data/ahk/uia
    wine 'C:\\data\\nextion\\Nextion Editor.exe' 'C:\\data\\input.hmi' &
    wine ../AutoHotkeyU32.exe ResetWarning.ahk
    wine ../AutoHotkeyU32.exe UpdateImagesFixed.ahk png ${count} | grep -v 'Waiting for object'
    sudo cp /home/wineuser/.wine/drive_c/users/wineuser/AppData/Roaming/Nextion\\ Editor/work/*/output/*.tft /app/input/output.tft
    sudo cp /home/wineuser/.wine/drive_c/data/input.hmi /app/input/output.hmi
  "
  mkdir -p "${DIST}"
  cp "${job}/output.tft" "${DIST}/nspanel_landscape.tft"
  cp "${job}/output.hmi" "${DIST}/nspanel_landscape.hmi"
  ls -la "${DIST}/nspanel_landscape.tft"
}

case "${STEP}" in
  images) build_images ;;
  tft) build_tft ;;
  all) build_images && build_tft ;;
  *) echo "étape inconnue : ${STEP}" >&2; exit 1 ;;
esac
