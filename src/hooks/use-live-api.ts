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
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const visemeService = useMemo(() => new VisemeTranscriptionService(), []);

  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const [currentVisemes, setCurrentVisemes] = useState<VisemeData[]>([]);
  const [currentSubtitles, setCurrentSubtitles] = useState<SubtitleData[]>([]);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
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
        setCurrentVisemes(visemes);
        setCurrentSubtitles(subtitles);
      },
      onStreamingChunk: (chunkText, visemes) => {
        // Update visemes in real-time for streaming chunks
        setCurrentVisemes(visemes);
      },
      onError: (error) => {
        console.error("Viseme service error:", error);
      },
      onConnected: (sessionId) => {
        console.log("Viseme service connected with session:", sessionId);
      },
      onFinalResults: (response) => {
        console.log("Final viseme results:", response);
        setCurrentVisemes(response.visemes);
        setCurrentSubtitles(response.subtitles);
      }
    });
  }, [visemeService]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) => {
      const audioData = new Uint8Array(data);
      
      // Send to audio streamer for playback
      audioStreamerRef.current?.addPCM16(audioData);
      
      // Send to viseme service for transcription (ultra fast processing)
      visemeService.sendAudioChunk(audioData);
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    
    // Connect viseme service first for ultra-fast processing
    try {
      await visemeService.connect();
      console.log("Viseme service connected successfully");
    } catch (error) {
      console.warn("Viseme service connection failed:", error);
      // Continue even if viseme service fails
    }
    
    await client.connect(model, config);
  }, [client, config, model, visemeService]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    visemeService.disconnect();
    setConnected(false);
    setCurrentVisemes([]);
    setCurrentSubtitles([]);
  }, [setConnected, client, visemeService]);

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
  };
}
