/**
 * Transcript Collection Service for ExpressBuddy
 * Collects input and output transcriptions from Gemini Live API and saves to Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TranscriptMessage {
  timestamp: number;
  speaker: 'user' | 'ai';
  text: string;
  transcriptionType: 'input' | 'output';
  confidence?: number;
  metadata?: {
    visemeCount?: number;
    audioLength?: number;
    processingTime?: number;
  };
}

export interface ConversationTranscript {
  id?: string;
  sessionId: string;
  createdAt: Date;
  endedAt?: Date;
  transcript: TranscriptMessage[];
  totalMessages: number;
  userMessageCount: number;
  aiMessageCount: number;
  conversationDurationSeconds: number;
  userAgent?: string;
  deviceInfo?: any;
}

export class TranscriptService {
  private supabase: SupabaseClient;
  private currentTranscript: TranscriptMessage[] = [];
  private sessionId: string | null = null;
  private userId: string | null = null;
  private conversationStartTime: number | null = null;
  private supabaseUrl?: string;
  private supabaseAnonKey?: string;
  // Buffer incremental fragments per speaker and flush on idle
  private pendingBuffers: { user: string; ai: string } = { user: '', ai: '' };
  private pendingMetadata: { user?: any; ai?: any } = {};
  private flushTimers: { user: number | null; ai: number | null } = { user: null, ai: null };
  private readonly FLUSH_IDLE_MS = 700; // idle window to merge fragments into an utterance
  private readonly AUTOSAVE_INTERVAL_MS = 60000;
  private autosaveTimer: number | null = null;
  private saveInFlight = false;
  private pendingAutosave = false;
  private unloadHandlerRegistered = false;
  private hasWarnedSupabase = false;
  private currentSavePromise: Promise<boolean> | null = null;

  private handlePageHide = (event: Event) => {
    const type = event.type || 'unknown';

    if (!this.sessionId) {
      return;
    }

    console.log(`🚪 Page visibility event detected (${type}) - attempting keep-alive transcript save`);

    this.flushAllBuffers(true);

    this.saveTranscriptSnapshot({
      markEnded: true,
      keepAlive: true,
      reason: `unload:${type}`
    }).catch((error: unknown) => {
      console.error('❌ Keep-alive transcript save failed during unload:', error);
    });
  };

  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ TranscriptService: Supabase credentials not found. Transcript saving disabled.');
    } else {
      this.supabaseUrl = supabaseUrl;
      this.supabaseAnonKey = supabaseKey;
    }

    this.supabase = createClient(
      supabaseUrl || 'dummy-url',
      supabaseKey || 'dummy-key'
    );
  }

  /**
   * Start a new conversation session
   */
  public startConversation(sessionId: string, userId?: string): void {
    console.log(`📝 Starting transcript collection for session: ${sessionId}`, userId ? `(User: ${userId})` : '');
    this.sessionId = sessionId;
    this.userId = userId || null;
    this.currentTranscript = [];
    this.conversationStartTime = Date.now();
    this.resetBuffers();
    this.cancelAutosaveTimer();
    this.pendingAutosave = false;
    this.saveInFlight = false;
    this.currentSavePromise = null;
    this.registerUnloadHandlers();
  }

  /**
   * Add a user input transcription (from speech-to-text)
   */
  public addUserTranscription(text: string, metadata?: any): void {
    if (!this.sessionId) {
      console.warn('⚠️ TranscriptService: Cannot add user transcription - no active session');
      return;
    }
    this.appendToBuffer('user', text, metadata);
  }

  /**
   * Add an AI output transcription (from Gemini Live API)
   */
  public addAITranscription(text: string, metadata?: any): void {
    if (!this.sessionId) {
      console.warn('⚠️ TranscriptService: Cannot add AI transcription - no active session');
      return;
    }
    this.appendToBuffer('ai', text, metadata);
  }

  /**
   * Append fragment to speaker buffer and schedule flush on idle.
   */
  private appendToBuffer(speaker: 'user' | 'ai', fragment: string, metadata?: any) {
    const frag = String(fragment ?? '');
    if (!frag) return;

    // Accumulate raw fragments; we'll normalize on flush.
    this.pendingBuffers[speaker] += frag;
    this.pendingMetadata[speaker] = metadata;

    // Re-schedule flush
    if (this.flushTimers[speaker]) {
      clearTimeout(this.flushTimers[speaker]!);
    }
    this.flushTimers[speaker] = (setTimeout(() => {
      this.flushBuffer(speaker);
    }, this.FLUSH_IDLE_MS) as unknown) as number;

    // If API signals finished, flush immediately
    if (metadata && (metadata.finished === true)) {
      this.flushBuffer(speaker);
    }
  }

  /**
   * Flush a single speaker buffer into the transcript as one utterance.
   */
  private flushBuffer(speaker: 'user' | 'ai', options: { skipAutosave?: boolean } = {}) {
    if (this.flushTimers[speaker]) {
      clearTimeout(this.flushTimers[speaker]!);
      this.flushTimers[speaker] = null;
    }

    const raw = this.pendingBuffers[speaker];
    const text = (raw || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    const message: TranscriptMessage = {
      timestamp: Date.now(),
      speaker,
      text,
      transcriptionType: speaker === 'user' ? 'input' : 'output',
      metadata: this.pendingMetadata[speaker]
    };

    this.currentTranscript.push(message);
    console.log(`📝 ${speaker === 'user' ? '✅ User' : '🤖 AI'} transcription added (${this.currentTranscript.length} total messages):`, {
      text: message.text.slice(0, 80),
      timestamp: new Date(message.timestamp).toLocaleTimeString(),
      sessionId: this.sessionId,
      totalMessages: this.currentTranscript.length
    });

    // Clear buffer
    this.pendingBuffers[speaker] = '';
    this.pendingMetadata[speaker] = undefined;

    if (!options.skipAutosave) {
      this.scheduleAutosave('flush');
    }
  }

  /**
   * Flush both speaker buffers.
   */
  private flushAllBuffers(skipAutosave: boolean = false) {
    this.flushBuffer('user', { skipAutosave });
    this.flushBuffer('ai', { skipAutosave });
  }

  private scheduleAutosave(trigger: 'flush' | 'manual' | 'queued' | 'timer' = 'manual') {
    if (!this.hasSupabaseCredentials() || !this.sessionId) {
      return;
    }

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = (setTimeout(() => {
      this.autosaveTimer = null;
      this.autosaveTranscript('timer').catch((error: unknown) => {
        console.error('❌ Autosave transcript error:', {
          error,
          trigger
        });
      });
    }, this.AUTOSAVE_INTERVAL_MS) as unknown) as number;
  }

  private cancelAutosaveTimer() {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  private async autosaveTranscript(trigger: 'flush' | 'manual' | 'queued' | 'timer') {
    if (!this.sessionId || this.currentTranscript.length === 0) {
      return;
    }

    console.log('💾 Autosave triggered', { trigger, messages: this.currentTranscript.length });

    const saved = await this.saveTranscriptSnapshot({
      markEnded: false,
      keepAlive: false,
      reason: `autosave:${trigger}`
    });

    if (!saved) {
      console.warn('⚠️ Autosave did not complete successfully. Will retry on next trigger.');
    }
  }

  private hasSupabaseCredentials(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey && this.supabaseUrl !== 'dummy-url');
  }

  /**
   * Reset buffers and timers.
   */
  private resetBuffers() {
    this.pendingBuffers = { user: '', ai: '' };
    this.pendingMetadata = {};
    if (this.flushTimers.user) clearTimeout(this.flushTimers.user);
    if (this.flushTimers.ai) clearTimeout(this.flushTimers.ai);
    this.flushTimers = { user: null, ai: null };
  }

  private buildConversationPayload(markEnded: boolean) {
    if (!this.sessionId) {
      return null;
    }

    const now = new Date();
    const conversationDurationSeconds = this.conversationStartTime
      ? Math.floor((now.getTime() - this.conversationStartTime) / 1000)
      : 0;

    const stats = {
      totalMessages: this.currentTranscript.length,
      userMessageCount: this.currentTranscript.filter(m => m.speaker === 'user').length,
      aiMessageCount: this.currentTranscript.filter(m => m.speaker === 'ai').length,
      conversationDurationSeconds
    };

    const conversationData = {
      session_id: this.sessionId,
      user_id: this.userId,
      created_at: new Date(this.conversationStartTime || now.getTime()).toISOString(),
      ended_at: markEnded ? now.toISOString() : null,
      transcript: this.currentTranscript,
      total_messages: stats.totalMessages,
      user_message_count: stats.userMessageCount,
      ai_message_count: stats.aiMessageCount,
      conversation_duration_seconds: stats.conversationDurationSeconds,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      device_info: typeof window !== 'undefined'
        ? {
          screen: {
            width: (window as any).screen?.width || 0,
            height: (window as any).screen?.height || 0
          },
          viewport: {
            width: (window as any).innerWidth,
            height: (window as any).innerHeight
          },
          language: (navigator as any)?.language,
          platform: (navigator as any)?.platform
        }
        : undefined
    } as const;

    return conversationData;
  }

  private async saveTranscriptSnapshot(options: { markEnded?: boolean; keepAlive?: boolean; reason?: string } = {}): Promise<boolean> {
    const { markEnded = false, keepAlive = false, reason = 'manual' } = options;

    if (!this.sessionId) {
      console.warn('⚠️ TranscriptService: No active session to save');
      return false;
    }

    if (!this.hasSupabaseCredentials()) {
      if (!this.hasWarnedSupabase) {
        console.warn('⚠️ TranscriptService: Supabase credentials missing - transcript saving skipped.');
        this.hasWarnedSupabase = true;
      }
      return false;
    }

    this.flushAllBuffers(true);

    const payload = this.buildConversationPayload(markEnded);

    if (!payload || payload.transcript.length === 0) {
      console.warn('⚠️ TranscriptService: No transcript data to save in snapshot');
      return false;
    }

    if (keepAlive) {
      return this.sendKeepAliveSave(payload, reason);
    }

    if (this.saveInFlight && this.currentSavePromise) {
      if (markEnded) {
        console.log('⏳ TranscriptService: Waiting for in-flight save before finalizing conversation');
        try {
          await this.currentSavePromise;
        } catch (waitError) {
          console.error('❌ Error while waiting for in-flight save to finish:', waitError);
        }

        return this.saveTranscriptSnapshot({ markEnded, keepAlive, reason });
      }

      console.log('⏳ TranscriptService: Save already in progress, queueing autosave');
      this.pendingAutosave = true;
      return false;
    }

    this.saveInFlight = true;

    const saveOperation = (async () => {
      try {
        const { data, error } = await this.supabase
          .from('conversation_transcripts')
          .upsert(payload, { onConflict: 'session_id' })
          .select();

        if (error) {
          console.error('❌ Supabase error during transcript snapshot save:', {
            error,
            reason
          });
          return false;
        }

        console.log('✅ Transcript snapshot saved successfully:', {
          reason,
          recordId: data?.[0]?.id,
          sessionId: data?.[0]?.session_id,
          messageCount: data?.[0]?.total_messages
        });

        return true;
      } catch (error) {
        console.error('❌ Unexpected error saving transcript snapshot:', {
          error,
          reason
        });
        return false;
      } finally {
        this.saveInFlight = false;
        this.currentSavePromise = null;

        const shouldProcessQueuedAutosave = this.pendingAutosave && !markEnded && Boolean(this.sessionId);
        this.pendingAutosave = false;

        if (shouldProcessQueuedAutosave) {
          this.autosaveTranscript('queued').catch((queueError: unknown) => {
            console.error('❌ Failed to process queued autosave:', queueError);
          });
        }
      }
    })();

    this.currentSavePromise = saveOperation;

    const result = await saveOperation;
    return result;
  }

  private async sendKeepAliveSave(payload: ReturnType<typeof this.buildConversationPayload>, reason: string): Promise<boolean> {
    if (!payload || !this.supabaseUrl || !this.supabaseAnonKey || typeof fetch !== 'function') {
      return false;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/conversation_transcripts?on_conflict=session_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify([payload]),
        keepalive: true
      });

      if (!response.ok) {
        console.error('❌ Keep-alive transcript save failed:', {
          status: response.status,
          statusText: response.statusText,
          reason
        });
        return false;
      }

      console.log('✅ Keep-alive transcript save succeeded:', { reason });
      return true;
    } catch (error) {
      console.error('❌ Error performing keep-alive transcript save:', {
        error,
        reason
      });
      return false;
    }
  }

  private registerUnloadHandlers() {
    if (typeof window === 'undefined' || this.unloadHandlerRegistered) {
      return;
    }

    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('beforeunload', this.handlePageHide);
    this.unloadHandlerRegistered = true;
    console.log('🛡️ TranscriptService: Registered unload handlers for transcript protection');
  }

  private unregisterUnloadHandlers() {
    if (typeof window === 'undefined' || !this.unloadHandlerRegistered) {
      return;
    }

    window.removeEventListener('pagehide', this.handlePageHide);
    window.removeEventListener('beforeunload', this.handlePageHide);
    this.unloadHandlerRegistered = false;
    console.log('🧹 TranscriptService: Unregistered unload handlers');
  }

  /**
   * Get current transcript without saving
   */
  public getCurrentTranscript(): TranscriptMessage[] {
    return [...this.currentTranscript];
  }

  /**
   * Get conversation statistics
   */
  public getConversationStats() {
    const userMessages = this.currentTranscript.filter(m => m.speaker === 'user');
    const aiMessages = this.currentTranscript.filter(m => m.speaker === 'ai');
    const duration = this.conversationStartTime
      ? Math.floor((Date.now() - this.conversationStartTime) / 1000)
      : 0;

    return {
      totalMessages: this.currentTranscript.length,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      conversationDurationSeconds: duration,
      sessionId: this.sessionId,
      startTime: this.conversationStartTime
    };
  }

  /**
   * End conversation and save transcript to Supabase
   */
  public async endConversationAndSave(): Promise<boolean> {
    console.log('🏁 Starting endConversationAndSave process...');

    if (!this.sessionId) {
      console.warn('⚠️ TranscriptService: No active session to save');
      return false;
    }

    console.log('📊 Session info:', {
      sessionId: this.sessionId,
      messageCount: this.currentTranscript.length,
      hasStartTime: !!this.conversationStartTime,
      messages: this.currentTranscript.map(m => ({ speaker: m.speaker, text: m.text.substring(0, 50) + '...' }))
    });

    if (this.currentTranscript.length === 0) {
      console.warn('⚠️ TranscriptService: No transcript messages to save - conversation had no transcribed content');
      this.clearSession();
      return false;
    }

    try {
      this.cancelAutosaveTimer();
      const saved = await this.saveTranscriptSnapshot({
        markEnded: true,
        reason: 'endConversation'
      });

      if (saved) {
        console.log('✅ 🎉 Transcript saved successfully to Supabase during endConversation!');
        this.clearSession();
      }

      return saved;

    } catch (error) {
      console.error('❌ 💥 Critical error saving transcript:', {
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        fullError: error
      });
      return false;
    }
  }

  /**
   * Clear current session data
   */
  public clearSession(): void {
    console.log('🧹 Clearing transcript session');
    this.sessionId = null;
    this.userId = null;
    this.currentTranscript = [];
    this.conversationStartTime = null;
    this.resetBuffers();
    this.cancelAutosaveTimer();
    this.pendingAutosave = false;
    this.saveInFlight = false;
    this.currentSavePromise = null;
    this.unregisterUnloadHandlers();
  }

  /**
   * Check if there's an active transcription session
   */
  public hasActiveSession(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Get current session status for debugging
   */
  public getSessionStatus() {
    return {
      hasSession: this.hasActiveSession(),
      sessionId: this.sessionId,
      messageCount: this.currentTranscript.length,
      messages: this.currentTranscript,
      conversationStartTime: this.conversationStartTime,
      userMessages: this.currentTranscript.filter(m => m.speaker === 'user').length,
      aiMessages: this.currentTranscript.filter(m => m.speaker === 'ai').length
    };
  }

  /**
   * Get recent transcripts from Supabase
   */
  public async getRecentTranscripts(limit: number = 10): Promise<ConversationTranscript[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_transcripts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching transcripts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching transcripts:', error);
      return [];
    }
  }

  /**
   * Force save transcript (for emergencies)
   */
  public async forceSave(): Promise<boolean> {
    if (!this.sessionId) {
      console.warn('⚠️ TranscriptService: No active session to force save');
      return false;
    }

    console.log('🚨 Force saving transcript...');
    return await this.endConversationAndSave();
  }
}

// Export singleton instance
const transcriptServiceInstance = new TranscriptService();
export default transcriptServiceInstance;
