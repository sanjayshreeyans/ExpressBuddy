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
  private audioQueue: { data: Uint8Array; wavData: Uint8Array; timestamp: number; sequenceId: number }[] = [];
  private isProcessing = false;
  private readonly serverUrl: string;
  private lastChunkTime = 0;
  private chunkInterval = 100; // Process chunks every 100ms for ultra-fast response
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private packetSequence = 0;
  private lastProcessedSequence = 0;
  private processingStats = {
    totalPacketsSent: 0,
    totalBytesStreamed: 0,
    averageProcessingTime: 0,
    packetsInQueue: 0
  };

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
            // Check if this is a JSON response or binary audio data
            if (typeof event.data === 'string') {
              const response: any = JSON.parse(event.data);
              const processingTime = performance.now() - this.lastChunkTime;
              
              // Handle connection confirmation (actual server format)
              if (response.type === 'connection' && response.status === 'connected') {
                this.isConnected = true;
                this.sessionId = response.session_id || `session_${Date.now()}`;
                this.callbacks.onConnected?.(this.sessionId!);
                console.log(`✅ VisemeTranscriptionService: Connected - ${response.message}`);
                console.log(`✅ Session ID: ${this.sessionId}`);
                resolve(true);
              } else if (response.type === 'streaming_chunk' && response.success) {
                // Real-time streaming chunk with partial visemes (ultra-fast response)
                console.log(`⚡ Streaming chunk received - Processing: ${processingTime.toFixed(2)}ms, Text: "${response.chunk_text}", Visemes: ${response.visemes?.length || 0}`);
                this.callbacks.onStreamingChunk?.(response.chunk_text || '', response.visemes || []);
              } else if (response.success && response.visemes && response.subtitles) {
                // Final results with full synchronization data
                console.log(`🎯 Final viseme results - Processing: ${processingTime.toFixed(2)}ms, Visemes: ${response.visemeCount}, Subtitles: ${response.subtitles.length}, Words: ${response.state_tracking?.total_words}, Phonemes: ${response.state_tracking?.total_phonemes}`);
                this.callbacks.onFinalResults?.(response);
                this.callbacks.onVisemes?.(response.visemes, response.subtitles);
                this.callbacks.onSubtitles?.(response.subtitles);
                
                // Update processing statistics
                this.processingStats.averageProcessingTime = 
                  (this.processingStats.averageProcessingTime * (this.processingStats.totalPacketsSent - 1) + processingTime) / this.processingStats.totalPacketsSent;
                  
              } else if (response.type === 'error') {
                console.error(`❌ VisemeTranscriptionService server error:`, response.message);
                this.callbacks.onError?.(response.message);
              } else {
                console.warn(`⚠️ VisemeTranscriptionService: Unexpected response format:`, response);
              }
            } else {
              // This is likely binary audio data or other non-JSON data
              console.log(`📡 VisemeTranscriptionService: Received binary data (${event.data.byteLength || event.data.length} bytes)`);
            }
          } catch (error) {
            console.error("❌ VisemeTranscriptionService: Error parsing response:", error);
            this.callbacks.onError?.("Failed to parse server response");
          }
        };

        this.websocket.onerror = (error) => {
          console.error("VisemeTranscriptionService: WebSocket error:", error);
          this.callbacks.onError?.("WebSocket connection error");
          reject(error);
        };

        this.websocket.onclose = (event) => {
          console.log(`🔌 VisemeTranscriptionService: WebSocket closed:`, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            reconnectAttempts: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
          });
          
          this.isConnected = false;
          this.sessionId = null;
          
          // Auto-reconnect if connection was lost unexpectedly and we haven't exceeded max attempts
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 VisemeTranscriptionService: Initiating auto-reconnect...`);
            this.attemptReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ VisemeTranscriptionService: Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            this.callbacks.onError?.(`Connection lost and max reconnection attempts (${this.maxReconnectAttempts}) exceeded`);
          }
        };
      });
    } catch (error) {
      console.error("VisemeTranscriptionService: Connection failed:", error);
      return false;
    }
  }

  public disconnect() {
    console.log("🛑 Viseme service: Starting disconnect...");
    
    // Log final statistics
    console.log("📊 Viseme service final stats:", {
      totalPacketsSent: this.processingStats.totalPacketsSent,
      totalBytesStreamed: `${(this.processingStats.totalBytesStreamed / 1024).toFixed(2)} KB`,
      packetsInQueue: this.audioQueue.length,
      averageProcessingTime: `${this.processingStats.averageProcessingTime.toFixed(2)}ms`
    });
    
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
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
    this.packetSequence = 0;
    this.lastProcessedSequence = 0;
    
    // Reset processing stats
    this.processingStats = {
      totalPacketsSent: 0,
      totalBytesStreamed: 0,
      averageProcessingTime: 0,
      packetsInQueue: 0
    };
    
    console.log("✅ Viseme service: Disconnect completed");
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // Exponential backoff, max 10s
    
    console.log(`🔄 VisemeTranscriptionService: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoffDelay}ms...`);
    
    this.reconnectTimeout = window.setTimeout(async () => {
      try {
        console.log(`🔄 VisemeTranscriptionService: Executing reconnection attempt ${this.reconnectAttempts}...`);
        const connected = await this.connect();
        
        if (connected) {
          console.log(`✅ VisemeTranscriptionService: Reconnection successful after ${this.reconnectAttempts} attempts`);
          this.reconnectAttempts = 0; // Reset on successful reconnection
        } else {
          throw new Error('Connection failed');
        }
      } catch (error) {
        console.error(`❌ VisemeTranscriptionService: Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`🔄 VisemeTranscriptionService: Scheduling next reconnection attempt...`);
          this.attemptReconnect();
        } else {
          console.error(`❌ VisemeTranscriptionService: All reconnection attempts exhausted (${this.maxReconnectAttempts})`);
          this.callbacks.onError?.(`Connection lost and all ${this.maxReconnectAttempts} reconnection attempts failed`);
        }
      }
    }, backoffDelay);
  }

  public async sendAudioChunk(audioData: Uint8Array): Promise<void> {
    const timestamp = performance.now();
    this.packetSequence++;
    const sequenceId = this.packetSequence;
    
    if (!this.isConnected || !this.websocket) {
      // Pre-convert to WAV and queue with metadata if not connected yet
      const wavData = this.convertPCMToWAV(audioData);
      this.audioQueue.push({ data: audioData, wavData, timestamp, sequenceId });
      console.log(`📦 Viseme service: Packet #${sequenceId} queued as WAV (${wavData.byteLength} bytes) - Not connected`);
      return;
    }

    // Ultra-fast processing: Send immediately without batching for real-time response
    const now = performance.now();
    
    // Process any queued audio first (maintain order)
    while (this.audioQueue.length > 0) {
      const queuedPacket = this.audioQueue.shift()!;
      // Use pre-converted WAV data
      this.websocket.send(queuedPacket.wavData);
      this.lastProcessedSequence = queuedPacket.sequenceId;
      
      // Update stats
      this.processingStats.totalPacketsSent++;
      this.processingStats.totalBytesStreamed += queuedPacket.data.byteLength;
      
      console.log(`📦 Viseme service: Queued packet #${queuedPacket.sequenceId} sent as WAV (${queuedPacket.wavData.byteLength} bytes) - Queue delay: ${(now - queuedPacket.timestamp).toFixed(2)}ms`);
    }

    // Convert raw PCM to WAV format for ultra-fast processing
    const wavData = this.convertPCMToWAV(audioData);
    
    // Send current audio chunk immediately as WAV
    this.websocket.send(wavData);
    this.lastProcessedSequence = sequenceId;
    this.lastChunkTime = now;
    
    // Update processing statistics
    this.processingStats.totalPacketsSent++;
    this.processingStats.totalBytesStreamed += audioData.byteLength;
    this.processingStats.packetsInQueue = this.audioQueue.length;
    
    console.log(`⚡ Viseme service: Packet #${sequenceId} sent as WAV (${wavData.byteLength} bytes) - Processing time: ${(performance.now() - timestamp).toFixed(2)}ms`);
    
    // Check for packet ordering issues
    if (sequenceId !== this.lastProcessedSequence) {
      console.warn(`⚠️ Viseme service: Potential packet ordering issue. Expected: ${this.lastProcessedSequence + 1}, Got: ${sequenceId}`);
    }
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
  
  public get queuedPackets(): number {
    return this.audioQueue.length;
  }
  
  public get processingStatistics() {
    return {
      ...this.processingStats,
      currentLatency: this.processingLatency,
      isUltraFast: this.isUltraFast,
      queuedPackets: this.queuedPackets
    };
  }
  
  public get packetsPerSecond(): number {
    const now = performance.now();
    const timeSinceStart = now - (this.lastChunkTime || now);
    return timeSinceStart > 0 ? (this.processingStats.totalPacketsSent / (timeSinceStart / 1000)) : 0;
  }

  /**
   * Ultra-fast PCM to WAV conversion for real-time streaming
   * Converts raw PCM16 data to WAV format with minimal overhead
   */
  private convertPCMToWAV(pcmData: Uint8Array): Uint8Array {
    const sampleRate = 24000; // Gemini Live API uses 24kHz
    const numChannels = 1; // Mono
    const bitsPerSample = 16; // 16-bit PCM
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    
    // WAV header size is 44 bytes
    const headerSize = 44;
    const dataSize = pcmData.length;
    const fileSize = headerSize + dataSize - 8;
    
    // Create WAV file buffer (ultra-fast typed array)
    const wavBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(wavBuffer);
    const bytes = new Uint8Array(wavBuffer);
    
    // WAV header (RIFF format) - optimized for speed
    let offset = 0;
    
    // "RIFF" chunk descriptor
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
    view.setUint32(offset, fileSize, true); offset += 4; // File size
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"
    
    // "fmt " sub-chunk
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
    view.setUint32(offset, 16, true); offset += 4; // Sub-chunk size
    view.setUint16(offset, 1, true); offset += 2; // Audio format (PCM = 1)
    view.setUint16(offset, numChannels, true); offset += 2; // Number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // Sample rate
    view.setUint32(offset, byteRate, true); offset += 4; // Byte rate
    view.setUint16(offset, blockAlign, true); offset += 2; // Block align
    view.setUint16(offset, bitsPerSample, true); offset += 2; // Bits per sample
    
    // "data" sub-chunk
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
    view.setUint32(offset, dataSize, true); offset += 4; // Data size
    
    // Copy PCM data (ultra-fast memcpy-style operation)
    bytes.set(pcmData, headerSize);
    
    return new Uint8Array(wavBuffer);
  }
}
