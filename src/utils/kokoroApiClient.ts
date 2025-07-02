import { VisemeData, VoiceData, TTSResponse } from '../types/avatar';

const API_BASE_URL = 'http://localhost:8000';

/**
 * API client for communicating with the Kokoro TTS backend
 * Adapted for ExpressBuddy integration
 */
export class KokoroApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch available voices from the backend
   */
  async getVoices(): Promise<VoiceData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voices`);
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Check if the backend is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Generate speech and visemes for given text
   * This is the main method used by ExpressBuddy to convert accumulated text to avatar speech
   */
  async generateSpeech(text: string, voiceId: string = 'af_heart', speed: number = 1.0): Promise<TTSResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speed,
          generate_visemes: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform the response to match our expected format
      return {
        success: result.success || true,
        audio_url: result.audio_url,
        visemes: result.visemes || [],
        subtitles: result.subtitles || [],
        duration: result.duration || 0,
        voice_id: result.voice_id || voiceId,
        text: result.text || text,
        timingMethod: result.timingMethod || 'unknown'
      };
    } catch (error) {
      console.error(`Error generating speech:`, error);
      throw error;
    }
  }

  /**
   * Get audio URL for a specific voice (for preloading)
   */
  getAudioUrl(filename: string): string {
    return `${this.baseUrl}/api/audio/${filename}`;
  }
}

// Default API client instance for ExpressBuddy
export const kokoroApiClient = new KokoroApiClient();
