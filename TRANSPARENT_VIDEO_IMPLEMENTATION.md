# Transparent Video Avatar with Animated Background

## Overview
This implementation uses video-based animations for the ExpressBuddy avatar, featuring transparent background support with an animated backdrop, creating a layered visual effect. The avatar switches between idle and talking states based on AI conversation activity.

## Changes Made

### 1. VideoExpressBuddyAvatar.tsx
**File:** `src/components/avatar/VideoExpressBuddyAvatar.tsx`

#### Added Background Video Support
- Added `backgroundVideoRef` ref to manage the background video element
- Added `backgroundVideoSrc` prop for configurable backgrounds (defaults to `/Backgrounds/AnimatedVideoBackgroundLooping1.mp4`)
- Initialized background video to autoplay and loop in the setup effect

#### Video Layering Structure
The component has three video layers (from back to front):
1. **Background Video** (z-index: -10) - The animated background (fixed to viewport)
2. **Avatar Idle Video** (z-index: 11) - Avatar's idle animation
3. **Avatar Talking Video** (z-index: 10) - Avatar's talking animation

#### State Management
- Uses `isListening` prop to control avatar state (talking vs idle)
- Seamless transitions between states using opacity changes
- Both videos play continuously for smooth transitions

### 2. Video Avatar Integration
**Usage:** Video-based avatar system integrated throughout the application

#### Avatar State Control
- `isListening` prop controls avatar animation state
- Automatically switches between idle and talking based on AI conversation activity
- No manual state management required

## Current Assets

- Avatar Idle: `Pandaalter1_2.webm` in `/public/VideoAnims/` folder
- Avatar Talking: `PandaTalkingAnim.webm` in `/public/VideoAnims/` folder
- Background: `AnimatedVideoBackgroundLooping1.mp4` in `/public/Backgrounds/` folder
- Format: WebM VP9 with alpha channel (GPU-accelerated transparency)
- Chroma-key processing: Pre-rendered during conversion (no runtime CPU overhead)

### Best Practices for Videos
1. **Avatar Videos**: Should use WebM format with alpha channel for transparency
2. **Background Video**: Can be any animated content - will play continuously behind avatar
3. **Format**: WebM with VP9 codec for avatar, MP4 with H.264 for background
4. **Resolution**: Match aspect ratios for best visual result

## Testing Checklist

- [ ] Background video plays continuously and loops smoothly
- [ ] Avatar appears with transparent background
- [ ] Avatar switches between idle and talking animations correctly
- [ ] No flickering or rendering issues
- [ ] Performance is smooth (videos playing simultaneously)
- [ ] Works across different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Avatar responds to `isListening` prop changes

## Troubleshooting

### If Background Video Doesn't Play
1. Check file path: Verify `/Backgrounds/AnimatedVideoBackgroundLooping1.mp4` exists
2. Check console for errors
3. Ensure video format is browser-compatible (MP4 H.264)

### If Avatar Doesn't Switch States
1. Verify `isListening` prop is being passed correctly
2. Check console for state transition logs
3. Ensure both video files are loading successfully

## Performance Considerations

- Playing multiple videos simultaneously can be resource-intensive
- Modern browsers handle this well, but monitor performance on lower-end devices
- All videos use `muted` attribute to allow autoplay without user interaction
- Videos use `playsInline` for mobile compatibility
- Visibility-based resource management pauses videos when off-screen (Chromebook/mobile optimization)

## Future Enhancements

### Possible Improvements
1. **Dynamic Background Selection**: Allow users to choose different backgrounds
2. **Video Optimization**: Compress videos further for faster loading
3. **Fallback Images**: Show static images if video fails to load
4. **Progressive Loading**: Show background first, then overlay avatar when ready
5. **More Avatar Animations**: Add additional emotional states beyond idle/talking

## Code Reference

### Key Props
```typescript
interface VideoExpressBuddyAvatarProps {
  className?: string;
  isListening?: boolean; // Controls talking vs idle state
  backgroundSrc?: string; // Background video path
  disableClickInteraction?: boolean; // Prevent accidental clicks
  hideDebugInfo?: boolean; // Hide development debug overlay
}
```

## Browser Compatibility

- ✅ Chrome/Edge (Chromium): Excellent support
- ✅ Firefox: Excellent support
- ✅ Safari: Good support (test on iOS devices)
- ⚠️ Older browsers: May need fallbacks

## Credits
- Video-based avatar system for simple, performant animations
- Layered video approach for character overlay effect
- GPU-accelerated WebM format with alpha channel for transparency
