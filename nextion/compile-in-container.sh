#!/usr/bin/env bash
# Exécuté DANS le conteneur sztupy/nextion-scripts, dossier de travail monté sur /app/input :
# ouvre input.hmi dans Nextion Editor, le sauvegarde et l'exporte en TFT (output.tft / output.hmi).
# DEBUG=1 : captures d'écran toutes les secondes dans /app/input.
export WINEDEBUG=-all
[[ -n "${DEBUG:-}" ]] && (./dump_screenshots.sh >/dev/null 2>&1 &)
cp input/input.hmi /home/wineuser/.wine/drive_c/data/input.hmi
cp ./*.ahk input/*.ahk /home/wineuser/.wine/drive_c/data/ahk/uia/
cd /home/wineuser/.wine/drive_c/data/ahk/uia || exit 1
wine 'C:\data\nextion\Nextion Editor.exe' 'C:\data\input.hmi' &
timeout 150 wine ../AutoHotkeyU32.exe ResetWarning.ahk | tail -1
timeout 400 wine ../AutoHotkeyU32.exe CompileFixed.ahk | grep -v 'Waiting for'
sudo cp /home/wineuser/.wine/drive_c/users/wineuser/AppData/Roaming/Nextion\ Editor/work/*/output/*.tft /app/input/output.tft
sudo cp /home/wineuser/.wine/drive_c/data/input.hmi /app/input/output.hmi
