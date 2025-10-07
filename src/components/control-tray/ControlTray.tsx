/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import { SimpleHintButton } from "../simple-hint-button/SimpleHintButton";
import "./control-tray.scss";
import SimplifiedSettingsDialog from "../settings-dialog/SimplifiedSettingsDialog";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
  disableChunkingToggle?: boolean; // Disable chunking controls for video avatar
  currentBackground?: string; // Current background video path
  onBackgroundChange?: (background: string) => void; // Background change handler
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button className="action-button" onClick={stop}>
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button className="action-button" onClick={start}>
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    )
); 

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
  enableEditingSettings,
  disableChunkingToggle = false, // Default to false for backward compatibility
  currentBackground = '/Backgrounds/AnimatedVideoBackgroundLooping1.mp4',
  onBackgroundChange = () => {},
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { 
    client, 
    connected, 
    connect, 
    disconnect, 
    volume, 
    isBuffering, 
    enableChunking, 
    setEnableChunking
  } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      console.log('ControlTray: Setting video srcObject:', { 
        hasStream: !!activeVideoStream,
        streamId: activeVideoStream?.id 
      });
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        console.log('ControlTray: Video frame send skipped - missing elements:', { video: !!video, canvas: !!canvas });
        return;
      }

      // Check video readiness
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('ControlTray: Video not ready yet:', { 
          readyState: video.readyState, 
          width: video.videoWidth, 
          height: video.videoHeight,
          srcObject: !!video.srcObject 
        });
        if (connected) {
          timeoutId = window.setTimeout(sendVideoFrame, 100);
        }
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 1.0);
          const data = base64.slice(base64.indexOf(",") + 1, Infinity);
          console.log('ControlTray: Sending video frame:', { 
            width: canvas.width, 
            height: canvas.height, 
            dataLength: data.length,
            videoReadyState: video.readyState 
          });
          client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
        } catch (error) {
          console.error('ControlTray: Error drawing video frame:', error);
        }
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      console.log('ControlTray: Starting new video stream:', { 
        streamId: mediaStream.id, 
        tracks: mediaStream.getVideoTracks().length 
      });
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      console.log('ControlTray: Stopping video stream');
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  // Automatically start webcam on mount
  useEffect(() => {
    let started = false;
    if (supportsVideo && webcam && !activeVideoStream) {
      webcam.start().then((mediaStream: MediaStream) => {
        if (mediaStream && !started) {
          setActiveVideoStream(mediaStream);
          onVideoStreamChange(mediaStream);
          started = true;
        }
      }).catch((err: any) => {
        console.warn('Could not start webcam automatically:', err);
      });
    }
    // No cleanup needed; user can still stop video via UI
    // eslint-disable-next-line
  }, []);

  return (
    <section className="control-tray">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <nav className={cn("actions-nav", { disabled: !connected })}>
        <button
          className={cn("action-button mic-button")}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>

        <div className="action-button no-action outlined">
          <AudioPulse volume={volume} active={connected} hover={false} />
        </div>
        
        {/* Simple Audio Mode Controls - Hidden for video avatar */}
        {!disableChunkingToggle && (
          <div className="chunk-controls">
            <div className="chunk-mode-toggle">
              <button
                className={`action-button ${enableChunking ? 'connected' : ''}`}
                onClick={() => setEnableChunking(!enableChunking)}
                disabled={!connected}
                title={enableChunking ? "Waterfall mode: Wait for complete audio, then sync with visemes" : "Immediate mode: Stream audio as received (legacy)"}
              >
                <span className="material-symbols-outlined">
                  {enableChunking ? 'sync' : 'flash_on'}
                </span>
              </button>
              <span className="mode-label">
                {enableChunking ? 'Sync' : 'Stream'}
              </span>
            </div>
            
            {isBuffering && (
              <div className="buffering-indicator">
                <span className="material-symbols-outlined">schedule</span>
                <span>Processing...</span>
              </div>
            )}
          </div>
        )}

        {supportsVideo && (
          <>
            <MediaStreamButton
              isStreaming={webcam.isStreaming}
              start={changeStreams(webcam)}
              stop={changeStreams()}
              onIcon="videocam_off"
              offIcon="videocam"
            />
          </>
        )}

        {/* Simple Hint Button - Always available when connected */}
        {connected && (
          <SimpleHintButton />
        )}

        {children}
      </nav>

      <div className={cn("connection-container", { connected })}>
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className={cn("action-button connect-toggle", { connected })}
            onClick={connected ? disconnect : connect}
          >
            <span className="material-symbols-outlined filled">
              {connected ? "pause" : "play_arrow"}
            </span>
          </button>
        </div>
        <span className="text-indicator">Streaming</span>
      </div>
      {enableEditingSettings ? (
        <SimplifiedSettingsDialog
          currentBackground={currentBackground}
          onBackgroundChange={onBackgroundChange}
        />
      ) : ""}
    </section>
  );
}

export default memo(ControlTray);
