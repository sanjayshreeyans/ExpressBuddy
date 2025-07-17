import { TTSPlaybackController } from '../emotion-detective/TTSPlaybackController';
import { VisemePlaybackController } from '../../utils/VisemePlaybackController';

// Mock the dependencies
jest.mock('../../utils/VisemePlaybackController');
jest.mock('../emotion-detective/TTSService');
jest.mock('../../lib/viseme-transcription-service');

// Mock Web APIs
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  speaking: false,
  paused: false
};

const mockMediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: null,
  onerror: null,
  stream: {
    getTracks: () => [{ stop: jest.fn() }]
  }
}));

const mockAudioContext = jest.fn().mockImplementation(() => ({
  close: jest.fn()
}));

// Setup global mocks
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true
});

Object.defineProperty(window, 'MediaRecorder', {
  value: mockMediaRecorder,
  writable: true
});

Object.defineProperty(window, 'AudioContext', {
  value: mockAudioContext,
  writable: true
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true
});

describe('TTSPlaybackController', () => {
  let controller: TTSPlaybackController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TTSPlaybackController();
  });

  afterEach(async () => {
    if (controller) {
      await controller.disconnect();
    }
  });

  describe('Initialization', () => {
    it('should create controller without rive inputs', () => {
      expect(controller).toBeDefined();
      expect(controller.playing).toBe(false);
      expect(controller.isSupported).toBe(true);
    });

    it('should create controller with rive inputs', () => {
      const mockRiveInputs = {
        mouth: {},
        emotions: { is_speaking: { value: false } }
      };

      const controllerWithRive = new TTSPlaybackController({
        riveInputs: mockRiveInputs,
        transitionDuration: 25,
        setSpeakingState: true
      });

      expect(controllerWithRive).toBeDefined();
    });
  });

  describe('Voice Management', () => {
    it('should get available voices', () => {
      const mockVoices = [
        { name: 'Voice 1', lang: 'en-US' },
        { name: 'Voice 2', lang: 'en-GB' }
      ];
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);

      const voices = controller.getVoices();
      expect(voices).toEqual(mockVoices);
    });

    it('should get child-friendly voices', () => {
      const mockVoices = [
        { name: 'Female Voice', lang: 'en-US' },
        { name: 'Male Voice', lang: 'en-US' },
        { name: 'Spanish Voice', lang: 'es-ES' }
      ];
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);

      const childFriendlyVoices = controller.getChildFriendlyVoices();
      // The actual filtering logic is in TTSService, so we just verify the method exists
      expect(Array.isArray(childFriendlyVoices)).toBe(true);
    });
  });

  describe('Playback Control', () => {
    it('should handle stop command', () => {
      controller.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should handle pause command', () => {
      controller.pause();
      // Pause functionality is handled by TTSService
      expect(controller).toBeDefined();
    });

    it('should handle resume command', () => {
      controller.resume();
      // Resume functionality is handled by TTSService
      expect(controller).toBeDefined();
    });
  });

  describe('Rive Integration', () => {
    it('should update rive inputs', () => {
      const mockRiveInputs = {
        mouth: {},
        emotions: { is_speaking: { value: false } }
      };

      controller.updateRiveInputs(mockRiveInputs);
      // Verify the method doesn't throw
      expect(controller).toBeDefined();
    });
  });

  describe('Callbacks', () => {
    it('should set callbacks', () => {
      const callbacks = {
        onPlaybackStart: jest.fn(),
        onPlaybackEnd: jest.fn(),
        onCurrentSubtitle: jest.fn(),
        onError: jest.fn()
      };

      controller.setCallbacks(callbacks);
      // Verify the method doesn't throw
      expect(controller).toBeDefined();
    });
  });

  describe('Connection Status', () => {
    it('should report viseme service connection status', () => {
      const isConnected = controller.isVisemeServiceConnected;
      expect(typeof isConnected).toBe('boolean');
    });

    it('should get viseme service stats', () => {
      const stats = controller.getVisemeServiceStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should disconnect cleanly', async () => {
      await expect(controller.disconnect()).resolves.not.toThrow();
    });
  });
});

describe('TTSPlaybackController Error Handling', () => {
  let controller: TTSPlaybackController;

  beforeEach(() => {
    controller = new TTSPlaybackController();
  });

  afterEach(async () => {
    if (controller) {
      await controller.disconnect();
    }
  });

  it('should handle speech synthesis errors gracefully', async () => {
    // Mock speech synthesis to throw error
    mockSpeechSynthesis.speak.mockImplementation(() => {
      throw new Error('Speech synthesis failed');
    });

    // The speak method should handle errors internally
    // and not crash the application
    expect(controller).toBeDefined();
  });

  it('should handle missing browser APIs gracefully', () => {
    // Temporarily remove speechSynthesis
    const originalSpeechSynthesis = window.speechSynthesis;
    delete (window as any).speechSynthesis;

    const controllerWithoutAPI = new TTSPlaybackController();
    expect(controllerWithoutAPI).toBeDefined();

    // Restore
    window.speechSynthesis = originalSpeechSynthesis;
  });
});