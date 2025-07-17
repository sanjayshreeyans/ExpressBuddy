import { 
  EmotionData, 
  EmotionMetadata, 
  QuestionData,
  EMOTION_LEVELS, 
  EMOTION_METADATA, 
  FACE_API_EMOTION_MAPPING, 
  QUESTION_TEMPLATES 
} from '../../types/emotion-detective';
import FaceImagesService from './FaceImagesService';

class EmotionConfigService {
  private initialized = false;

  /**
   * Initialize the emotion configuration service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Ensure face images service is initialized
    if (!FaceImagesService.isInitialized()) {
      await FaceImagesService.initialize();
    }

    this.initialized = true;
    console.log('Emotion configuration service initialized');
  }

  /**
   * Get emotions for a specific level
   */
  getEmotionsForLevel(level: number): string[] {
    const emotions = EMOTION_LEVELS[level as keyof typeof EMOTION_LEVELS];
    return emotions ? [...emotions] : [];
  }

  /**
   * Get all available emotion levels
   */
  getAvailableLevels(): number[] {
    return Object.keys(EMOTION_LEVELS).map(Number).sort((a, b) => a - b);
  }

  /**
   * Get emotion metadata
   */
  getEmotionMetadata(emotion: string): EmotionMetadata | null {
    return EMOTION_METADATA[emotion] || null;
  }

  /**
   * Get all emotion metadata
   */
  getAllEmotionMetadata(): Record<string, EmotionMetadata> {
    return { ...EMOTION_METADATA };
  }

  /**
   * Get face-api.js emotion mapping for a given emotion
   */
  getFaceApiEmotion(emotion: string): string {
    return FACE_API_EMOTION_MAPPING[emotion as keyof typeof FACE_API_EMOTION_MAPPING] || 'neutral';
  }

  /**
   * Get emotions that map to a specific face-api.js emotion
   */
  getEmotionsForFaceApiEmotion(faceApiEmotion: string): string[] {
    return Object.entries(FACE_API_EMOTION_MAPPING)
      .filter(([, mappedEmotion]) => mappedEmotion === faceApiEmotion)
      .map(([emotion]) => emotion);
  }

  /**
   * Get question template for a specific question type
   */
  getQuestionTemplate(type: 1 | 2 | 3 | 4): string {
    const templates = {
      1: QUESTION_TEMPLATES.type1,
      2: QUESTION_TEMPLATES.type2,
      3: QUESTION_TEMPLATES.type3,
      4: QUESTION_TEMPLATES.type4
    };
    return templates[type];
  }

  /**
   * Generate question text from template
   */
  generateQuestionText(type: 1 | 2 | 3 | 4, params: { emotion?: string; scenario?: string }): string {
    let template = this.getQuestionTemplate(type);
    
    if (params.emotion) {
      template = template.replace('{emotion}', params.emotion);
    }
    
    if (params.scenario) {
      template = template.replace('{scenario}', params.scenario);
    }
    
    return template;
  }

  /**
   * Get emotion data with face images
   */
  getEmotionData(emotion: string): EmotionData | null {
    const metadata = this.getEmotionMetadata(emotion);
    if (!metadata) {
      return null;
    }

    const faceImages = FaceImagesService.getFacesByEmotion(emotion);

    return {
      id: emotion,
      name: emotion,
      difficulty: metadata.difficulty,
      description: metadata.description,
      scenarios: metadata.scenarios,
      faceImages
    };
  }

  /**
   * Get multiple emotion data objects
   */
  getMultipleEmotionData(emotions: string[]): EmotionData[] {
    return emotions
      .map(emotion => this.getEmotionData(emotion))
      .filter((data): data is EmotionData => data !== null);
  }

  /**
   * Get emotions by difficulty level
   */
  getEmotionsByDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): string[] {
    return Object.entries(EMOTION_METADATA)
      .filter(([, metadata]) => metadata.difficulty === difficulty)
      .map(([emotion]) => emotion);
  }

  /**
   * Get random scenario for an emotion
   */
  getRandomScenario(emotion: string): string | null {
    const metadata = this.getEmotionMetadata(emotion);
    if (!metadata || metadata.scenarios.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * metadata.scenarios.length);
    return metadata.scenarios[randomIndex];
  }

  /**
   * Get multiple random scenarios for different emotions
   */
  getRandomScenariosForEmotions(emotions: string[]): Array<{ emotion: string; scenario: string }> {
    return emotions
      .map(emotion => {
        const scenario = this.getRandomScenario(emotion);
        return scenario ? { emotion, scenario } : null;
      })
      .filter((item): item is { emotion: string; scenario: string } => item !== null);
  }

  /**
   * Validate if an emotion is available in the system
   */
  isEmotionAvailable(emotion: string): boolean {
    return emotion in EMOTION_METADATA;
  }

  /**
   * Get emotions that are suitable for a specific age group
   * (Based on difficulty - basic for younger, advanced for older)
   */
  getEmotionsForAgeGroup(ageGroup: 'young' | 'middle' | 'older'): string[] {
    const difficultyMap = {
      young: ['basic'],
      middle: ['basic', 'intermediate'],
      older: ['basic', 'intermediate', 'advanced']
    };

    const allowedDifficulties = difficultyMap[ageGroup];
    
    return Object.entries(EMOTION_METADATA)
      .filter(([, metadata]) => allowedDifficulties.includes(metadata.difficulty))
      .map(([emotion]) => emotion);
  }

  /**
   * Generate wrong answer options for multiple choice questions
   */
  generateWrongAnswers(correctEmotion: string, count: number = 3): string[] {
    const allEmotions = Object.keys(EMOTION_METADATA);
    const wrongEmotions = allEmotions.filter(emotion => emotion !== correctEmotion);
    
    // Shuffle and take the requested count
    const shuffled = wrongEmotions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Generate multiple choice options (correct + wrong answers)
   */
  generateMultipleChoiceOptions(correctAnswer: string, wrongCount: number = 3): string[] {
    const wrongAnswers = this.generateWrongAnswers(correctAnswer, wrongCount);
    const allOptions = [correctAnswer, ...wrongAnswers];
    
    // Shuffle to randomize position of correct answer
    return allOptions.sort(() => Math.random() - 0.5);
  }

  /**
   * Get complementary emotions (emotions that work well together in questions)
   */
  getComplementaryEmotions(baseEmotion: string, count: number = 3): string[] {
    const metadata = this.getEmotionMetadata(baseEmotion);
    if (!metadata) {
      return [];
    }

    // Get emotions of similar difficulty level first
    const sameDifficulty = this.getEmotionsByDifficulty(metadata.difficulty)
      .filter(emotion => emotion !== baseEmotion);

    // If not enough, add from other difficulty levels
    if (sameDifficulty.length < count) {
      const otherEmotions = Object.keys(EMOTION_METADATA)
        .filter(emotion => emotion !== baseEmotion && !sameDifficulty.includes(emotion));
      sameDifficulty.push(...otherEmotions);
    }

    // Shuffle and return requested count
    const shuffled = sameDifficulty.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): {
    totalEmotions: number;
    totalLevels: number;
    emotionsByDifficulty: Record<string, number>;
    faceApiMappings: number;
  } {
    const emotionsByDifficulty = {
      basic: this.getEmotionsByDifficulty('basic').length,
      intermediate: this.getEmotionsByDifficulty('intermediate').length,
      advanced: this.getEmotionsByDifficulty('advanced').length
    };

    return {
      totalEmotions: Object.keys(EMOTION_METADATA).length,
      totalLevels: this.getAvailableLevels().length,
      emotionsByDifficulty,
      faceApiMappings: Object.keys(FACE_API_EMOTION_MAPPING).length
    };
  }
}

export default new EmotionConfigService();