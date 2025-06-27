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
import Avatar from "../avatar/Avatar";
import Captions from "../captions/Captions";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import "./main-interface.scss";

export default function MainInterface() {
  // Hidden video reference for webcam/screen capture (still functional but not displayed)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // Text input for sending messages (hidden but functional)
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { connected, client } = useLiveAPIContext();
  const { log } = useLoggerStore();

  // Set up logging (hidden but functional)
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

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
    <div className="main-interface full-screen-avatar">
      {/* Hidden video element - still captures but not displayed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      
      {/* Full-screen avatar experience */}
      <div className="avatar-screen">
        <Avatar 
          kokoroBackendUrl="http://localhost:8000"
          selectedVoice="af"
        />
        
        {/* Captions overlay for AI responses */}
        <Captions 
          visible={true}
          maxDisplayTime={6000}
          fadeOutTime={1000}
        />
        
        {/* Floating connection status */}
        <div className="floating-status">
          <span className={cn("status-badge", { connected })}>
            {connected ? "🟢 Live" : "🔴 Disconnected"}
          </span>
        </div>
        
        {/* Hidden but functional text input for emergency text communication */}
        <div className="hidden-input" style={{ display: 'none' }}>
          <textarea
            ref={inputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSubmit}>Send</button>
        </div>
      </div>

      {/* Floating control tray - minimal and unobtrusive */}
      <div className="floating-controls">
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
