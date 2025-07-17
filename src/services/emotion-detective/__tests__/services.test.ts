import FaceImagesService from '../FaceImagesService';
import EmotionDetectionService from '../EmotionDetectionService';
import ProgressService from '../ProgressService';
import TTSService from '../TTSService';

describe('Emotion Detective Services', () => {
  describe('FaceImagesService', () => {
    test('should be importable', () => {
      expect(FaceImagesService).toBeDefined();
      expect(typeof FaceImagesService.initialize).toBe('function');
    });

    test('should have required methods', () => {
      expect(typeof FaceImagesService.getFacesByEmotion).toBe('function');
      expect(typeof FaceImagesService.getRandomFacesForEmotion).toBe('function');
      expect(typeof FaceImagesService.getAvailableEmotions).toBe('function');
    });
  });

  describe('EmotionDetectionService', () => {
    test('should be importable', () => {
      expect(EmotionDetectionService).toBeDefined();
      expect(typeof EmotionDetectionService.initializeModels).toBe('function');
    });

    test('should have required methods', () => {
      expect(typeof EmotionDetectionService.detectEmotions).toBe('function');
      expect(typeof EmotionDetectionService.getDominantEmotion).toBe('function');
      expect(typeof EmotionDetectionService.isEmotionMatch).toBe('function');
    });
  });

  describe('ProgressService', () => {
    test('should be importable', () => {
      expect(ProgressService).toBeDefined();
      expect(typeof ProgressService.calculateQuestionXP).toBe('function');
    });

    test('should calculate XP correctly', () => {
      const xp = ProgressService.calculateQuestionXP(true, true, 5, 1);
      expect(xp).toBeGreaterThan(0);
    });

    test('should determine level from XP', () => {
      const level = ProgressService.getLevelFromXP(150);
      expect(level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TTSService', () => {
    test('should be importable', () => {
      expect(TTSService).toBeDefined();
      expect(typeof TTSService.speak).toBe('function');
    });

    test('should have required methods', () => {
      expect(typeof TTSService.stop).toBe('function');
      expect(typeof TTSService.pause).toBe('function');
      expect(typeof TTSService.resume).toBe('function');
      expect(typeof TTSService.isSupported).toBe('function');
    });
  });
});