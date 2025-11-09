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

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";
// **NEW**: Import hint system hook (replaces silence detection)
import { useHintSystem, HintSystemConfig, HintSystemState, HintAnalytics } from "./use-hint-system";
// **NEW**: Import transcript service for saving conversation transcripts
import TranscriptService from "../services/transcript-service";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: Dispatch<SetStateAction<LiveConnectConfig>>;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  // Ultra-fast monitoring and debugging utilities
  getPacketStatistics: () => any;
  logPerformanceReport: () => any;
  // Simple audio control
  isBuffering: boolean;
  enableChunking: boolean;
  setEnableChunking: (enabled: boolean) => void;
  forceProcessAudio: () => void;
  replayLastAudio: () => void;
  // **NEW**: Manual hint system (replaces silence detection)
  hintSystem: {
    config: HintSystemConfig;
    updateConfig: (updates: Partial<HintSystemConfig>) => void;
    state: HintSystemState;
    triggerHint: () => Promise<void>;
    getAnalytics: () => HintAnalytics;
  };
  // **NEW**: Hint system state
  isHintIndicatorVisible: boolean;
  sendHintToGemini: (message: string) => Promise<void>;
  // **NEW**: Avatar animation callbacks
  onAITurnComplete: (callback: () => void) => void;
  onAITurnStart: (callback: () => void) => void;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");  // "models/gemini-live-2.5-flash-preview" "models/gemini-2.5-flash-native-audio-preview-09-2025"
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  // Ref to track up-to-date connection status inside callbacks
  const connectedRef = useRef(false);
  const [volume, setVolume] = useState(0);

  // **NEW**: Nudge indicator state
  const [isHintIndicatorVisible, setIsHintIndicatorVisible] = useState(false);

  // **NEW**: Avatar animation callback refs
  const aiTurnCompleteCallbackRef = useRef<(() => void) | null>(null);
  const aiTurnStartCallbackRef = useRef<(() => void) | null>(null);

  // Audio control
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [enableChunking, setEnableChunking] = useState<boolean>(true); // Allow disabling chunking for compatibility

  // **NEW**: Send hint to Gemini function
  const sendHintToGemini = useCallback(async (message: string) => {
    console.log('🔍 sendHintToGemini called with:', { message, connected, clientExists: !!client });

    if (!connected || !client) {
      console.error('❌ Cannot send hint - not connected to Gemini');
      console.error('❌ Connection state:', { connected, clientExists: !!client });
      throw new Error('Not connected to Gemini');
    }

    // **NEW**: Check if WebSocket/session is still active before sending
    if (client.status !== 'connected' || !client.session) {
      console.error('❌ Cannot send hint - WebSocket is not in connected state');
      console.error('❌ Client status:', client.status);
      throw new Error(`WebSocket is ${client.status}, cannot send message`);
    }

    try {
      console.log('📤 Sending hint text message to Gemini:', message);
      console.log('📤 Client send method type:', typeof client.send);

      // Send text message to Gemini using proper Part format
      const textPart = { text: message };
      console.log('📤 TextPart prepared:', textPart);

      const result = client.send(textPart, true);
      console.log('📤 Client.send result:', result);

      // **NEW**: Update activity timestamp when sending
      lastActivityTimeRef.current = Date.now();

      console.log('✅ Hint text message sent to Gemini successfully');

      // **NEW**: Save hint to transcript for conversation history
      if (TranscriptService.hasActiveSession()) {
        TranscriptService.addUserTranscription(`[HINT: ${message}]`, {
          type: 'hint',
          method: 'space_bar_hold',
          timestamp: new Date().toISOString()
        });
        console.log('📝 Hint saved to transcript');
      } else {
        console.log('📝 No active transcript session');
      }
    } catch (error) {
      console.error('❌ Failed to send hint to Gemini:', error);
      console.error('❌ Error details:', error);
      throw error;
    }
  }, [connected, client]);

  // **NEW**: Initialize hint system with callbacks
  const hintSystem = useHintSystem({
    onHintTriggered: sendHintToGemini,
    onShowHintIndicator: setIsHintIndicatorVisible,
    onAnalyticsEvent: (event: string, data: any) => {
      console.log(`📊 Hint Analytics - ${event}:`, data);
      // Could integrate with existing logger here
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

  // **NEW**: Keep-alive mechanism to prevent WebSocket timeout
  const keepAliveIntervalRef = useRef<number | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const KEEP_ALIVE_INTERVAL = 30000; // Send keep-alive every 30 seconds
  const IDLE_THRESHOLD = 60000; // Consider connection idle after 60 seconds

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

    // Reset playback state
    console.log("🎵 Reset audio playback");

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
      // Simplified audio processing without viseme sync
      console.log(`🎵 Playing audio immediately (${(combinedAudio.length / 1024).toFixed(2)} KB)`);

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
  }, []);

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

    // Note: Removed automatic silence detection - now using manual hint system

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
  }, [enableChunking, processCompleteAudio]);  // Removed silence detection dependency

  // **GEMINI INTERRUPTED** - User started speaking while AI was talking  
  const onGeminiInterrupted = useCallback(() => {
    console.log("🛑 Gemini interrupted by user - triggering AI interruption");

    // Note: Removed automatic silence detection reset - using manual hint system

    interruptAIPlayback();
  }, [interruptAIPlayback]);  // Removed silence detection dependency

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

  // Viseme callbacks removed - using simple hint button instead

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      connectedRef.current = true; // track via ref
    };

    const onClose = (event?: CloseEvent) => {
      setConnected(false);
      connectedRef.current = false;
      // Reset AI playing state when connection closes
      isAIPlayingRef.current = false;

      if (event) {
        console.log(`🔌 WebSocket closed: Code=${event.code}, Reason="${event.reason || 'No reason provided'}", Clean=${event.wasClean}`);

        // Log common WebSocket close codes
        const closeCodeMeanings: Record<number, string> = {
          1000: 'Normal closure',
          1001: 'Going away (browser navigating away)',
          1002: 'Protocol error',
          1003: 'Unsupported data',
          1006: 'Abnormal closure (no close frame)',
          1007: 'Invalid frame payload data',
          1008: 'Policy violation',
          1009: 'Message too big',
          1010: 'Mandatory extension missing',
          1011: 'Internal server error',
          1015: 'TLS handshake failure'
        };

        const meaning = closeCodeMeanings[event.code] || 'Unknown close code';
        console.log(`🔍 Close code meaning: ${meaning}`);
      }
    };

    const onError = (error: ErrorEvent) => {
      console.error("❌ WebSocket error occurred:", error);
      console.error("❌ Error details:", {
        message: error.message,
        type: error.type,
        target: error.target
      });

      // If error occurs, connection is likely failing
      setConnected(false);
      connectedRef.current = false;
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

      // **NEW**: Update activity timestamp on receiving audio
      lastActivityTimeRef.current = Date.now();

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

        // **2. Viseme service removed - using simple hint button instead**
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
    lastActivityTimeRef.current = Date.now(); // Reset activity tracker
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

    // Viseme service connection removed - using simple hint button instead

    // Small delay to ensure client is fully disconnected before reconnecting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Connect Gemini client with retry logic for reliability
    console.log("🤖 Connecting Gemini Live API...");
    const geminiConnectionStart = performance.now();

    let geminiConnected = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!geminiConnected && retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          console.log(`🔄 Retry attempt ${retryCount}/${maxRetries} for Gemini connection...`);
          // Exponential backoff: 500ms, 1000ms, 1500ms
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }

        geminiConnected = await client.connect(model, config);

        if (!geminiConnected) {
          console.warn(`⚠️ Gemini connection returned false on attempt ${retryCount + 1}`);
          retryCount++;
        }
      } catch (error) {
        console.error(`❌ Gemini connection error on attempt ${retryCount + 1}:`, error);
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }
      }
    }

    const geminiLatency = performance.now() - geminiConnectionStart;

    console.log(`🤖 Gemini client connection result: ${geminiConnected} - Connection latency: ${geminiLatency.toFixed(2)}ms - Attempts: ${retryCount + 1}`);

    if (!geminiConnected) {
      throw new Error(`Failed to connect to Gemini Live API after ${maxRetries} attempts. This may be due to:\n- Network connectivity issues\n- API key problems\n- Google API service issues\n- Rate limiting\n\nPlease check your internet connection and API key, then try again.`);
    }

    console.log("🎉 ExpressBuddy ultra-fast connection sequence completed!");

    // **NEW**: Start transcript session when successfully connected
    if (!TranscriptService.hasActiveSession()) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userId = options.userId;
      TranscriptService.startConversation(sessionId, userId);
      console.log("📝 Started transcript collection for session:", sessionId, userId ? `(User: ${userId})` : '');
    }

    // **NEW**: Start keep-alive mechanism to prevent WebSocket timeout
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }

    keepAliveIntervalRef.current = window.setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTimeRef.current;

      // Only send keep-alive if connection is idle
      if (timeSinceActivity > KEEP_ALIVE_INTERVAL && connected && client) {
        console.log(`💓 Keep-alive ping (idle for ${(timeSinceActivity / 1000).toFixed(1)}s)`);

        try {
          // Send a minimal text message as keep-alive
          // This keeps the WebSocket connection active without disrupting conversation
          client.send({ text: "" }, false); // Empty text with turnComplete=false
          lastActivityTimeRef.current = Date.now();
        } catch (error) {
          console.error("❌ Keep-alive ping failed:", error);
          console.error("⚠️ WebSocket may be in invalid state, connection might be lost");
        }
      }
    }, KEEP_ALIVE_INTERVAL);

    console.log(`💓 Keep-alive mechanism started (ping every ${KEEP_ALIVE_INTERVAL / 1000}s when idle)`);

    // Connection status logging removed - viseme service not needed

  }, [client, config, model, connected]);

  const disconnect = useCallback(async () => {
    console.log("🛑 Starting ExpressBuddy disconnect sequence...");

    // **NEW**: Stop keep-alive mechanism
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
      console.log("💓 Keep-alive mechanism stopped");
    }

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

    // Disconnect client
    client.disconnect();
    setConnected(false);

    // Viseme service disconnect removed - not needed for simple hint button

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
  }, [setConnected, client]);

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
      connectionStatus: {
        geminiConnected: connected,
      },
      synchronization: {
        audioStartTime: audioStartTimeRef.current,
        lastPacketTime: lastPacketTimeRef.current,
        currentSequence: packetSequenceRef.current
      }
    };
  }, [connected]);

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

  // Note: Volume monitoring for hint system not needed - using manual triggers only

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
    // Viseme service removed - using simple hint button instead
    // Debugging and monitoring utilities
    getPacketStatistics,
    logPerformanceReport,
    // Simple audio control
    isBuffering,
    enableChunking,
    setEnableChunking,
    forceProcessAudio,
    replayLastAudio,
    // **NEW**: Manual hint system (replaces silence detection)
    hintSystem,
    // **NEW**: Hint system state
    isHintIndicatorVisible,
    sendHintToGemini,
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
