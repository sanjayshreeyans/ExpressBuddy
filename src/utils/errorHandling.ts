/**
 * Comprehensive error handling utilities for Emotion Detective Learning
 * Provides graceful degradation and user-friendly error messages
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  fallbackAction?: string;
}

export interface ErrorContext {
  component: string;
  action: string;
  timestamp: Date;
  userAgent?: string;
  additionalInfo?: Record<string, any>;
}

export class EmotionDetectiveError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly recoverable: boolean;
  public readonly context?: ErrorContext;
  public readonly fallbackAction?: string;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable: boolean = true,
    context?: ErrorContext,
    fallbackAction?: string
  ) {
    super(message);
    this.name = 'EmotionDetectiveError';
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.recoverable = recoverable;
    this.context = context;
    this.fallbackAction = fallbackAction;
  }
}

/**
 * Error codes and their corresponding error information
 */
export const ERROR_CODES: Record<string, Omit<ErrorInfo, 'code'>> = {
  // Camera errors
  CAMERA_ACCESS_DENIED: {
    message: 'Camera access was denied by the user',
    userMessage: 'Please allow camera access to continue with emotion mirroring activities.',
    severity: 'high',
    recoverable: true,
    fallbackAction: 'Skip mirroring and continue with identification activities'
  },
  CAMERA_NOT_FOUND: {
    message: 'No camera device found',
    userMessage: 'No camera was found on your device. You can still practice emotion identification!',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Continue with identification-only mode'
  },
  CAMERA_IN_USE: {
    message: 'Camera is being used by another application',
    userMessage: 'Your camera is being used by another app. Please close other apps and try again.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Retry camera access or skip mirroring'
  },
  CAMERA_HARDWARE_ERROR: {
    message: 'Camera hardware error occurred',
    userMessage: 'There was a problem with your camera. You can still practice emotion identification!',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Continue without camera features'
  },

  // Face-API errors
  FACE_API_MODELS_LOAD_FAILED: {
    message: 'Failed to load face-api.js models',
    userMessage: 'Having trouble loading the emotion detection system. Please check your internet connection.',
    severity: 'high',
    recoverable: true,
    fallbackAction: 'Retry loading or continue with manual verification'
  },
  FACE_API_INITIALIZATION_FAILED: {
    message: 'Face-api.js initialization failed',
    userMessage: 'The emotion detection system could not start. Please refresh the page and try again.',
    severity: 'high',
    recoverable: true,
    fallbackAction: 'Refresh page or use manual emotion verification'
  },
  FACE_DETECTION_FAILED: {
    message: 'Face detection failed',
    userMessage: 'Could not detect your face. Make sure you are facing the camera with good lighting.',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Adjust position and lighting, then try again'
  },
  LOW_DETECTION_CONFIDENCE: {
    message: 'Face detection confidence too low',
    userMessage: 'Having trouble seeing your face clearly. Try moving closer to the camera.',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Improve lighting and camera position'
  },

  // TTS and WebSocket errors
  TTS_NOT_SUPPORTED: {
    message: 'Text-to-speech not supported in this browser',
    userMessage: 'Voice narration is not available in your browser, but you can still read along!',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Continue with text-only mode'
  },
  TTS_SYNTHESIS_FAILED: {
    message: 'Speech synthesis failed',
    userMessage: 'Voice narration is temporarily unavailable. You can still read the text!',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Display text without audio'
  },
  WEBSOCKET_CONNECTION_FAILED: {
    message: 'WebSocket connection for lip-sync failed',
    userMessage: 'Avatar lip-sync is temporarily unavailable, but voice narration will continue.',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Continue with audio-only TTS'
  },
  WEBSOCKET_DISCONNECTED: {
    message: 'WebSocket connection lost',
    userMessage: 'Lost connection to avatar animation. Trying to reconnect...',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Attempt reconnection'
  },

  // Browser compatibility errors
  BROWSER_NOT_SUPPORTED: {
    message: 'Browser does not support required features',
    userMessage: 'Some features may not work in your browser. Consider using Chrome, Firefox, or Safari.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Enable basic mode with limited features'
  },
  WEBRTC_NOT_SUPPORTED: {
    message: 'WebRTC not supported',
    userMessage: 'Camera features are not available in your browser. You can still practice emotion identification!',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Continue without camera features'
  },

  // Network and loading errors
  NETWORK_ERROR: {
    message: 'Network connection error',
    userMessage: 'Having trouble connecting. Please check your internet connection and try again.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Retry connection or work offline'
  },
  RESOURCE_LOAD_FAILED: {
    message: 'Failed to load required resources',
    userMessage: 'Some content could not be loaded. Please refresh the page and try again.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Refresh page or use cached content'
  },

  // Data and session errors
  SESSION_SAVE_FAILED: {
    message: 'Failed to save session progress',
    userMessage: 'Could not save your progress. Your learning will continue, but progress may not be saved.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Continue session and retry saving'
  },
  PROGRESS_LOAD_FAILED: {
    message: 'Failed to load user progress',
    userMessage: 'Could not load your previous progress. Starting fresh for this session.',
    severity: 'low',
    recoverable: true,
    fallbackAction: 'Start with default progress'
  },

  // Generic errors
  UNKNOWN_ERROR: {
    message: 'An unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again or refresh the page.',
    severity: 'medium',
    recoverable: true,
    fallbackAction: 'Retry action or refresh page'
  }
};

/**
 * Create a standardized error with context
 */
export function createError(
  code: string,
  originalError?: Error,
  context?: Partial<ErrorContext>,
  additionalInfo?: Record<string, any>
): EmotionDetectiveError {
  const errorInfo = ERROR_CODES[code] || ERROR_CODES.UNKNOWN_ERROR;
  
  const fullContext: ErrorContext = {
    component: context?.component || 'Unknown',
    action: context?.action || 'Unknown',
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    additionalInfo: {
      originalError: originalError?.message,
      stack: originalError?.stack,
      ...additionalInfo
    }
  };

  return new EmotionDetectiveError(
    code,
    originalError?.message || errorInfo.message,
    errorInfo.userMessage,
    errorInfo.severity,
    errorInfo.recoverable,
    fullContext,
    errorInfo.fallbackAction
  );
}

/**
 * Error handler for camera access
 */
export function handleCameraError(error: Error, context: Partial<ErrorContext> = {}): EmotionDetectiveError {
  let errorCode = 'CAMERA_HARDWARE_ERROR';

  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    errorCode = 'CAMERA_ACCESS_DENIED';
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    errorCode = 'CAMERA_NOT_FOUND';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    errorCode = 'CAMERA_IN_USE';
  }

  return createError(errorCode, error, {
    component: 'CameraService',
    action: 'getUserMedia',
    ...context
  });
}

/**
 * Error handler for face-api.js
 */
export function handleFaceApiError(error: Error, context: Partial<ErrorContext> = {}): EmotionDetectiveError {
  let errorCode = 'FACE_API_INITIALIZATION_FAILED';

  if (error.message.includes('model') || error.message.includes('load')) {
    errorCode = 'FACE_API_MODELS_LOAD_FAILED';
  } else if (error.message.includes('detection') || error.message.includes('face')) {
    errorCode = 'FACE_DETECTION_FAILED';
  }

  return createError(errorCode, error, {
    component: 'EmotionDetectionService',
    action: 'faceDetection',
    ...context
  });
}

/**
 * Error handler for TTS
 */
export function handleTTSError(error: Error, context: Partial<ErrorContext> = {}): EmotionDetectiveError {
  let errorCode = 'TTS_SYNTHESIS_FAILED';

  if (error.message.includes('not supported') || error.message.includes('unavailable')) {
    errorCode = 'TTS_NOT_SUPPORTED';
  }

  return createError(errorCode, error, {
    component: 'TTSService',
    action: 'speechSynthesis',
    ...context
  });
}

/**
 * Error handler for WebSocket connections
 */
export function handleWebSocketError(error: Error, context: Partial<ErrorContext> = {}): EmotionDetectiveError {
  let errorCode = 'WEBSOCKET_CONNECTION_FAILED';

  if (error.message.includes('disconnect') || error.message.includes('close')) {
    errorCode = 'WEBSOCKET_DISCONNECTED';
  }

  return createError(errorCode, error, {
    component: 'WebSocketService',
    action: 'connection',
    ...context
  });
}

/**
 * Check browser compatibility
 */
export function checkBrowserCompatibility(): {
  isSupported: boolean;
  missingFeatures: string[];
  errors: EmotionDetectiveError[];
} {
  const missingFeatures: string[] = [];
  const errors: EmotionDetectiveError[] = [];

  // Check WebRTC support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    missingFeatures.push('Camera Access (WebRTC)');
    errors.push(createError('WEBRTC_NOT_SUPPORTED', undefined, {
      component: 'BrowserCompatibility',
      action: 'checkWebRTC'
    }));
  }

  // Check TTS support
  if (!('speechSynthesis' in window)) {
    missingFeatures.push('Text-to-Speech');
    errors.push(createError('TTS_NOT_SUPPORTED', undefined, {
      component: 'BrowserCompatibility',
      action: 'checkTTS'
    }));
  }

  // Check Canvas support
  if (!document.createElement('canvas').getContext) {
    missingFeatures.push('Canvas API');
    errors.push(createError('BROWSER_NOT_SUPPORTED', undefined, {
      component: 'BrowserCompatibility',
      action: 'checkCanvas'
    }));
  }

  // Check WebGL support (for face-api.js)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      missingFeatures.push('WebGL');
    }
  } catch (e) {
    missingFeatures.push('WebGL');
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures,
    errors
  };
}

/**
 * Log error for debugging and analytics
 */
export function logError(error: EmotionDetectiveError): void {
  const logData = {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    severity: error.severity,
    recoverable: error.recoverable,
    context: error.context,
    timestamp: new Date().toISOString()
  };

  // Console logging based on severity
  switch (error.severity) {
    case 'critical':
      console.error('🚨 CRITICAL ERROR:', logData);
      break;
    case 'high':
      console.error('❌ HIGH SEVERITY ERROR:', logData);
      break;
    case 'medium':
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
      break;
    case 'low':
      console.info('ℹ️ LOW SEVERITY ERROR:', logData);
      break;
  }

  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTracking(logData);
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Graceful degradation helper
 */
export function withGracefulDegradation<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T> | T,
  errorHandler?: (error: EmotionDetectiveError) => void
): Promise<T> {
  return primaryOperation().catch(async (error) => {
    const emotionError = error instanceof EmotionDetectiveError 
      ? error 
      : createError('UNKNOWN_ERROR', error);
    
    logError(emotionError);
    
    if (errorHandler) {
      errorHandler(emotionError);
    }

    return await fallbackOperation();
  });
}