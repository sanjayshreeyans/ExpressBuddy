# Audio Preprocessing for Improved VAD

## Overview

ExpressBuddy now performs client-side audio preprocessing so quiet speakers are still detected by Google VAD.

- Boosts quiet children's voices without audible distortion.
- Suppresses steady background noise in classrooms or homes.
- Smooths large volume swings so every syllable reaches Gemini.

## Processing Pipeline

```text
Microphone → Preprocessor Worklet → Recorder Worklet → Gemini Live API
```

The pipeline runs inside Web Audio `AudioWorkletProcessor` threads, so latency remains imperceptible.

## Processing Stages

### 1. Adaptive Gain

- Amplifies the signal up to 3× (default 2.5×).
- Allows real-time tuning from the settings dialog.

### 2. Noise Gate

- Removes low-level room noise using fast attack (1 ms) and slow release (50 ms).
- Keeps a 5% floor so whispered syllables are never fully muted.

### 3. Dynamic Range Compression

- Applies a 2:1 ratio above the selected threshold (default 50%).
- Keeps excited shouts and soft speech within the same volume band.

### 4. Peak Limiting

- Prevents clipping above 95% full scale with a soft knee.
- Protects downstream encoders from overloaded samples.

## Using the Controls

Open the **Settings** dialog and locate **Audio Preprocessing (Improves VAD for Quiet Voices)**.

1. Pick a preset: **Quiet Voice**, **Default**, or **Noisy Room**.
2. (Optional) Click **Show advanced** to reveal the sliders for fine-tuning gain, gate, and compression.
3. Changes take effect instantly and are saved locally for future sessions.

## Recommended Presets

| Scenario | Gain | Noise Gate | Compression |
| --- | --- | --- | --- |
| Quiet Voice | 2.8× | 1.5% | 45% |
| Default | 2.5× | 2.0% | 50% |
| Noisy Room | 2.2× | 3.5% | 55% |

## Troubleshooting

- **Still too quiet:** raise gain toward 3× and drop the noise gate to ~1%.
- **Too much background noise:** increase gate to 4% and lower gain slightly.
- **Audio sounds harsh:** reduce gain below 2× or increase compression threshold.

## Developer Notes

- Worklet source: `src/lib/worklets/audio-preprocessor.ts`.
- Recorder integration: `src/lib/audio-recorder.ts`.
- UI controls: `src/components/settings-dialog/SimplifiedSettingsDialog.tsx`.
- Slider component: `src/components/ui/slider.tsx` (Radix Slider).

## Testing Tips

1. Connect a low-volume microphone and confirm the mic icon tooltip reports an effective gain above 2× while speaking.
2. Toggle presets during an active session—the audio graph updates without reconnecting to Gemini.
3. Verify the outgoing PCM packets still arrive by watching the WebSocket logs in the console.
