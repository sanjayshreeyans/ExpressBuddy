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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";
import { VisemeTranscriptionService, VisemeData, SubtitleData } from "../lib/viseme-transcription-service";
// **NEW**: Import silence detection hook
import { useSilenceDetection, SilenceDetectionConfig, SilenceDetectionState, SilenceAnalytics } from "./use-silence-detection";
// **NEW**: Import transcript service for saving conversation transcripts
import TranscriptService from "../services/transcript-service";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  visemeService: VisemeTranscriptionService;
  currentVisemes: VisemeData[];
  currentSubtitles: SubtitleData[];
  // Ultra-fast monitoring and debugging utilities
  getPacketStatistics: () => any;
  logPerformanceReport: () => any;
  // Simple audio control
  isBuffering: boolean;
  enableChunking: boolean;
  setEnableChunking: (enabled: boolean) => void;
  forceProcessAudio: () => void;
  replayLastAudio: () => void;
  // **NEW**: Silence detection and nudge system
  silenceDetection: {
    config: SilenceDetectionConfig;
    updateConfig: (updates: Partial<SilenceDetectionConfig>) => void;
    state: SilenceDetectionState;
    triggerManualNudge: () => Promise<void>;
    resetSilenceTimer: () => void;
    getAnalytics: () => SilenceAnalytics;
  };
  // **NEW**: Nudge system state
  isNudgeIndicatorVisible: boolean;
  sendNudgeToGemini: (message: string) => Promise<void>;
  // **NEW**: Avatar animation callbacks
  onAITurnComplete: (callback: () => void) => void;
  onAITurnStart: (callback: () => void) => void;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const visemeService = useMemo(() => new VisemeTranscriptionService(), []);

  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  // Ref to track up-to-date connection status inside callbacks
  const connectedRef = useRef(false);
  const [volume, setVolume] = useState(0);
  const [currentVisemes, setCurrentVisemes] = useState<VisemeData[]>([]);
  const [currentSubtitles, setCurrentSubtitles] = useState<SubtitleData[]>([]);
  
  // **NEW**: Nudge indicator state
  const [isNudgeIndicatorVisible, setIsNudgeIndicatorVisible] = useState(false);
  
  // **NEW**: Avatar animation callback refs
  const aiTurnCompleteCallbackRef = useRef<(() => void) | null>(null);
  const aiTurnStartCallbackRef = useRef<(() => void) | null>(null);
  
  // Audio control
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [enableChunking, setEnableChunking] = useState<boolean>(true); // Allow disabling chunking for compatibility
  
  // **NEW**: Send nudge to Gemini function
  const sendNudgeToGemini = useCallback(async (message: string) => {
    if (!connected || !client) {
      throw new Error('Not connected to Gemini');
    }
    
    console.log('📤 Sending nudge text message to Gemini:', message);
    
    // Send text message to Gemini using proper text format (not binary input)
    client.send({ text: message }, true);
    
    console.log('✅ Nudge text message sent to Gemini successfully');
  }, [connected, client]);
  
  // **NEW**: Initialize silence detection with callbacks
  const silenceDetection = useSilenceDetection({
    onNudgeTriggered: sendNudgeToGemini,
    onShowNudgeIndicator: setIsNudgeIndicatorVisible,
    onAnalyticsEvent: (event: string, data: any) => {
      console.log(`📊 Silence Analytics - ${event}:`, data);
      // Could integrate with existing logger here
    },
    onSessionTerminated: () => {
      console.log('🚫 Session terminated due to maximum nudges reached');
      // Disconnect the client and show termination message
      if (connected) {
        disconnect();
      }
      // Show termination message
      alert("Session ended: Maximum interaction attempts reached. Please try again later.");
    },
  });
  
  // Audio buffer for waterfall processing
  const audioBufferRef = useRef<Uint8Array[]>([]);
  const chunkStartTimeRef = useRef<number | null>(null);
  const bufferedAudioDataRef = useRef<{ audio: Uint8Array; timestamp: number }[]>([]);
  const pendingCompleteAudioRef = useRef<Uint8Array | null>(null);
  const autoSendTimeoutRef = useRef<number | null>(null);
  const isProcessingAudioRef = useRef<boolean>(false); // Prevent double processing
  const lastCompleteAudioRef = useRef<Uint8Array | null>(null); // Store last audio for replay
  
  // Ultra-fast audio packet tracking and monitoring
  const packetSequenceRef = useRef(0);
  const audioStartTimeRef = useRef<number | null>(null);
  const lastPacketTimeRef = useRef<number>(0);
  
  // AI interruption state
  const isAIPlayingRef = useRef<boolean>(false);
  
  /*
   * AI INTERRUPTION SYSTEM:
   * 
   * This system ensures that when a user starts speaking while the AI is playing audio/visemes,
   * the AI immediately stops to give priority to the user. The implementation leverages Google's
   * built-in VAD (Voice Activity Detection) events:
   * 
   * 1. "turncomplete" - AI finished speaking naturally → process buffered audio normally
   * 2. "interrupted" - User started speaking while AI was talking → immediately stop AI playback
   * 
   * The system automatically:
   * - Stops AI audio playback via audioStreamer.stop()
   * - Clears current visemes and subtitles
   * - Discards any buffered audio to prioritize new user input
   * - Resets all processing state
   * 
   * No manual VAD or volume-based detection is needed - Google handles this internally.
   */
  const packetStatsRef = useRef({
    totalPackets: 0,
    totalBytes: 0,
    droppedPackets: 0,
    averageLatency: 0,
    maxLatency: 0,
    minLatency: Infinity
  });

  // **AI INTERRUPTION** - Stop AI audio/visemes when user starts speaking
  const interruptAIPlayback = useCallback(() => {
    if (!isAIPlayingRef.current) {
      return; // No AI playback to interrupt
    }
    
    console.log("🛑 INTERRUPTING AI: User started speaking");
    
    // Immediately stop audio playback
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      console.log("🔇 Stopped AI audio playback");
    }
    
    // Reset viseme playback by clearing current visemes
    setCurrentVisemes([]);
    setCurrentSubtitles([]);
    console.log("👄 Reset viseme and subtitle playback");
    
    // Clear any buffered audio to prioritize new user input
    audioBufferRef.current = [];
    pendingCompleteAudioRef.current = null;
    
    // Clear auto-send timeout if any
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    // Reset processing state
    isProcessingAudioRef.current = false;
    isAIPlayingRef.current = false;
    
    console.log("✅ AI interruption complete - ready for new user input");
  }, []);

  // **WATERFALL AUDIO PROCESSING** - Process complete audio response from Gemini
  const processCompleteAudio = useCallback(async () => {
    // Prevent double processing
    if (isProcessingAudioRef.current) {
      console.warn("⚠️ Audio processing already in progress, skipping duplicate call");
      return;
    }
    
    if (audioBufferRef.current.length === 0) {
      console.warn("⚠️ No audio data to process in complete response");
      return;
    }
    
    isProcessingAudioRef.current = true;
    const startTime = performance.now();
    
    // Combine all buffered audio into a single chunk
    const totalLength = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of audioBufferRef.current) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`🔄 Combined ${audioBufferRef.current.length} audio packets into ${(combinedAudio.length / 1024).toFixed(2)} KB for backend processing`);
    
    try {
      // **STEP 1: Send complete audio to backend for viseme processing**
      await visemeService.sendAudioChunk(combinedAudio);
      console.log(`✅ Complete audio sent to viseme service (${(combinedAudio.length / 1024).toFixed(2)} KB)`);
      
      // **STEP 2: Wait for viseme response and then play audio with sync**
      // The viseme response will trigger the viseme callbacks, and then we play the audio
      // Store the audio for synchronized playback when visemes arrive
      pendingCompleteAudioRef.current = combinedAudio;
      lastCompleteAudioRef.current = combinedAudio; // Keep for potential replay
      
    } catch (error) {
      console.error("❌ Failed to process complete audio:", error);
      
      // **FALLBACK: Play audio immediately without visemes**
      console.log("🔄 Falling back to immediate audio playback without sync");
      isAIPlayingRef.current = true;
      audioStreamerRef.current?.addPCM16(combinedAudio);
      lastCompleteAudioRef.current = combinedAudio; // Keep for potential replay
    } finally {
      // **STEP 3: Clean up buffers and timeout**
      audioBufferRef.current = [];
      bufferedAudioDataRef.current = [];
      chunkStartTimeRef.current = null;
      setIsBuffering(false);
      isProcessingAudioRef.current = false; // Reset processing flag
      
      // Clear any pending auto-send timeout
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
        autoSendTimeoutRef.current = null;
      }
      
      const processingTime = performance.now() - startTime;
      console.log(`⚡ Complete audio processing took ${processingTime.toFixed(2)}ms`);
    }
  }, [visemeService]);

  // **MANUAL FORCE SEND** - For emergency use when auto-detection fails
  const forceProcessAudio = useCallback(() => {
    console.log("🔧 Manual force: Processing buffered audio");
    if (enableChunking && audioBufferRef.current.length > 0) {
      processCompleteAudio();
    } else if (enableChunking) {
      console.warn("⚠️ No audio data buffered to force process");
    } else {
      console.warn("⚠️ Force process only works in waterfall (sync) mode");
    }
  }, [enableChunking, processCompleteAudio]);

  // **REPLAY AUDIO** - Replay the last complete audio file for debugging
  const replayLastAudio = useCallback(() => {
    if (lastCompleteAudioRef.current) {
      console.log("🔄 Replaying last complete audio file");
      isAIPlayingRef.current = true;
      audioStreamerRef.current?.addPCM16(lastCompleteAudioRef.current);
    } else {
      console.warn("⚠️ No audio available for replay");
    }
  }, []);

  // **WATERFALL COMPLETION HANDLER** - Process complete audio response
  // **GEMINI TURN COMPLETE** - AI finished speaking naturally
  const onGeminiTurnComplete = useCallback(() => {
    // Clear auto-send timeout since we got a completion event
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    // **NEW**: Only update conversation state if silence detection is enabled
    if (silenceDetection.config.enabled) {
      console.log('🎯 AI turn complete - transitioning to listening for user');
      silenceDetection.setConversationState('listening-for-user');
    }
    
    if (enableChunking && audioBufferRef.current.length > 0) {
      console.log(`🎯 Gemini turn complete! Processing full audio (${audioBufferRef.current.length} packets)`);
      processCompleteAudio();
    }
    
    console.log('🎯 GEMINI TURN COMPLETE - Triggering turn complete callback');
    
    // **CRITICAL**: Reset audio start time so next turn can trigger properly
    audioStartTimeRef.current = null;
    console.log('🔄 Reset audioStartTimeRef for next turn');
    
    // **NEW**: Call avatar animation callback
    if (aiTurnCompleteCallbackRef.current) {
      console.log('🎯 Calling aiTurnCompleteCallback');
      aiTurnCompleteCallbackRef.current();
    } else {
      console.warn('⚠️ aiTurnCompleteCallback is null - not registered!');
    }
  }, [enableChunking, processCompleteAudio, silenceDetection.config.enabled]);

  // **GEMINI INTERRUPTED** - User started speaking while AI was talking  
  const onGeminiInterrupted = useCallback(() => {
    console.log("🛑 Gemini interrupted by user - triggering AI interruption");
    
    // **NEW**: Only reset silence detection if enabled
    if (silenceDetection.config.enabled) {
      silenceDetection.resetSilenceTimer();
      silenceDetection.setConversationState('user-speaking');
    }
    
    interruptAIPlayback();
  }, [interruptAIPlayback, silenceDetection.config.enabled]);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        
        // Set up audio completion callback to reset AI playing flag
        if (audioStreamerRef.current) {
          audioStreamerRef.current.onComplete = () => {
            console.log("🔇 AI audio playback completed");
            isAIPlayingRef.current = false;
          };
        }
        
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  // Setup viseme service callbacks
  useEffect(() => {
    visemeService.setCallbacks({
      onVisemes: (visemes, subtitles) => {
        const now = performance.now();
        const latency = audioStartTimeRef.current ? now - audioStartTimeRef.current : 0;
        
        // Update latency statistics
        const stats = packetStatsRef.current;
        stats.averageLatency = (stats.averageLatency * stats.totalPackets + latency) / (stats.totalPackets + 1);
        stats.maxLatency = Math.max(stats.maxLatency, latency);
        stats.minLatency = Math.min(stats.minLatency, latency);
        
        console.log(`🎯 Viseme/Subtitle sync complete - Latency: ${latency.toFixed(2)}ms, Visemes: ${visemes.length}, Subtitles: ${subtitles.length}`);
        
        setCurrentVisemes(visemes);
        setCurrentSubtitles(subtitles);
        
        // **WATERFALL: Play audio immediately when visemes are ready**
        if (enableChunking && pendingCompleteAudioRef.current) {
          console.log(`🎵 Starting synchronized audio + viseme playback (${(pendingCompleteAudioRef.current.length / 1024).toFixed(2)} KB)`);
          
          // **CRITICAL**: Mark AI as playing and start audio playback to sync with visemes
          isAIPlayingRef.current = true;
          audioStreamerRef.current?.addPCM16(pendingCompleteAudioRef.current);
          pendingCompleteAudioRef.current = null;
          
          console.log(`✅ Audio and visemes synchronized successfully`);
        }
      },
      onStreamingChunk: (chunkText, visemes) => {
        const now = performance.now();
        const latency = audioStartTimeRef.current ? now - audioStartTimeRef.current : 0;
        
        console.log(`⚡ Real-time streaming chunk - Latency: ${latency.toFixed(2)}ms, Text: "${chunkText}", Visemes: ${visemes.length}`);
        
        // Update visemes in real-time for streaming chunks (ultra-fast response)
        setCurrentVisemes(visemes);
      },
      onError: (error) => {
        console.error("❌ Viseme service error:", error);
        packetStatsRef.current.droppedPackets++;
      },
      onConnected: (sessionId) => {
        console.log("✅ Viseme service connected with session:", sessionId);
        // Reset packet tracking on new connection
        packetSequenceRef.current = 0;
        audioStartTimeRef.current = null;
        lastPacketTimeRef.current = 0;
        packetStatsRef.current = {
          totalPackets: 0,
          totalBytes: 0,
          droppedPackets: 0,
          averageLatency: 0,
          maxLatency: 0,
          minLatency: Infinity
        };
      },
      onFinalResults: (response) => {
        const now = performance.now();
        const latency = audioStartTimeRef.current ? now - audioStartTimeRef.current : 0;
        
        console.log("🏁 Final viseme results received:", {
          latency: `${latency.toFixed(2)}ms`,
          visemeCount: response.visemeCount,
          subtitleCount: response.subtitles.length,
          processingTime: response.state_tracking.processing_time,
          totalWords: response.state_tracking.total_words,
          totalPhonemes: response.state_tracking.total_phonemes,
          duration: response.state_tracking.duration
        });
        
        setCurrentVisemes(response.visemes);
        setCurrentSubtitles(response.subtitles);
      }
    });
  }, [visemeService]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      connectedRef.current = true; // track via ref
    };

    const onClose = () => {
      setConnected(false);
      connectedRef.current = false;
      // Reset AI playing state when connection closes
      isAIPlayingRef.current = false;
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
    };

    const stopAudioStreamer = () => {
      // **CRITICAL FIX**: Don't stop audio in completion events - let audio play through naturally
      // audioStreamerRef.current?.stop(); // REMOVED: This was causing audio to cut off
      console.log("🎵 Audio streamer allowed to continue playing");
    };
    
    // **WATERFALL COMPLETION HANDLER** - Process complete audio response
    const onGeminiResponseComplete = () => {
      stopAudioStreamer(); // This now does nothing - just logs
      
      if (enableChunking && audioBufferRef.current.length > 0) {
        console.log(`🎯 Gemini response complete! Processing full audio (${audioBufferRef.current.length} packets)`);
        processCompleteAudio();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      const now = performance.now();
      const audioData = new Uint8Array(data);
      
      // **CRITICAL: Ultra-fast audio packet forwarding and tracking**
      packetSequenceRef.current++;
      const packetId = packetSequenceRef.current;
      const packetSize = audioData.byteLength;
      
      // Track timing for synchronization
      if (!audioStartTimeRef.current) {
        audioStartTimeRef.current = now;
        console.log('🎯 FIRST AI AUDIO PACKET - Triggering turn start callback');
        
        // **NEW**: Call avatar animation callback for turn start
        if (aiTurnStartCallbackRef.current) {
          console.log('🎯 Calling aiTurnStartCallback');
          aiTurnStartCallbackRef.current();
        } else {
          console.warn('⚠️ aiTurnStartCallback is null - not registered!');
        }
      }
      
      const timeSinceLastPacket = lastPacketTimeRef.current ? now - lastPacketTimeRef.current : 0;
      lastPacketTimeRef.current = now;
      
      // Update packet statistics
      const stats = packetStatsRef.current;
      stats.totalPackets++;
      stats.totalBytes += packetSize;
      
      // **LOG EVERY AUDIO PACKET** (as required)
      console.log(`📦 Audio packet #${packetId}:`, {
        size: `${packetSize} bytes`,
        timestamp: `${now.toFixed(2)}ms`,
        timeSinceLastPacket: `${timeSinceLastPacket.toFixed(2)}ms`,
        sequenceNumber: packetId,
        cumulativeBytes: stats.totalBytes,
        geminiConnected: connectedRef.current,
        visemeConnected: visemeService.connected,
        mode: enableChunking ? 'waterfall' : 'immediate',
        bufferedChunks: audioBufferRef.current.length
      });
      
      // **SIMPLE WATERFALL MODE** - Collect all audio, then send complete chunk
      if (enableChunking) {
        // **DO NOT PLAY AUDIO YET** - Wait for visemes to ensure perfect sync
        // audioStreamerRef.current?.addPCM16(audioData); // REMOVED - causes double playback
        
        // **COLLECT AUDIO FOR VISEMES** - Buffer audio until Gemini response is complete
        audioBufferRef.current.push(audioData);
        bufferedAudioDataRef.current.push({ audio: audioData, timestamp: now });
        
        // Start chunk timer if this is the first packet
        if (!chunkStartTimeRef.current) {
          chunkStartTimeRef.current = now;
          console.log(`🎬 Starting audio collection for complete response`);
          setIsBuffering(true);
        }
        
        // **AUTO-SEND TIMEOUT** - Send after 2 seconds of no new audio if no completion event
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current);
        }
        
        autoSendTimeoutRef.current = window.setTimeout(() => {
          if (audioBufferRef.current.length > 0 && !isProcessingAudioRef.current) {
            console.log(`⏰ Auto-sending buffered audio after timeout (${audioBufferRef.current.length} packets, no completion event detected)`);
            processCompleteAudio();
          } else if (isProcessingAudioRef.current) {
            console.log(`⏰ Auto-send timeout triggered but audio is already being processed`);
          }
        }, 100); // 100ms second timeout
        
        console.log(`📦 Buffered packet #${packetId} (${audioBufferRef.current.length} packets total) - Audio held for sync`);
      } else {
        // **IMMEDIATE MODE** - Legacy behavior for backward compatibility
        console.log(`⚡ Immediate mode: Processing packet #${packetId} individually`);
        
        // **1. IMMEDIATE FORWARDING TO AUDIO STREAMER** (for playback)
        isAIPlayingRef.current = true;
        audioStreamerRef.current?.addPCM16(audioData);
        
        // **2. IMMEDIATE FORWARDING TO VISEME SERVICE** (ultra-fast processing)
        visemeService.sendAudioChunk(audioData)
          .then(() => {
            const processingLatency = performance.now() - now;
            console.log(`⚡ Viseme service packet #${packetId} sent - Processing latency: ${processingLatency.toFixed(2)}ms`);
          })
          .catch((error) => {
            console.error(`❌ Failed to send packet #${packetId} to viseme service:`, error);
            stats.droppedPackets++;
          });
      }
      
      // **WARN FOR SYNCHRONIZATION ISSUES**
      if (timeSinceLastPacket > 100) { // More than 100ms gap
        console.warn(`⚠️ Potential packet delay detected: ${timeSinceLastPacket.toFixed(2)}ms gap between packets`);
      }
      
      if (stats.droppedPackets > 0 && packetId % 10 === 0) {
        console.warn(`⚠️ Packet loss detected: ${stats.droppedPackets}/${stats.totalPackets} packets dropped`);
      }
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", onGeminiInterrupted)
      .on("turncomplete", onGeminiTurnComplete)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", onGeminiInterrupted)
        .off("turncomplete", onGeminiTurnComplete)
        .off("audio", onAudio)
        .disconnect();
    };
  }, [client, enableChunking, processCompleteAudio, onGeminiTurnComplete, onGeminiInterrupted]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    
    console.log("🚀 Starting ExpressBuddy ultra-fast connection sequence...");
    
    // Reset all tracking variables
    packetSequenceRef.current = 0;
    audioStartTimeRef.current = null;
    lastPacketTimeRef.current = 0;
    isProcessingAudioRef.current = false; // Reset processing flag
    isAIPlayingRef.current = false; // Reset AI playing flag
    packetStatsRef.current = {
      totalPackets: 0,
      totalBytes: 0,
      droppedPackets: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity
    };
    
    // Ensure clean disconnection first
    console.log("🔄 Ensuring clean disconnection...");
    client.disconnect();
    visemeService.disconnect();
    
    // Connect viseme service independently (non-blocking, ultra-fast)
    console.log("🎯 Connecting viseme service (ultra-fast mode)...");
    const visemeConnectionStart = performance.now();
    
    visemeService.connect().then(() => {
      const visemeLatency = performance.now() - visemeConnectionStart;
      console.log(`✅ Viseme service connected successfully - Connection latency: ${visemeLatency.toFixed(2)}ms`);
    }).catch((error) => {
      console.warn("⚠️ Viseme service connection failed (continuing anyway):", error);
      // Continue even if viseme service fails - packets will be queued
    });
    
    // Small delay to ensure client is fully disconnected before reconnecting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Connect Gemini client independently
    console.log("🤖 Connecting Gemini Live API...");
    const geminiConnectionStart = performance.now();
    
    const geminiConnected = await client.connect(model, config);
    const geminiLatency = performance.now() - geminiConnectionStart;
    
    console.log(`🤖 Gemini client connection result: ${geminiConnected} - Connection latency: ${geminiLatency.toFixed(2)}ms`);
    
    if (!geminiConnected) {
      throw new Error("Failed to connect to Gemini Live API");
    }
    
    console.log("🎉 ExpressBuddy ultra-fast connection sequence completed!");
    
    // **NEW**: Start transcript session when successfully connected
    if (!TranscriptService.hasActiveSession()) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      TranscriptService.startConversation(sessionId);
      console.log("📝 Started transcript collection for session:", sessionId);
    }
    
    // Log final connection status
    setTimeout(() => {
      console.log("📊 Connection Status Summary:", {
        geminiConnected: connected,
        visemeConnected: visemeService.connected,
        totalConnectionTime: `${(performance.now() - visemeConnectionStart).toFixed(2)}ms`,
        readyForUltraFastSync: connected && visemeService.connected,
        transcriptSessionActive: TranscriptService.hasActiveSession()
      });
    }, 500);
    
  }, [client, config, model, visemeService, connected]);

  const disconnect = useCallback(async () => {
    console.log("🛑 Starting ExpressBuddy disconnect sequence...");
    
    // **NEW**: Save conversation transcript before disconnecting
    if (TranscriptService.hasActiveSession()) {
      console.log("📝 Goodbye! Saving your conversation transcript...");
      console.log("📋 Current transcript status:", TranscriptService.getSessionStatus());
      
      try {
        const saved = await TranscriptService.endConversationAndSave();
        if (saved) {
          console.log("✅ 👋 Goodbye! Your conversation transcript has been saved successfully!");
          console.log("📚 Your conversation is now stored and can be reviewed later.");
        } else {
          console.warn("⚠️ 😔 Sorry, we couldn't save your conversation transcript this time.");
          console.warn("💡 Please check your internet connection and Supabase settings.");
        }
      } catch (error) {
        console.error("❌ Error saving transcript on disconnect:", error);
        console.error("🔧 Debug info - Transcript save error details:", {
          errorMessage: error instanceof Error ? error.message : String(error),
          hasSupabaseEnv: !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY),
          supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? 'configured' : 'missing',
          supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'configured' : 'missing'
        });
        // Continue with disconnect even if transcript save fails
      }
    } else {
      console.log("📝 No active transcript session found - nothing to save.");
    }
    
    // Log final statistics before disconnecting
    const stats = packetStatsRef.current;
    console.log("📊 Final Session Statistics:", {
      totalPackets: stats.totalPackets,
      totalBytes: `${(stats.totalBytes / 1024).toFixed(2)} KB`,
      droppedPackets: stats.droppedPackets,
      packetLossRate: stats.totalPackets > 0 ? `${((stats.droppedPackets / stats.totalPackets) * 100).toFixed(2)}%` : "0%",
      averageLatency: `${stats.averageLatency.toFixed(2)}ms`,
      maxLatency: `${stats.maxLatency.toFixed(2)}ms`,
      minLatency: stats.minLatency === Infinity ? "N/A" : `${stats.minLatency.toFixed(2)}ms`
    });
    
    // Disconnect both services
    client.disconnect();
    visemeService.disconnect();
    setConnected(false);
    setCurrentVisemes([]);
    setCurrentSubtitles([]);
    
    // Reset all tracking variables
    packetSequenceRef.current = 0;
    audioStartTimeRef.current = null;
    lastPacketTimeRef.current = 0;
    isProcessingAudioRef.current = false; // Reset processing flag
    isAIPlayingRef.current = false; // Reset AI playing flag
    packetStatsRef.current = {
      totalPackets: 0,
      totalBytes: 0,
      droppedPackets: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity
    };
    
    console.log("✅ ExpressBuddy disconnect sequence completed");
  }, [setConnected, client, visemeService]);

  // Utility functions for monitoring and debugging
  const getPacketStatistics = useCallback(() => {
    const stats = packetStatsRef.current;
    
    return {
      audioPackets: {
        totalPackets: stats.totalPackets,
        totalBytes: stats.totalBytes,
        droppedPackets: stats.droppedPackets,
        packetLossRate: stats.totalPackets > 0 ? (stats.droppedPackets / stats.totalPackets) * 100 : 0,
        averageLatency: stats.averageLatency,
        maxLatency: stats.maxLatency,
        minLatency: stats.minLatency === Infinity ? 0 : stats.minLatency
      },
      visemeService: {
        connected: visemeService.connected,
        queueSize: 0 // TODO: Implement getQueueSize in viseme service
      },
      connectionStatus: {
        geminiConnected: connected,
        visemeConnected: visemeService.connected,
      },
      synchronization: {
        audioStartTime: audioStartTimeRef.current,
        lastPacketTime: lastPacketTimeRef.current,
        currentSequence: packetSequenceRef.current
      }
    };
  }, [connected, visemeService]);

  const logPerformanceReport = useCallback(() => {
    const report = getPacketStatistics();
    console.log("📊 ExpressBuddy Performance Report:", report);
    return report;
  }, [getPacketStatistics]);

  // Auto-logging every 30 seconds during active streaming
  useEffect(() => {
    if (!connected) return;
    
    const interval = setInterval(() => {
      if (packetStatsRef.current.totalPackets > 0) {
        logPerformanceReport();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [connected, logPerformanceReport]);

  // **NEW**: Integration with silence detection system (simplified to prevent loops)
  // Update volume for speech detection only
  useEffect(() => {
    if (silenceDetection.config.enabled) {
      silenceDetection.updateVolume(volume);
    }
  }, [volume, silenceDetection.config.enabled]); // Only depend on enabled flag to prevent loops

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
    visemeService,
    currentVisemes,
    currentSubtitles,
    // Debugging and monitoring utilities
    getPacketStatistics,
    logPerformanceReport,
    // Simple audio control
    isBuffering,
    enableChunking,
    setEnableChunking,
    forceProcessAudio,
    replayLastAudio,
    // **NEW**: Silence detection and nudge system
    silenceDetection,
    // **NEW**: Nudge system state
    isNudgeIndicatorVisible,
    sendNudgeToGemini,
    // **NEW**: Avatar animation callbacks
    onAITurnComplete: (callback: () => void) => {
      console.log('🔄 Registering AI turn complete callback');
      aiTurnCompleteCallbackRef.current = callback;
    },
    onAITurnStart: (callback: () => void) => {
      console.log('🔄 Registering AI turn start callback');
      aiTurnStartCallbackRef.current = callback;
    },
  };
}
