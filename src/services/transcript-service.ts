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

class TranscriptService {
  private supabase: SupabaseClient;
  private currentTranscript: TranscriptMessage[] = [];
  private sessionId: string | null = null;
  private conversationStartTime: number | null = null;
  // Buffer incremental fragments per speaker and flush on idle
  private pendingBuffers: { user: string; ai: string } = { user: '', ai: '' };
  private pendingMetadata: { user?: any; ai?: any } = {};
  private flushTimers: { user: number | null; ai: number | null } = { user: null, ai: null };
  private readonly FLUSH_IDLE_MS = 700; // idle window to merge fragments into an utterance

  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ TranscriptService: Supabase credentials not found. Transcript saving disabled.');
    }

    this.supabase = createClient(
      supabaseUrl || 'dummy-url',
      supabaseKey || 'dummy-key'
    );
  }

  /**
   * Start a new conversation session
   */
  public startConversation(sessionId: string): void {
    console.log(`📝 Starting transcript collection for session: ${sessionId}`);
    this.sessionId = sessionId;
    this.currentTranscript = [];
    this.conversationStartTime = Date.now();
  this.resetBuffers();
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
  private flushBuffer(speaker: 'user' | 'ai') {
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
  }

  /**
   * Flush both speaker buffers.
   */
  private flushAllBuffers() {
    this.flushBuffer('user');
    this.flushBuffer('ai');
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
      // Ensure we capture any trailing fragments
      this.flushAllBuffers();
      console.log('💾 Attempting to save transcript to Supabase...');
      console.log('🔧 Supabase connection check:', {
        hasUrl: !!process.env.REACT_APP_SUPABASE_URL,
        hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? `${process.env.REACT_APP_SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
        supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'configured' : 'MISSING'
      });
      
      const now = new Date();
      const conversationDurationSeconds = this.conversationStartTime 
        ? Math.floor((now.getTime() - this.conversationStartTime) / 1000)
        : 0;

      // Calculate statistics
      const stats = {
        totalMessages: this.currentTranscript.length,
        userMessageCount: this.currentTranscript.filter(m => m.speaker === 'user').length,
        aiMessageCount: this.currentTranscript.filter(m => m.speaker === 'ai').length,
        conversationDurationSeconds
      };

      console.log('📈 Conversation statistics:', stats);

      // Build payload using snake_case column names to match DB schema
      const conversationData = {
        session_id: this.sessionId,
        created_at: new Date(this.conversationStartTime || now.getTime()).toISOString(),
        ended_at: now.toISOString(),
        transcript: this.currentTranscript,
        total_messages: stats.totalMessages,
        user_message_count: stats.userMessageCount,
        ai_message_count: stats.aiMessageCount,
        conversation_duration_seconds: stats.conversationDurationSeconds,
        user_agent: navigator.userAgent,
        device_info: {
          screen: {
            width: (window as any).screen?.width || 0,
            height: (window as any).screen?.height || 0
          },
          viewport: {
            width: (window as any).innerWidth,
            height: (window as any).innerHeight
          },
          language: (navigator as any).language,
          platform: (navigator as any).platform
        }
      } as const;

      console.log('📤 Sending data to Supabase:', {
        sessionId: conversationData.session_id,
        messageCount: conversationData.transcript.length,
        duration: conversationData.conversation_duration_seconds,
        userMessages: conversationData.user_message_count,
        aiMessages: conversationData.ai_message_count
      });

  const { data, error } = await this.supabase
        .from('conversation_transcripts')
        .insert([conversationData])
        .select();

      if (error) {
        console.error('❌ Supabase error saving transcript:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        
        // Check for specific RLS error
        if (error.code === '42501' || error.message.includes('policy')) {
          console.error('🔒 This looks like a Row Level Security (RLS) policy error!');
          console.error('💡 Suggestion: Check your Supabase RLS policies for the conversation_transcripts table');
        }
        
        return false;
      }

      console.log('✅ 🎉 Transcript saved successfully to Supabase!:', {
        recordId: data?.[0]?.id,
        sessionId: data?.[0]?.session_id,
        messageCount: data?.[0]?.total_messages,
        savedAt: new Date().toLocaleTimeString()
      });
      
      // Clear current session
      this.clearSession();
      
      return true;

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
    this.currentTranscript = [];
    this.conversationStartTime = null;
  this.resetBuffers();
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
