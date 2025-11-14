#!/bin/bash
# This script converts videos with a green screen background to transparent WebM files.
# Precise green removal that preserves white and colored subjects.
#
# Usage:
# 1. Make sure you have ffmpeg installed (https://ffmpeg.org/download.html).
# 2. Navigate to this directory in your terminal.
# 3. Run the script: bash ./convert_videos.sh

# Convert Pandaalter1_2.mp4
echo "Converting peeblestalkinggreen2.mp4 to Full HD WebM with precise green removal..."
ffmpeg -i ./peeblestalkinggreen2.mp4 \
  -vf "scale=1920:1080,\
       colorkey=0x00ff00:0.35:0.08,\
       hue=h=-3:s=0.96" \
  -c:v libvpx-vp9 \
  -pix_fmt yuva420p \
  -auto-alt-ref 0 \
  -crf 20 \
  -b:v 0 \
  pebblestalking.webm

# Convert PandaTalkingAnim.mp4
# echo "Converting PandaTalkingAnim.mp4 to Full HD WebM with precise green removal..."
# ffmpeg -i PandaTalkingAnim.mp4 \
#   -vf "scale=1920:1080,\
#        colorkey=0x00ff00:0.3:0.1,\
#        hue=h=-2:s=0.98" \
#   -c:v libvpx-vp9 \
#   -pix_fmt yuva420p \
#   -auto-alt-ref 0 \
#   -crf 20 \
#   -b:v 0 \
#   PandaTalkingAnim.webm

echo "✅ Conversion complete with natural color!"
echo "ℹ️  SETTINGS:"
echo "   • Colorkey similarity: 0.35 (preserves subject)"
echo "   • Hue shift: -3 degrees (neutralizes green tint)"
echo "   • Saturation: 0.96 (slightly desaturates to reduce green)"