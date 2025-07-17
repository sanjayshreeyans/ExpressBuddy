import EmotionConfigService from '../EmotionConfigService';

describe('EmotionConfigService', () => {
  beforeAll(async () => {
    await EmotionConfigService.initialize();
  });

  test('should initialize successfully', () => {
    expect(EmotionConfigService.isInitialized()).toBe(true);
  });

  test('should get emotions for level', () => {
    const level1Emotions = EmotionConfigService.getEmotionsForLevel(1);
    expect(level1Emotions).toContain('happy');
    expect(level1Emotions).toContain('sad');
    expect(level1Emotions).toContain('angry');
    expect(level1Emotions).toContain('neutral');
  });

  test('should get available levels', () => {
    const levels = EmotionConfigService.getAvailableLevels();
    expect(levels).toContain(1);
    expect(levels).toContain(2);
    expect(levels.length).toBeGreaterThan(0);
  });

  test('should get emotion metadata', () => {
    const metadata = EmotionConfigService.getEmotionMetadata('happy');
    expect(metadata).not.toBeNull();
    expect(metadata?.description).toBeTruthy();
    expect(metadata?.scenarios.length).toBeGreaterThan(0);
    expect(metadata?.difficulty).toBeTruthy();
  });

  test('should get face-api emotion mapping', () => {
    const faceApiEmotion = EmotionConfigService.getFaceApiEmotion('happy');
    expect(faceApiEmotion).toBe('happy');
    
    const complexEmotion = EmotionConfigService.getFaceApiEmotion('excited');
    expect(complexEmotion).toBe('happy'); // Should map to basic emotion
  });

  test('should generate question text', () => {
    const questionText = EmotionConfigService.generateQuestionText(2, { emotion: 'happy' });
    expect(questionText).toContain('happy');
    expect(questionText).not.toContain('{emotion}');
  });

  test('should get emotions by difficulty', () => {
    const basicEmotions = EmotionConfigService.getEmotionsByDifficulty('basic');
    expect(basicEmotions).toContain('happy');
    expect(basicEmotions).toContain('sad');
  });

  test('should generate multiple choice options', () => {
    const options = EmotionConfigService.generateMultipleChoiceOptions('happy', 3);
    expect(options.length).toBe(4);
    expect(options).toContain('happy');
  });

  test('should get random scenario', () => {
    const scenario = EmotionConfigService.getRandomScenario('happy');
    expect(scenario).toBeTruthy();
    expect(typeof scenario).toBe('string');
  });

  test('should validate emotion availability', () => {
    expect(EmotionConfigService.isEmotionAvailable('happy')).toBe(true);
    expect(EmotionConfigService.isEmotionAvailable('nonexistent')).toBe(false);
  });

  test('should get complementary emotions', () => {
    const complementary = EmotionConfigService.getComplementaryEmotions('happy', 3);
    expect(complementary.length).toBeLessThanOrEqual(3);
    expect(complementary).not.toContain('happy');
  });

  test('should get configuration summary', () => {
    const summary = EmotionConfigService.getConfigSummary();
    expect(summary.totalEmotions).toBeGreaterThan(0);
    expect(summary.totalLevels).toBeGreaterThan(0);
    expect(summary.emotionsByDifficulty.basic).toBeGreaterThan(0);
  });
});