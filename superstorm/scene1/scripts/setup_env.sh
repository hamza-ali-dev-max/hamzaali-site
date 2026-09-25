#!/usr/bin/env bash
# One-shot environment setup for the scene 1 pipeline (Ubuntu 24.04, Python 3.11).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ffmpeg espeak-ng fonts-jetbrains-mono fonts-ibm-plex \
  libxrender1 libxxf86vm1 libxfixes3 libxi6 libxkbcommon0 libsm6 libgl1 libegl1 libglu1-mesa >/dev/null
python3 -m pip install -q --root-user-action=ignore \
  numpy scipy pillow opencv-python-headless shapely pyproj requests "bpy==5.0.1" \
  basemap-data==2.0.0 basemap-data-hires==2.0.0 geonamescache==3.0.2
echo "setup done: $(ffmpeg -version | head -1)"
python3 -c "import bpy; print('bpy', bpy.app.version_string)"
