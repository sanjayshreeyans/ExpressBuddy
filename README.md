
# ExpressBuddy Streaming Console

ExpressBuddy Streaming Console is a real-time AI streaming web application built with React, designed to provide an interactive interface for video streaming and chat. The project leverages modern UI technologies, including Tailwind CSS and shadcn/ui (migration in progress), to deliver a sleek and responsive user experience.

## Features

- **Main Video Interface**: Central area for live video streaming and controls.
- **Chat Panel**: Right-side panel for real-time chat and interaction.
- **Audio Pulse Visualization**: Visual feedback for audio input.
- **Settings Dialog**: Easily switch response modalities and voice options.
- **Logger**: Real-time event and message logging.
- **Side Panel**: Additional controls and information.
- **Modern UI**: Migration to Tailwind CSS and shadcn/ui for a clean, modern look.

## File Structure

```
app.yaml
CONTRIBUTING.md
LICENSE
MINIMAL_MIGRATION_GUIDE.md
package.json
README.md
TAILWIND_MIGRATION.md
tsconfig.json
public/
  favicon.ico
  index.html
  robots.txt
readme/
  thumbnail.png
src/
  App.scss
  App.test.tsx
  App.tsx - my ui code use some of the compoenents   like the control, logging just to show the text responses and nothing elese. so basically it is video camera on the left showing myselft and the audio responseses of the ai on the right. ofc there alot of coponenments that handle sockets incoming data, text decode and more. but 
  index.css
  index.tsx
  react-app-env.d.ts
  reportWebVitals.ts
  setupTests.ts
  types.ts
  components/
    altair/
      Altair.tsx
    audio-pulse/
      audio-pulse.scss
      AudioPulse.tsx
    control-tray/
      control-tray.scss
      ControlTray.tsx
    logger/
      logger.scss
      Logger.tsx
      mock-logs.ts
    main-interface/
      main-interface.scss
      MainInterface.tsx
      README.md
    settings-dialog/
      ResponseModalitySelector.tsx
      settings-dialog.scss
      SettingsDialog.tsx
      VoiceSelector.tsx
    side-panel/
      react-select.scss
      side-panel.scss
      SidePanel.tsx
    ui/
      button.tsx
      card.tsx
      textarea.tsx
  contexts/
    LiveAPIContext.tsx
  hooks/
    use-live-api.ts
    use-media-stream-mux.ts
    use-screen-capture.ts
    use-webcam.ts
  lib/
    audio-recorder.ts
    audio-streamer.ts
    audioworklet-registry.ts
    genai-live-client.ts
    store-logger.ts
    utils.ts
    worklets/
      audio-processing.ts
      vol-meter.ts
```

## Key Components

- **src/components/main-interface/MainInterface.tsx**: Main video interface, central to the app.
- **src/components/side-panel/SidePanel.tsx**: Chat and additional controls on the right.
- **src/components/audio-pulse/AudioPulse.tsx**: Audio visualization.
- **src/components/logger/Logger.tsx**: Event/message log.
- **src/components/settings-dialog/SettingsDialog.tsx**: Settings and voice options.
- **src/components/ui/**: Reusable UI elements (button, card, textarea, etc.).

## Main Interface Overview

The main interface (`MainInterface.tsx`) is split into two primary sections:

- **Video Section (Left):**
  - Displays the user's video feed from webcam or screen capture.
  - Shows a placeholder if no video is active.
- **AI Responses Section (Right):**
  - Shows real-time conversation with the AI model.
  - Includes a chat input for sending messages.
  - Displays connection status.
- **Control Tray (Bottom):**
  - Provides audio/video controls and connection management.

The chat panel (see `SidePanel.tsx`) is always accessible on the right, allowing for real-time chat and log filtering.

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the development server:**
   ```sh
   npm start
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```

## Technologies Used

- **React** (TypeScript)
- **Tailwind CSS** (migration in progress)
- **shadcn/ui** (planned)
- **Sass** (legacy styles, being replaced)
- **EventEmitter3, Zustand, Lucide React, React Select, Vega** (various features)

## Migration Notes

- The project is being migrated from Sass-based styles to Tailwind CSS and shadcn/ui for a more modern and maintainable UI.
- Some components may still use legacy `.scss` files until migration is complete.
- See `TAILWIND_MIGRATION.md` for details on how both systems coexist and how to add new Tailwind/shadcn components.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](LICENSE).

---

**Author:** Your Name
