# Adding New Background Videos

This guide explains how to add new background videos to ExpressBuddy.

## Step 1: Add Your Video File

1. Place your video file in `/public/Backgrounds/`
2. Supported formats: MP4 (H.264 recommended)
3. Recommended resolution: 1920x1080 or higher
4. File naming: Use descriptive names (e.g., `OceanWaves.mp4`, `SpaceStars.mp4`)

## Step 2: Generate Thumbnail

### Option A: Using the Script (Automatic)

```bash
# Run from project root
bash scripts/generate-thumbnails.sh
```

This will automatically create thumbnails for all videos that don't have one yet.

### Option B: Manual with FFmpeg

```bash
cd public/Backgrounds
ffmpeg -i YourVideo.mp4 -ss 00:00:01 -vframes 1 -vf "scale=300:170" YourVideo_thumb.jpg -y
```

### Option C: Manual Screenshot

1. Open your video in any player
2. Take a screenshot at a good frame
3. Resize to 300x170 pixels
4. Save as `YourVideoName_thumb.jpg` in `/public/Backgrounds/`

## Step 3: Update Settings Dialog

Edit `src/components/settings-dialog/SimplifiedSettingsDialog.tsx`:

```typescript
const backgrounds: BackgroundOption[] = [
  {
    id: "animated-1",
    name: "Animated Background 1",
    path: "/Backgrounds/AnimatedVideoBackgroundLooping1.mp4",
    thumbnail: "/Backgrounds/AnimatedVideoBackgroundLooping1_thumb.jpg",
  },
  // ADD YOUR NEW BACKGROUND HERE:
  {
    id: "ocean-waves",  // Unique ID
    name: "Ocean Waves",  // Display name
    path: "/Backgrounds/OceanWaves.mp4",  // Video path
    thumbnail: "/Backgrounds/OceanWaves_thumb.jpg",  // Thumbnail path
  },
];
```

## Step 4: Test

1. Save the file
2. Reload the app (Ctrl+R)
3. Open Settings → Background Video
4. Your new background should appear as a card with preview

## File Structure Example

```
public/
  Backgrounds/
    AnimatedVideoBackgroundLooping1.mp4 (video)
    AnimatedVideoBackgroundLooping1_thumb.jpg (thumbnail)
    OceanWaves.mp4 (your new video)
    OceanWaves_thumb.jpg (your new thumbnail)
    SpaceStars.mp4 (another video)
    SpaceStars_thumb.jpg (another thumbnail)
```

## Tips

### Best Practices
- Keep video files under 5MB for faster loading
- Use looping videos (seamless loops work best)
- Test on slower connections
- Use descriptive names that kids will understand
- Preview thumbnails should show interesting/colorful frames

### Video Optimization
If your video is too large, compress it:

```bash
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 -preset slow output.mp4
```

### Thumbnail Quality
For higher quality thumbnails:

```bash
ffmpeg -i YourVideo.mp4 -ss 00:00:01 -vframes 1 -vf "scale=300:170" -q:v 2 YourVideo_thumb.jpg -y
```

The `-q:v 2` parameter sets JPEG quality (1=best, 31=worst)

## Troubleshooting

### Thumbnail doesn't show
- Check file path is correct
- Verify thumbnail file exists in `/public/Backgrounds/`
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for 404 errors

### Video doesn't play
- Ensure video is in MP4 format with H.264 codec
- Test video plays in browser directly: `localhost:3000/Backgrounds/YourVideo.mp4`
- Check video isn't corrupted

### Background not changing
- Make sure you clicked the radio button and hit "Apply"
- Check browser console for errors
- Verify video path matches exactly (case-sensitive)

## Future Improvements

Ideas for enhancement:
- Auto-detect videos in Backgrounds folder (no manual config needed)
- Upload videos through UI
- Video preview on hover
- Video categories (Nature, Space, Abstract, etc.)
- User-created backgrounds saved to localStorage
