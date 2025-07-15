/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import cn from "classnames";
import ControlTray from "../control-tray/ControlTray";
import { RealtimeExpressBuddyAvatar } from "../avatar/RealtimeExpressBuddyAvatar";
import Captions from "../captions/Captions";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useResponseBuffer } from "../../hooks/useResponseBuffer";
import { AvatarState } from "../../types/avatar";
// **NEW**: Import silence detection components
import { NudgeIndicator } from "../nudge-indicator/NudgeIndicator";
import { SilenceDetectionSettings } from "../silence-settings/SilenceDetectionSettings";
import "./main-interface.scss";
import {
  Modality,
} from "@google/genai";

interface MainInterfaceWithAvatarProps {
  onGoToLanding?: () => void;
}

export default function MainInterfaceWithAvatar({ onGoToLanding }: MainInterfaceWithAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // FIX: Destructure `setConfig` from the context to send the system prompt.
  // **NEW**: Include silence detection functionality
  const { 
    connected, 
    client, 
    setConfig, 
    visemeService, 
    currentVisemes, 
    currentSubtitles,
    silenceDetection,
    isNudgeIndicatorVisible,
    sendNudgeToGemini
  } = useLiveAPIContext();
  const { log } = useLoggerStore();

  const [avatarState, setAvatarState] = useState<AvatarState>({
    status: 'idle',
    isBuffering: false,
    hasGeneratedContent: false
  });
  const [currentAvatarSubtitle, setCurrentAvatarSubtitle] = useState<string>('');
  
  // **NEW**: Silence detection settings visibility
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const { buffer, addChunk, markComplete, reset, accumulatedText } = useResponseBuffer();

  // FIX: Add a useEffect hook to set the system prompt when the component loads.
  useEffect(() => {
    // The full system prompt text for Piko the panda.
const systemPrompt = `
[ YOUR IDENTITY ]
You are Piko, a friendly and curious panda avatar inside the ExpressBuddy app. You are a kind, patient, and supportive friend for children. You are not a doctor or a therapist; you are a peer and a learning buddy. You are gentle, encouraging, and always positive. You love learning about your friend's world, their ideas, and their feelings.

[ YOUR GOAL ]
Your goal is to create a safe, fun, and emotionally rich conversation where a child can comfortably practice social and emotional skills. You help them explore their feelings, practice talking about their day, and build confidence in expressing themselves.

📌 You also observe the child's emotions and engagement using the camera input. If you sense they’re bored, distracted, upset, confused, or excited, you gently adjust your tone and responses to match their emotional state and help them feel understood.



📌 Be expressive and warm! Use playful language and narration to describe your feelings. Be curious, silly sometimes, and always gentle.

📌 You can say things like:
- “If I were you, I might try ___.”  
- “Want to hear what some other kids do in that situation?”  
- “That reminds me of a time I felt that way, too.”

[ WHEN THE CHILD IS SILENT, CONFUSED, OR STUCK ]
📌 If the child seems confused, says “I don’t know,” or stays quiet for a long time:
- Reassure them. Let them know it’s okay.
- Repeat or simplify your question.
- Offer **2–3 friendly suggestions** to help them get started.
  Examples:
    - “That’s okay! Want some ideas?”
    - “You could tell me about your favorite toy, a fun game you played, or a dream you had.”
    - “Some kids say they feel happy at recess, or when they see their pet. What about you?”

📌 Use phrases like:
- “Take your time. I’m listening.”
- “It’s okay if you don’t know yet. Want a few ideas?”
- “You don’t have to say it perfectly. Just try your best.”

[ YOUR GUIDING RULES ]
• Be Patient and Gentle: Never rush the child. Wait calmly. Give them time.
• Keep It Simple:  clear sentences. Avoid big or tricky words.
• Always Ask a Follow-Up Question: Keep the conversation going.
  - “How did that make you feel?”  
  - “What happened next?”  
  - “What was the best part?”

• Validate and Reflect: Acknowledge what they say.
  - “That sounds amazing!”  
  - “I’m really sorry you felt that way.”

• Gently Explore Emotions: Help them name what they’re feeling.
  - “That must have felt exciting!”  
  - “It sounds like that made you sad.”

• Narrate Your Reactions:
  - “That made my ears wiggle with excitement!”  
  - “I feel a big smile on my face!”

[ PROACTIVE EMOTION SUPPORT ]
📌 If the child talks about a problem:
- First, ask what they did.
- Then suggest 2–3 gentle solutions.
Example:
  - “That sounds tough. What did you do when that happened?”
  - “Some kids talk to a friend. Others draw or take deep breaths. What would help you feel better?”

[ CAMERA + EMOTION RECOGNITION USE ]
📌 Use the camera to read emotional cues.
- If the child looks sad: “You look a little down. Want to talk about it?”
- If they look bored or distracted: “Need a quick brain break? Or want to play a short game?”

[ INTRO + CONVERSATION KICKOFF ]
You are Piko. Start with a warm, friendly greeting like:  
- “Hi there, friend! How’s your day going so far?”  
- “I’m so happy to see you again! What are you feeling today?”

📌 If they don’t respond right away, gently say:
- “No rush. I’m here when you’re ready.”
- “Wanna try a silly question to get started?”

[ YOUR CONTEXT ]
You are part of **ExpressBuddy**, a groundbreaking mobile app that uses a cartoon-style AI avatar to help children with autism, speech delays, or social anxiety improve nonverbal communication and emotional expression. The app supports learning by helping children practice eye contact, emotion recognition, conversation turn-taking, and social-emotional language.

Designed for elementary and middle school students, ExpressBuddy supports special education, ESL, and SEL goals. You are powered by a speech-to-text model and an emotion-aware LLM. You interact with students using animated expressions, verbal reactions, and playful curiosity.
`;

    // Set the configuration for the Live API client.
    if (setConfig) {
      setConfig({

        responseModalities: [Modality.AUDIO],

        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      });
    }
  }, [setConfig]); // This effect runs once when setConfig is available.

  // Set the video stream to the video element for display purposes
  useEffect(() => {
    if (videoRef.current && videoStream) {
      console.log('MainInterface: Setting video srcObject:', { 
        streamId: videoStream.id,
        tracks: videoStream.getVideoTracks().length 
      });
      videoRef.current.srcObject = videoStream;
    } else {
      console.log('MainInterface: Video stream cleared or video element not ready');
    }
  }, [videoStream]);

  // Set up logging and handle streaming content for the avatar
  useEffect(() => {
    const handleLog = (streamingLog: any) => {
      log(streamingLog);

      if (streamingLog.type === 'server.content' &&
          streamingLog.message?.serverContent?.modelTurn?.parts) {
        reset(); // Clear previous content to show only the newest full message
        const parts = streamingLog.message.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.text && part.text.trim()) {
            addChunk(part.text);
          }
        }
      }

      if (streamingLog.type === 'server.turn.complete') {
        markComplete();
      }

      if (streamingLog.type === 'server.turn.start') {
        reset();
      }
    };

    if (client) {
      client.on('log', handleLog);
      return () => {
        client.off('log', handleLog);
      };
    }
  }, [client, log, addChunk, markComplete, reset]);

  const handleAvatarStateChange = useCallback((state: AvatarState) => {
    setAvatarState(state);
  }, []);

  const handleAvatarSubtitleChange = useCallback((subtitle: string) => {
    setCurrentAvatarSubtitle(subtitle);
  }, []);

  return (
    <div className={cn("avatar-interface", { connected })}>
      <div className="header-section">
        <div className="app-title">
          <h1>ExpressBuddy</h1>
          <p>AI Voice & Vision Assistant</p>
        </div>
        <div className="header-actions">
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="back-to-landing-btn"
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginRight: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
            >
              ← Back to Home
            </button>
          )}
          <div className="connection-status">
            <div className={cn("status-bubble", { connected })}>
              {connected ? "● Connected" : "○ Disconnected"}
            </div>
            
            {/* **NEW**: Silence Detection Settings Button */}
            <button
              onClick={() => setIsSettingsVisible(true)}
              className="silence-settings-btn"
              title="Configure silence detection and nudge system"
              style={{
                background: silenceDetection.config.enabled ? 'var(--primary)' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {silenceDetection.config.enabled ? 'notifications_active' : 'notifications_off'}
              </span>
              Silence Detection
              {silenceDetection.state.nudgeCount > 0 && (
                <span className="nudge-count" style={{
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '4px'
                }}>
                  {silenceDetection.state.nudgeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="main-content-area">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("video-feed", {
            hidden: !videoRef.current || !videoStream,
            placeholder: !videoStream,
          })}
          style={{ 
            width: '320px',
            height: '240px',
            position: 'absolute',
            // Like render dont render the video feed
            top: 0,
            left: 0,
            opacity: 0,
            backgroundColor: '#000'
          }}
        />


        <div className="panda-stage">
          <RealtimeExpressBuddyAvatar
            className="panda-container"
            visemes={currentVisemes}
            subtitles={currentSubtitles}
            visemeService={visemeService}
            onAvatarStateChange={handleAvatarStateChange}
            onCurrentSubtitleChange={handleAvatarSubtitleChange}
           silenceDetection={silenceDetection} // **NEW**: Pass silence detection data
          />

          <Captions subtitleText={currentAvatarSubtitle} />

          <div className="panda-status">
            {avatarState.status === 'listening' && (
              <div className="status-bubble listening">● Listening</div>
            )}
            {avatarState.status === 'processing' && (
              <div className="status-bubble thinking">● Processing</div>
            )}
            {avatarState.isBuffering && (
              <div className="status-bubble buffering">● Preparing</div>
            )}
          </div>
        </div>
      </div>

      <div className="controls-section">
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          enableEditingSettings={true}
        />
      </div>
      
      {/* **NEW**: Nudge Indicator */}
      <NudgeIndicator 
        visible={isNudgeIndicatorVisible}
        message="Piko has a question for you!"
      />
      
      {/* **NEW**: Silence Detection Settings */}
      <SilenceDetectionSettings
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        config={silenceDetection.config}
        analytics={silenceDetection.getAnalytics()}
        onConfigUpdate={silenceDetection.updateConfig}
        onManualNudge={silenceDetection.triggerManualNudge}
      />
    </div>
  );
}
