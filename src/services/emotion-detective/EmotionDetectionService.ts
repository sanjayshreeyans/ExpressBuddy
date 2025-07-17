import * as faceapi from 'face-api.js';
import { FaceApiResult } from '../../types/emotion-detective';

class EmotionDetectionService {
  private modelsLoaded = false;
  private modelLoadingPromise: Promise<void> | null = null;

  /**
   * Initialize face-api.js models
   */
  async initializeModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = this.loadModels();
    return this.modelLoadingPromise;
  }

  private async loadModels(): Promise<void> {
    try {
      // Load required models for face detection and expression recognition
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      throw new Error('Failed to initialize emotion detection models');
    }
  }

  /**
   * Detect emotions from an image or video element
   */
  async detectEmotions(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceApiResult | null> {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded. Call initializeModels() first.');
    }

    try {
      const detections = await faceapi
        .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length === 0) {
        return null; // No face detected
      }

      // Use the first detected face
      const detection = detections[0];
      
      return {
        expressions: detection.expressions,
        detectionConfidence: detection.detection.score
      };
    } catch (error) {
      console.error('Error detecting emotions:', error);
      throw new Error('Failed to detect emotions from image');
    }
  }

  /**
   * Get the dominant emotion from face-api.js results
   */
  getDominantEmotion(expressions: FaceApiResult['expressions']): { emotion: string; confidence: number } {
    let maxConfidence = 0;
    let dominantEmotion = 'neutral';

    Object.entries(expressions).forEach(([emotion, confidence]) => {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        dominantEmotion = emotion;
      }
    });

    return { emotion: dominantEmotion, confidence: maxConfidence };
  }

  /**
   * Check if detected emotion matches target emotion with confidence threshold
   */
  isEmotionMatch(
    detectedExpressions: FaceApiResult['expressions'], 
    targetEmotion: string, 
    confidenceThreshold: number = 0.6
  ): { isMatch: boolean; confidence: number; detectedEmotion: string } {
    const { emotion: detectedEmotion, confidence } = this.getDominantEmotion(detectedExpressions);
    
    const isMatch = detectedEmotion === targetEmotion && confidence >= confidenceThreshold;
    
    return {
      isMatch,
      confidence,
      detectedEmotion
    };
  }

  /**
   * Check if models are loaded
   */
  areModelsLoaded(): boolean {
    return this.modelsLoaded;
  }
}

export default new EmotionDetectionService();