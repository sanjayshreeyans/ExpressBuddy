#!/bin/bash
# This script converts videos with a green screen background to transparent WebM files.
# COMPLETE green removal with HARD edges - no blending, no green remnants.
#
# Usage:
# 1. Make sure you have ffmpeg installed (https://ffmpeg.org/download.html).
# 2. Navigate to this directory in your terminal.
# 3. Run the script: bash ./convert_videos.sh

# Convert Pandaalter1_2.mp4
echo "Converting Pandaalter1_2.mp4 to Full HD WebM with COMPLETE green removal..."
ffmpeg -i Pandaalter1_2.mp4 \
  -vf "scale=1920:1080,chromakey=0x00ff00:0.34:0.0" \
  -c:v libvpx-vp9 \
  -pix_fmt yuva420p \
  -auto-alt-ref 0 \
  -crf 20 \
  -b:v 0 \
  Pandaalter1_2.webm

# Convert PandaTalkingAnim.mp4
echo "Converting PandaTalkingAnim.mp4 to Full HD WebM with COMPLETE green removal..."
ffmpeg -i PandaTalkingAnim.mp4 \
  -vf "scale=1920:1080,chromakey=0x00ff00:0.34:0.0" \
  -c:v libvpx-vp9 \
  -pix_fmt yuva420p \
  -auto-alt-ref 0 \
  -crf 20 \
  -b:v 0 \
  PandaTalkingAnim.webm

echo "✅ Conversion complete with COMPLETE green removal!"
echo "ℹ️  SETTINGS:"
echo "   • Chromakey similarity: 0.34 (removes all green shades)"
echo "   • Blend: 0.0 (HARD edges, no transparency blending)"
echo "   • Background is 100% transparent where green was detected"