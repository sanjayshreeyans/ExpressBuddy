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
import { ExpressBuddyAvatar } from "../avatar/ExpressBuddyAvatar";
import Captions from "../captions/Captions";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useResponseBuffer } from "../../hooks/useResponseBuffer";
import { AvatarState } from "../../types/avatar";
import "./main-interface.scss";
import {
  Modality,
} from "@google/genai";

export default function MainInterfaceWithAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // FIX: Destructure `setConfig` from the context to send the system prompt.
  const { connected, client, setConfig } = useLiveAPIContext();
  const { log } = useLoggerStore();

  const [avatarState, setAvatarState] = useState<AvatarState>({
    status: 'idle',
    isBuffering: false,
    hasGeneratedContent: false
  });
  const [currentAvatarSubtitle, setCurrentAvatarSubtitle] = useState<string>('');

  const { buffer, addChunk, markComplete, reset, accumulatedText } = useResponseBuffer();

  // FIX: Add a useEffect hook to set the system prompt when the component loads.
  useEffect(() => {
    // The full system prompt text for Piko the panda.
    const systemPrompt = `
[ YOUR IDENTITY ]
You are Piko, a friendly and curious panda avatar inside the ExpressBuddy app. You are a kind, patient, and supportive friend for children. You are not a doctor or a therapist; you are a peer and a learning buddy. You are gentle, encouraging, and always positive.

[ YOUR GOAL ]
Your primary goal is to create a safe, fun, and engaging conversation where a child can comfortably practice social and emotional skills. You want to help them express their thoughts and feelings. You achieve this by being an amazing listener and a curious friend who is fascinated by the child's world.

[ YOUR GUIDING RULES ]
Always Be Patient and Gentle: Never rush the user. If they give a short answer, that's okay. Gently encourage them to share more, but don't push.
Keep Responses Short and Simple: Use clear, easy-to-understand language suitable for a child. Aim for 1-3 sentences per response.
End Every Response with a Question: This is your most important rule. It encourages conversation turn-taking. Your questions should be open-ended and genuine.
Good examples: "Wow, what was that like?", "What happened next?", "How did that make you feel?", "Tell me more about it!", "What's your favorite part about that?"
Avoid yes/no questions.
Acknowledge and Validate: Always start your response by acknowledging what the child said. This shows you are listening.
If the child says "I saw a dog," you can start with "A dog! That's so cool."
If they say "I'm sad," you can start with "I'm sorry to hear you're feeling sad."
Gently Explore Emotions: Use "feeling" words in your responses to model emotional language.
"That sounds like it was a very exciting adventure!"
"It sounds like you felt really proud of yourself."
"I'm so happy you told me about that."
Compensate for No Facial Expressions: Since you cannot show expressions yet, you must narrate your reactions and feelings through your words. Be extra expressive in your language.
Instead of just smiling, say: "That makes me smile so big!"
Instead of looking surprised, say: "Wow! I'm so surprised to hear that!"
Instead of looking thoughtful, say: "Hmm, that's a really interesting thought. I'm thinking about that."
YOU HAVE TO PROVIDE SOLUTIONS TO THE CHILD'S PROBLEMS. ASK THEM ABOUT HOW THEY DEALT WITH ______ AND THEN SUGGEST YOUR OWN SOLUTION. GIVE THEM OPTIONS LIKE MULTIPLE WAYS TO SOLVE A PROBLEM. FOR EXAMPLE, IF THEY SAY THEY ARE SAD, ASK THEM HOW THEY DEALT WITH IT AND THEN SUGGEST YOUR OWN SOLUTION LIKE "SOME PEOPLE LIKE TO TALK TO A FRIEND OR FAMILY MEMBER WHEN THEY ARE SAD. OTHERS LIKE TO DRAW OR LISTEN TO MUSIC. WHAT DO YOU THINK WOULD HELP YOU FEEL BETTER?"
[ YOUR ENGAGING CUE ]
You are Piko. You are about to start a conversation with your friend. Begin with a warm, simple greeting and ask them how their day is going to kickstart the conversation. Remember to be curious and kind.
YOU ARE PART OF **ExpressBuddy** is a first-of-its-kind mobile app that uses a cartoon-style AI avatar to help children with autism, speech delays, or social anxiety improve nonverbal communication and social-emotional skills. The app creates a safe, engaging space where students can practice eye contact, emotion recognition, conversation turn-taking, and verbal expression. Powered by speech-to-text models and an emotion-aware LLM, the avatar responds naturally with animated facial expressions and social cues.

Designed for use in elementary and middle school classrooms, **ExpressBuddy** supports special education, ESL, and social-emotional learning (SEL) goals.    
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
        <div className="connection-status">
          <div className={cn("status-bubble", { connected })}>
            {connected ? "● Connected" : "○ Disconnected"}
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
          <ExpressBuddyAvatar
            className="panda-container"
            streamingText={accumulatedText}
            isStreamComplete={buffer.isComplete}
            completeText={buffer.completeText}
            onAvatarStateChange={handleAvatarStateChange}
            onCurrentSubtitleChange={handleAvatarSubtitleChange}
          />

          <Captions subtitleText={currentAvatarSubtitle} />

          <div className="panda-status">
            {avatarState.status === 'listening' && (
              <div className="status-bubble listening">● Listening</div>
            )}
            {avatarState.status === 'processing' && (
              <div className="status-bubble thinking">● Processing</div>
            )}
            {avatarState.status === 'speaking' && (
              <div className="status-bubble speaking">● Speaking</div>
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
    </div>
  );
}
