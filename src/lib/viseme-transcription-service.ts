/**
 * Service for real-time audio transcription to visemes and subtitles
 * Connects to the viseme WebSocket server and handles streaming audio data
 */

export interface VisemeData {
  offset: number;
  visemeId: number;
}

export interface SubtitleData {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResponse {
  success: boolean;
  state_tracking: {
    total_words: number;
    total_phonemes: number;
    duration: number;
    processing_time: string;
  };
  subtitles: SubtitleData[];
  visemes: VisemeData[];
  visemeCount: number;
  message: string;
  type?: string;
  chunk_text?: string;
}

export interface TranscriptionCallbacks {
  onVisemes?: (visemes: VisemeData[], subtitles: SubtitleData[]) => void;
  onSubtitles?: (subtitles: SubtitleData[]) => void;
  onStreamingChunk?: (chunkText: string, visemes: VisemeData[]) => void;
  onError?: (error: string) => void;
  onConnected?: (sessionId: string) => void;
  onFinalResults?: (response: TranscriptionResponse) => void;
}

export class VisemeTranscriptionService {
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private sessionId: string | null = null;
  private callbacks: TranscriptionCallbacks = {};
  private audioQueue: Uint8Array[] = [];
  private isProcessing = false;
  private readonly serverUrl: string;
  private lastChunkTime = 0;
  private chunkInterval = 100; // Process chunks every 100ms for ultra-fast response
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(serverUrl: string = "ws://localhost:8000/stream-audio") {
    this.serverUrl = serverUrl;
  }

  public setCallbacks(callbacks: TranscriptionCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      this.websocket = new WebSocket(this.serverUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }

        this.websocket.onopen = () => {
          console.log("VisemeTranscriptionService: WebSocket connected");
        };

        this.websocket.onmessage = (event) => {
          try {
            const response: TranscriptionResponse = JSON.parse(event.data);
            
            if (response.type === 'connected' && response.success) {
              this.isConnected = true;
              this.sessionId = (response as any).session_id;
              this.callbacks.onConnected?.(this.sessionId!);
              console.log(`VisemeTranscriptionService: Connected with session ID: ${this.sessionId}`);
              resolve(true);
            } else if (response.type === 'streaming_chunk' && response.success) {
              // Real-time streaming chunk with partial visemes
              this.callbacks.onStreamingChunk?.(response.chunk_text || '', response.visemes || []);
            } else if (response.success && response.visemes && response.subtitles) {
              // Final results
              this.callbacks.onFinalResults?.(response);
              this.callbacks.onVisemes?.(response.visemes, response.subtitles);
              this.callbacks.onSubtitles?.(response.subtitles);
            } else if (response.type === 'error') {
              this.callbacks.onError?.(response.message);
            }
          } catch (error) {
            console.error("VisemeTranscriptionService: Error parsing response:", error);
            this.callbacks.onError?.("Failed to parse server response");
          }
        };

        this.websocket.onerror = (error) => {
          console.error("VisemeTranscriptionService: WebSocket error:", error);
          this.callbacks.onError?.("WebSocket connection error");
          reject(error);
        };

        this.websocket.onclose = (event) => {
          console.log("VisemeTranscriptionService: WebSocket closed:", event);
          this.isConnected = false;
          this.sessionId = null;
          
          // Auto-reconnect if connection was lost unexpectedly and we haven't exceeded max attempts
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      });
    } catch (error) {
      console.error("VisemeTranscriptionService: Connection failed:", error);
      return false;
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.sessionId = null;
    this.audioQueue = [];
    this.reconnectAttempts = 0;
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    console.log(`VisemeTranscriptionService: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectAttempts = 0; // Reset on successful reconnection
      } catch (error) {
        console.error('VisemeTranscriptionService: Reconnection failed:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          console.error('VisemeTranscriptionService: Max reconnection attempts reached');
          this.callbacks.onError?.('Connection lost and max reconnection attempts exceeded');
        }
      }
    }, 1000 * this.reconnectAttempts); // Exponential backoff
  }

  public async sendAudioChunk(audioData: Uint8Array): Promise<void> {
    if (!this.isConnected || !this.websocket) {
      // Queue audio if not connected yet
      this.audioQueue.push(audioData);
      return;
    }

    // Ultra-fast processing: Send immediately without batching for real-time response
    const now = performance.now();
    
    // Process any queued audio first
    while (this.audioQueue.length > 0) {
      const queuedAudio = this.audioQueue.shift()!;
      this.websocket.send(queuedAudio);
    }

    // Send current audio chunk immediately for crazy fast processing
    this.websocket.send(audioData);
    this.lastChunkTime = now;
  }

  public async requestFinalResults(): Promise<void> {
    if (!this.isConnected || !this.websocket) {
      return;
    }

    const request = { type: "get_results" };
    this.websocket.send(JSON.stringify(request));
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  public get currentSessionId(): string | null {
    return this.sessionId;
  }

  public get processingLatency(): number {
    return performance.now() - this.lastChunkTime;
  }

  public get isUltraFast(): boolean {
    return this.processingLatency < 50; // Under 50ms is considered ultra-fast
  }
}
