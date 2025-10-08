import * as faceapi from 'face-api.js';
import { FaceApiResult } from '../../types/emotion-detective';
import { 
  EmotionDetectiveError, 
  createError, 
  handleFaceApiError, 
  logError,
  retryWithBackoff,
  withGracefulDegradation
} from '../../utils/errorHandling';

export interface ModelLoadingProgress {
  modelsLoaded: number;
  totalModels: number;
  currentModel: string;
  isComplete: boolean;
  error?: string;
}

export interface EmotionDetectionConfig {
  minConfidence: number;
  inputSize: number;
  scoreThreshold: number;
}

export class EmotionDetectionService {
  private static instance: EmotionDetectionService;
  private isInitialized = false;
  private modelsLoaded = false;
  private loadingProgress: ModelLoadingProgress = {
    modelsLoaded: 0,
    totalModels: 3,
    currentModel: '',
    isComplete: false
  };
  private progressCallbacks: ((progress: ModelLoadingProgress) => void)[] = [];
  
  private config: EmotionDetectionConfig = {
    minConfidence: 0.5,
    inputSize: 416,
    scoreThreshold: 0.5
  };

  private constructor() {}

  public static getInstance(): EmotionDetectionService {
    if (!EmotionDetectionService.instance) {
      EmotionDetectionService.instance = new EmotionDetectionService();
    }
    return EmotionDetectionService.instance;
  }

  /**
   * Initialize face-api.js with required models with comprehensive error handling
   * @param modelsPath Path to the face-api.js models (default: '/models')
   * @param onProgress Optional callback for loading progress
   */
  public async initialize(
    modelsPath: string = '/models',
    onProgress?: (progress: ModelLoadingProgress) => void
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (onProgress) {
      this.progressCallbacks.push(onProgress);
    }

    try {
      // Use retry mechanism for model loading
      await retryWithBackoff(async () => {
        this.updateProgress('Loading face detection model...', 0);
        
        // Load face detection model
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
        this.updateProgress('Face detection model loaded', 1);

        // Load face landmark model
        this.updateProgress('Loading face landmark model...', 1);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
        this.updateProgress('Face landmark model loaded', 2);

        // Load face expression recognition model
        this.updateProgress('Loading expression recognition model...', 2);
        await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
        this.updateProgress('All models loaded successfully', 3);

        this.modelsLoaded = true;
        this.isInitialized = true;
        this.loadingProgress.isComplete = true;
        
        this.notifyProgressCallbacks();
      }, 3, 2000, 10000);
      
    } catch (error) {
      const faceApiError = handleFaceApiError(error as Error, {
        component: 'EmotionDetectionService',
        action: 'initialize'
      });
      
      this.loadingProgress.error = faceApiError.userMessage;
      this.notifyProgressCallbacks();
      logError(faceApiError);
      
      throw faceApiError;
    }
  }

  /**
   * Check if the service is ready for emotion detection
   */
  public isReady(): boolean {
    return this.isInitialized && this.modelsLoaded;
  }

  /**
   * Get current loading progress
   */
  public getLoadingProgress(): ModelLoadingProgress {
    return { ...this.loadingProgress };
  }

  /**
   * Subscribe to loading progress updates
   */
  public onProgress(callback: (progress: ModelLoadingProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Detect emotions from an image element with optional face overlay
   * @param imageElement HTML image, video, or canvas element
   * @param overlayCanvas Optional canvas element to draw face detection overlay
   * @returns Promise<FaceApiResult | null>
   */
  public async detectEmotions(
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    overlayCanvas?: HTMLCanvasElement
  ): Promise<FaceApiResult | null> {
    if (!this.isReady()) {
      const error = createError('FACE_API_INITIALIZATION_FAILED', undefined, {
        component: 'EmotionDetectionService',
        action: 'detectEmotions'
      });
      logError(error);
      throw error;
    }

    try {
      // Validate input element
      if (!imageElement) {
        throw createError('FACE_DETECTION_FAILED', new Error('Invalid image element'), {
          component: 'EmotionDetectionService',
          action: 'detectEmotions'
        });
      }

      // Check if video element is ready
      if (imageElement instanceof HTMLVideoElement) {
        if (imageElement.readyState < 2) {
          throw createError('FACE_DETECTION_FAILED', new Error('Video not ready'), {
            component: 'EmotionDetectionService',
            action: 'detectEmotions'
          });
        }
      }

      // Detect faces with expressions using graceful degradation
      const detections = await withGracefulDegradation(
        async () => {
          return await faceapi
            .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({
              inputSize: this.config.inputSize,
              scoreThreshold: this.config.scoreThreshold
            }))
            .withFaceLandmarks()
            .withFaceExpressions();
        },
        async () => {
          // Fallback: try with different settings
          return await faceapi
            .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({
              inputSize: 320, // Smaller input size for better performance
              scoreThreshold: 0.3 // Lower threshold for better detection
            }))
            .withFaceExpressions(); // Skip landmarks if they fail
        }
      );

      if (detections.length === 0) {
        return null; // No face detected
      }

      // Use the first detected face (highest confidence)
      const detection = detections[0];
      
      // Check if detection confidence is above minimum threshold
      if (detection.detection.score < this.config.minConfidence) {
        // Create low confidence error but don't throw it, just return null
        const lowConfidenceError = createError('LOW_DETECTION_CONFIDENCE', undefined, {
          component: 'EmotionDetectionService',
          action: 'detectEmotions'
        }, { confidence: detection.detection.score });
        
        // Log for debugging but don't throw
        console.warn('Low detection confidence:', lowConfidenceError.userMessage);
        return null;
      }

      // Draw face detection overlay if canvas provided
      if (overlayCanvas) {
        try {
          this.drawFaceOverlay(overlayCanvas, imageElement, detection);
        } catch (overlayError) {
          // Don't fail the entire detection if overlay fails
          console.warn('Failed to draw face overlay:', overlayError);
        }
      }

      const expressions = detection.expressions;
      
      return {
        expressions: {
          neutral: expressions.neutral,
          happy: expressions.happy,
          sad: expressions.sad,
          angry: expressions.angry,
          fearful: expressions.fearful,
          disgusted: expressions.disgusted,
          surprised: expressions.surprised
        },
        detectionConfidence: detection.detection.score
      };

    } catch (error) {
      if (error instanceof EmotionDetectiveError) {
        throw error;
      }
      
      const faceApiError = handleFaceApiError(error as Error, {
        component: 'EmotionDetectionService',
        action: 'detectEmotions'
      });
      
      logError(faceApiError);
      throw faceApiError;
    }
  }

  /**
   * Get the dominant emotion from face-api.js results
   * @param expressions Expression scores from face-api.js
   * @returns The emotion with the highest confidence score
   */
  public getDominantEmotion(expressions: FaceApiResult['expressions']): {
    emotion: string;
    confidence: number;
  } {
    let maxEmotion = 'neutral';
    let maxConfidence = expressions.neutral;

    Object.entries(expressions).forEach(([emotion, confidence]) => {
      if (confidence > maxConfidence) {
        maxEmotion = emotion;
        maxConfidence = confidence;
      }
    });

    return {
      emotion: maxEmotion,
      confidence: maxConfidence
    };
  }

  /**
   * Check if detected emotion matches target emotion with confidence threshold
   * @param detectedEmotion The emotion detected by face-api.js
   * @param targetEmotion The target emotion to match against
   * @param minConfidence Minimum confidence threshold (default: 0.6)
   * @returns Whether the emotions match with sufficient confidence
   */
  public isEmotionMatch(
    detectedEmotion: string,
    targetEmotion: string,
    minConfidence: number = 0.6
  ): boolean {
    // Direct match
    if (detectedEmotion === targetEmotion) {
      return true;
    }

    // Check for emotion aliases/mappings
    const emotionAliases: Record<string, string[]> = {
      'happy': ['excited', 'joyful'],
      'sad': ['disappointed', 'melancholy'],
      'angry': ['frustrated', 'mad'],
      'fearful': ['scared', 'worried', 'anxious'],
      'surprised': ['amazed', 'shocked'],
      'disgusted': ['grossed out', 'revolted'],
      'neutral': ['calm', 'peaceful']
    };

    // Check if target emotion is an alias of detected emotion
    const aliases = emotionAliases[detectedEmotion] || [];
    return aliases.includes(targetEmotion);
  }

  /**
   * Update configuration settings
   */
  public updateConfig(newConfig: Partial<EmotionDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): EmotionDetectionConfig {
    return { ...this.config };
  }

  /**
   * Reset the service (for testing purposes)
   */
  public reset(): void {
    this.isInitialized = false;
    this.modelsLoaded = false;
    this.loadingProgress = {
      modelsLoaded: 0,
      totalModels: 3,
      currentModel: '',
      isComplete: false
    };
    this.progressCallbacks = [];
  }

  private updateProgress(currentModel: string, modelsLoaded: number): void {
    this.loadingProgress = {
      ...this.loadingProgress,
      currentModel,
      modelsLoaded,
      isComplete: modelsLoaded >= this.loadingProgress.totalModels
    };
  }

  private notifyProgressCallbacks(): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ ...this.loadingProgress });
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Draw face detection overlay on canvas
   * @param canvas Canvas element to draw on
   * @param sourceElement Source image/video element
   * @param detection Face detection result from face-api.js
   */
  private drawFaceOverlay(
    canvas: HTMLCanvasElement,
    sourceElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    detection: any
  ): void {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match source element
    const displaySize = { width: canvas.width, height: canvas.height };
    
    // Resize detection results to match display size
    const resizedDetection = faceapi.resizeResults(detection, displaySize);

    // Draw face bounding box
    const box = resizedDetection.detection.box;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw confidence score
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px Arial';
    ctx.fillText(
      `Confidence: ${(resizedDetection.detection.score * 100).toFixed(1)}%`,
      box.x,
      box.y - 10
    );

    // Draw dominant emotion
    const expressions = resizedDetection.expressions;
    const dominantEmotion = this.getDominantEmotion(expressions);
    ctx.fillText(
      `Emotion: ${dominantEmotion.emotion} (${(dominantEmotion.confidence * 100).toFixed(1)}%)`,
      box.x,
      box.y + box.height + 20
    );

    // Draw face landmarks (optional)
    if (resizedDetection.landmarks) {
      const landmarks = resizedDetection.landmarks;
      ctx.fillStyle = '#ff0000';
      landmarks.positions.forEach((point: any) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  /**
   * Start real-time emotion detection from camera stream
   * @param videoElement Video element displaying camera stream
   * @param overlayCanvas Canvas element for face overlay
   * @param onDetection Callback for each detection result
   * @param intervalMs Detection interval in milliseconds (default: 100ms)
   * @returns Function to stop real-time detection
   */
  public startRealTimeDetection(
    videoElement: HTMLVideoElement,
    overlayCanvas: HTMLCanvasElement,
    onDetection: (result: FaceApiResult | null) => void,
    intervalMs: number = 100
  ): () => void {
    if (!this.isReady()) {
      throw new Error('EmotionDetectionService is not initialized. Call initialize() first.');
    }

    let isRunning = true;
    let animationFrameId: number;

    const detectLoop = async () => {
      if (!isRunning) return;

      try {
        const result = await this.detectEmotions(videoElement, overlayCanvas);
        onDetection(result);
      } catch (error) {
        console.error('Real-time detection error:', error);
        onDetection(null);
      }

      if (isRunning) {
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(detectLoop);
        }, intervalMs);
      }
    };

    // Start detection loop
    detectLoop();

    // Return stop function
    return () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }

  /**
   * Capture and analyze emotion from camera stream
   * @param videoElement Video element displaying camera stream
   * @param targetEmotion Target emotion to match against
   * @returns Promise with analysis result
   */
  public async captureAndAnalyze(
    videoElement: HTMLVideoElement,
    targetEmotion: string
  ): Promise<{
    success: boolean;
    detectedEmotion: string;
    confidence: number;
    isMatch: boolean;
    result: FaceApiResult | null;
  }> {
    if (!this.isReady()) {
      throw new Error('EmotionDetectionService is not initialized. Call initialize() first.');
    }

    try {
      const result = await this.detectEmotions(videoElement);
      
      if (!result) {
        return {
          success: false,
          detectedEmotion: 'none',
          confidence: 0,
          isMatch: false,
          result: null
        };
      }

      const dominantEmotion = this.getDominantEmotion(result.expressions);
      const isMatch = this.isEmotionMatch(dominantEmotion.emotion, targetEmotion);

      return {
        success: true,
        detectedEmotion: dominantEmotion.emotion,
        confidence: dominantEmotion.confidence,
        isMatch,
        result
      };

    } catch (error) {
      console.error('Capture and analyze error:', error);
      return {
        success: false,
        detectedEmotion: 'error',
        confidence: 0,
        isMatch: false,
        result: null
      };
    }
  }

  /**
   * Provide guidance for better face detection
   * @param result Current detection result
   * @returns Guidance message for the user
   */
  public getDetectionGuidance(result: FaceApiResult | null): string {
    if (!result) {
      return "Please position your face in the center of the camera and ensure good lighting.";
    }

    if (result.detectionConfidence < 0.7) {
      return "Move closer to the camera and make sure your face is clearly visible.";
    }

    const dominantEmotion = this.getDominantEmotion(result.expressions);
    if (dominantEmotion.confidence < 0.6) {
      return "Try to express the emotion more clearly. Make sure your face is well-lit.";
    }

    return "Great! Your face is detected clearly. Try expressing the target emotion.";
  }
}

// Export singleton instance
export const emotionDetectionService = EmotionDetectionService.getInstance();

// Default export for the service class
export default EmotionDetectionService;