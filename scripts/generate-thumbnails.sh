#!/bin/bash
# Script to generate thumbnails for background videos
# Usage: ./generate-thumbnails.sh

# Navigate to the Backgrounds directory
cd "$(dirname "$0")/../public/Backgrounds" || exit

# Loop through all MP4 files
for video in *.mp4; do
  # Skip if no MP4 files found
  [ -e "$video" ] || continue
  
  # Get filename without extension
  filename="${video%.*}"
  
  # Check if thumbnail already exists
  if [ ! -f "${filename}_thumb.jpg" ]; then
    echo "Generating thumbnail for: $video"
    ffmpeg -i "$video" -ss 00:00:01 -vframes 1 -vf "scale=300:170" "${filename}_thumb.jpg" -y
    echo "✅ Created: ${filename}_thumb.jpg"
  else
    echo "⏭️  Skipping: ${filename}_thumb.jpg (already exists)"
  fi
done

echo "🎉 Thumbnail generation complete!"
