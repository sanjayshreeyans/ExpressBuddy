#!/bin/bash
# This script converts videos with a green screen background to transparent WebM files.
# It assumes the background color is green (hex #00ff00).
# You might need to adjust the `similarity` and `blend` values in the `chromakey` filter
# if the green screen is not perfectly removed.
#
# Usage:
# 1. Make sure you have ffmpeg installed (https://ffmpeg.org/download.html).
# 2. Navigate to this directory in your terminal.
# 3. Run the script: bash ./convert_videos.sh

# Convert Pandaalter1_2.mp4
echo "Converting Pandaalter1_2.mp4 to Full HD WebM..."
ffmpeg -i Pandaalter1_2.mp4 -vf "scale=1920:1080,chromakey=0x00ff00:0.18:0.02,split[v][a];[a]alphaextract,erosion=1:1,boxblur=2:1[alpha];[v][alpha]alphamerge,format=yuva420p" -c:v libvpx-vp9 -crf 20 -b:v 0 -pix_fmt yuva420p Pandaalter1_2.webm

# Convert PandaTalkingAnim.mp4
echo "Converting PandaTalkingAnim.mp4 to Full HD WebM..."
ffmpeg -i PandaTalkingAnim.mp4 -vf "scale=1920:1080,chromakey=0x00ff00:0.18:0.02,split[v][a];[a]alphaextract,erosion=1:1,boxblur=2:1[alpha];[v][alpha]alphamerge,format=yuva420p" -c:v libvpx-vp9 -crf 20 -b:v 0 -pix_fmt yuva420p PandaTalkingAnim.webm

echo "Conversion complete. Check for .webm files in this directory."
