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

import { useRef, useState, useEffect } from "react";
import cn from "classnames";
import ControlTray from "../control-tray/ControlTray";
import Logger from "../logger/Logger";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import "./main-interface.scss";

export default function MainInterface() {
  // Video reference for displaying the active stream (webcam or screen capture)
  const videoRef = useRef<HTMLVideoElement>(null);
  // Video stream state - either screen capture, webcam, or null
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // Text input for sending messages
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  
  const { connected, client } = useLiveAPIContext();
  const { log, logs } = useLoggerStore();

  // Set up logging
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  const handleSubmit = () => {
    if (!textInput.trim() || !connected) return;
    
    client.send([{ text: textInput }]);
    setTextInput("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="main-interface">
      {/* Main content area with video and AI responses */}
      <div className="main-content">
        {/* Video feed section */}
        <div className="video-section">
          <video
            className={cn("video-feed", {
              hidden: !videoRef.current || !videoStream,
              placeholder: !videoStream,
            })}
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          {!videoStream && (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <span className="material-symbols-outlined">videocam_off</span>
                <p>No video feed</p>
                <p className="placeholder-hint">
                  Enable camera or screen sharing to see video feed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI responses section */}
        <div className="ai-responses-section">
          <div className="responses-header">
            <h3>AI Conversation</h3>
            <div className="connection-status">
              <span className={cn("status-indicator", { connected })}>
                {connected ? "🔵 Connected" : "⏸️ Disconnected"}
              </span>
            </div>
          </div>
          <div className="responses-content" ref={loggerRef}>
            <Logger filter="conversations" />
          </div>
          <div className={cn("chat-input-container", { disabled: !connected })}>
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connected ? "Type your message..." : "Connect to start chatting"}
                disabled={!connected}
              />
              <button
                className={cn("send-button", { disabled: !connected || !textInput.trim() })}
                onClick={handleSubmit}
                disabled={!connected || !textInput.trim()}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control tray at the bottom */}
      <div className="controls-section">
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          enableEditingSettings={true}
        />
      </div>
    </div>
  );
}