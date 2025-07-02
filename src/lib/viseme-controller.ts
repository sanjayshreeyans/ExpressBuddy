/**
 * Simplified Viseme Playback Controller for ExpressBuddy Avatar
 * Based on PandabotLipsync implementation but adapted for streaming responses
 */

export interface VisemeData {
  phoneme: string;
  start_time: number;
  end_time: number;
}

export interface RiveInput {
  value: number | boolean;
  fire?: () => void;
}

export interface RiveInputs {
  mouth: {
    [key: number]: RiveInput;
  };
  emotions: {
    is_speaking: RiveInput;
    eyes_smile: RiveInput;
  };
  stress?: {
    stress: RiveInput;
  };
}

// Phoneme to Rive input mapping
const PHONEME_TO_VISEME_MAP: Record<string, number> = {
  'SIL': 100,    // Silence
  'AA': 101,     // father
  'AE': 102,     // cat
  'AH': 103,     // but
  'AO': 104,     // law
  'AW': 105,     // how
  'AY': 107,     // hide
  'B': 108,      // be
  'CH': 109,     // cheese
  'D': 110,      // dig
  'DH': 112,     // then
  'EH': 113,     // red
  'ER': 114,     // hurt
  'EY': 115,     // ate
  'F': 116,      // fork
  'G': 118,      // green
  'HH': 100,     // house (silence)
  'IH': 101,     // it
  'IY': 102,     // eat
  'JH': 109,     // judge
  'K': 108,      // cat
  'L': 114,      // lid
  'M': 108,      // mat
  'N': 110,      // no
  'NG': 118,     // sing
  'OW': 104,     // go
  'OY': 105,     // toy
  'P': 108,      // put
  'R': 114,      // red
  'S': 116,      // sit
  'SH': 115,     // she
  'T': 110,      // talk
  'TH': 116,     // think
  'UH': 103,     // book
  'UW': 104,     // you
  'V': 116,      // voice
  'W': 104,      // we
  'Y': 102,      // yes
  'Z': 116,      // zoo
  'ZH': 115      // measure
};

export class VisemePlaybackController {
  private riveInputs: RiveInputs;
  private currentVisemeIndex: number = 0;
  private visemes: VisemeData[] = [];
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private currentVisemeId: number = 100; // Default to silence

  constructor(riveInputs: RiveInputs) {
    this.riveInputs = riveInputs;
  }

  // Load visemes for playback
  loadVisemes(visemes: VisemeData[]) {
    this.visemes = visemes;
    this.currentVisemeIndex = 0;
    console.log(`Loaded ${visemes.length} visemes for playback`);
  }

  // Start viseme playback
  start() {
    if (this.visemes.length === 0) {
      console.warn('No visemes to play');
      return;
    }

    this.isPlaying = true;
    this.startTime = Date.now() / 1000; // Convert to seconds
    this.currentVisemeIndex = 0;
    
    // Set speaking state
    if (this.riveInputs.emotions.is_speaking) {
      this.riveInputs.emotions.is_speaking.value = true;
    }

    this.updateViseme();
    console.log('Viseme playback started');
  }

  // Stop viseme playback
  stop() {
    this.isPlaying = false;
    this.currentVisemeIndex = 0;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset to silence
    this.setViseme(100);
    
    // Clear speaking state
    if (this.riveInputs.emotions.is_speaking) {
      this.riveInputs.emotions.is_speaking.value = false;
    }

    console.log('Viseme playback stopped');
  }

  // Update viseme animation frame
  private updateViseme = () => {
    if (!this.isPlaying || this.visemes.length === 0) {
      return;
    }

    const currentTime = (Date.now() / 1000) - this.startTime;

    // Find the current viseme based on timing
    while (this.currentVisemeIndex < this.visemes.length) {
      const viseme = this.visemes[this.currentVisemeIndex];
      
      if (currentTime >= viseme.start_time && currentTime <= viseme.end_time) {
        // Set the current viseme
        const visemeId = PHONEME_TO_VISEME_MAP[viseme.phoneme] || 100;
        if (visemeId !== this.currentVisemeId) {
          this.setViseme(visemeId);
          this.currentVisemeId = visemeId;
        }
        break;
      } else if (currentTime > viseme.end_time) {
        // Move to next viseme
        this.currentVisemeIndex++;
      } else {
        // We're before this viseme, set to silence
        this.setViseme(100);
        this.currentVisemeId = 100;
        break;
      }
    }

    // Check if we've reached the end
    if (this.currentVisemeIndex >= this.visemes.length) {
      this.stop();
      return;
    }

    // Schedule next update
    this.animationFrameId = requestAnimationFrame(this.updateViseme);
  };

  // Set a specific viseme
  private setViseme(visemeId: number) {
    // Clear all mouth inputs first
    Object.keys(this.riveInputs.mouth).forEach(key => {
      const input = this.riveInputs.mouth[parseInt(key)];
      if (input) {
        input.value = false;
      }
    });

    // Set the target viseme
    const targetInput = this.riveInputs.mouth[visemeId];
    if (targetInput) {
      targetInput.value = true;
    }
  }

  // Reset the controller
  reset() {
    this.stop();
    this.visemes = [];
    this.currentVisemeIndex = 0;
    this.currentVisemeId = 100;
  }

  // Get current playing state
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}
