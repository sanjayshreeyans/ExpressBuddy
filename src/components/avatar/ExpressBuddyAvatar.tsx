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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { VisemePlaybackController } from '../../utils/VisemePlaybackController';
import { useRiveInputs } from '../../utils/riveInputs';
import { kokoroApiClient } from '../../utils/kokoroApiClient';
import { AvatarState, PlaybackState } from '../../types/avatar';

interface ExpressBuddyAvatarProps {
  className?: string;
  streamingText?: string;
  isStreamComplete?: boolean;
  completeText?: string;
  onAvatarStateChange?: (state: AvatarState) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onCurrentSubtitleChange?: (subtitle: string) => void;
}

export const ExpressBuddyAvatar: React.FC<ExpressBuddyAvatarProps> = ({
  className = '',
  isStreamComplete = false,
  completeText = '',
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playbackControllerRef = useRef<VisemePlaybackController | null>(null);
  const riveInputsInitialized = useRef(false);
  const lastProcessedText = useRef('');
  const subtitlesRef = useRef<Array<{ start: number; end: number; text: string }>>([]);

  // FIX: Correctly destructure `rive` and `RiveComponent` from the useRive hook.
  const { rive, RiveComponent } = useRive({
    src: '/pandabot.riv',
    stateMachines: 'InLesson',
    artboard: 'Character',
    animations: 'head_idle',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.TopCenter,
    }),
    onLoad: () => setIsLoaded(true),
    onLoadError: (err) => setError('Failed to load avatar animation.'),
  });

  // FIX: Pass the `rive` instance, not `RiveComponent.rive`.
  const riveInputs = useRiveInputs(rive);

  useEffect(() => {
    // FIX: Check for the `rive` instance, not `RiveComponent.rive`.
    if (isLoaded && rive) {
      playbackControllerRef.current = new VisemePlaybackController({
        riveInputs: null as any,
        transitionDuration: 21,
        setSpeakingState: true,
        manualSpeakingStateControl: false,
      });
      riveInputsInitialized.current = false;

      return () => {
        playbackControllerRef.current?.reset();
        playbackControllerRef.current = null;
      };
    }
    // FIX: Depend on the `rive` instance, not `RiveComponent.rive`.
  }, [isLoaded, rive]);

  useEffect(() => {
    if (playbackControllerRef.current && riveInputs && riveInputs.mouth && !riveInputsInitialized.current) {
      playbackControllerRef.current.updateRiveInputs(riveInputs);
      riveInputsInitialized.current = true;
    }
  }, [riveInputs]);

  useEffect(() => {
    onAvatarStateChange?.({
      status: isPlaying ? 'speaking' : isGeneratingTTS ? 'processing' : 'idle',
      isBuffering: isGeneratingTTS,
      hasGeneratedContent: duration > 0,
    });
  }, [isPlaying, isGeneratingTTS, duration, onAvatarStateChange]);

  useEffect(() => {
    const processCompleteText = async () => {
      if (!isStreamComplete || !completeText.trim() || completeText === lastProcessedText.current) {
        return;
      }

      lastProcessedText.current = completeText;
      setIsGeneratingTTS(true);
      setError(null);

      try {
        const ttsResponse = await kokoroApiClient.generateSpeech(completeText, 'af_heart', 1.0);
        const audio = new Audio(ttsResponse.audio_url);

        audio.onended = () => setIsPlaying(false);
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.onerror = () => setError('Audio playback failed');

        setAudioElement(audio);
        subtitlesRef.current = ttsResponse.subtitles || [];

        playbackControllerRef.current?.setAudioElement(audio);
        playbackControllerRef.current?.reset();
        playbackControllerRef.current?.add([...(ttsResponse.visemes || [])]);

        await audio.play();
        setIsPlaying(true);
        if (riveInputsInitialized.current) {
          playbackControllerRef.current?.play({});
        }
      } catch (err) {
        console.error('TTS or Playback Error:', err);
        setError('Failed to generate or play audio.');
      } finally {
        setIsGeneratingTTS(false);
      }
    };

    processCompleteText();
  }, [isStreamComplete, completeText]);


  useEffect(() => {
    onPlaybackStateChange?.({ isPlaying, currentTime, duration });
    if (isPlaying) {
      const currentSub = subtitlesRef.current.find(sub => currentTime >= sub.start && currentTime <= sub.end);
      onCurrentSubtitleChange?.(currentSub ? currentSub.text : '');
    } else {
        onCurrentSubtitleChange?.('');
    }
  }, [currentTime, isPlaying, duration, onPlaybackStateChange, onCurrentSubtitleChange]);

  const handleCharacterClick = useCallback(() => {
      if (error && audioElement) {
        audioElement.play().catch(() => setError('Audio playback failed'));
        return;
      }

      if (isPlaying) {
          audioElement?.pause();
          playbackControllerRef.current?.pause();
          setIsPlaying(false);
      } else if (audioElement) {
          audioElement.play();
          if (riveInputsInitialized.current) {
              playbackControllerRef.current?.play({});
          }
          setIsPlaying(true);
      }
  }, [isPlaying, audioElement, error]);

  useEffect(() => {
    return () => {
      if(audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    }
  }, [audioElement]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <RiveComponent
        className={`panda-container transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleCharacterClick}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">
          </div>
        </div>
      )}
    </div>
  );
};