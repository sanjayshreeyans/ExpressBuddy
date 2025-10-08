import React, { useEffect, useRef, useState } from 'react';
import { emotionDetectionService, ModelLoadingProgress } from '../../services/emotion-detective/EmotionDetectionService';
import { FaceApiResult, FaceImageData, EmotionMirroringProps } from '../../types/emotion-detective';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { cameraService } from '../../services/emotion-detective/CameraService';
import {
  EmotionDetectiveError,
  createError,
  logError,
  withGracefulDegradation
} from '../../utils/errorHandling';
import {
  CameraErrorAlert,
  FaceApiErrorAlert,
  ErrorAlert
} from './ErrorAlerts';

export const EmotionMirroring: React.FC<EmotionMirroringProps> = ({
  targetEmotion,
  referenceImage,
  onMirroringComplete,
  onRetry
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<ModelLoadingProgress>({
    modelsLoaded: 0,
    totalModels: 3,
    currentModel: '',
    isComplete: false
  });
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FaceApiResult | null>(null);
  const [guidance, setGuidance] = useState<string>('');
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [captureResult, setCaptureResult] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const stopDetectionRef = useRef<(() => void) | null>(null);

  // Error handling states
  const [cameraError, setCameraError] = useState<EmotionDetectiveError | null>(null);
  const [faceApiError, setFaceApiError] = useState<EmotionDetectiveError | null>(null);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  // Initialize face-api.js models with comprehensive error handling
  useEffect(() => {
    const initializeModels = async () => {
      try {
        await withGracefulDegradation(
          async () => {
            await emotionDetectionService.initialize('/models', setLoadingProgress);
          },
          async () => {
            // Fallback: Try with different model path or reduced functionality
            console.warn('Primary model loading failed, trying fallback...');
            await emotionDetectionService.initialize('/models', setLoadingProgress);
          },
          (error) => {
            setFaceApiError(error);
            logError(error);
          }
        );

        setIsInitialized(true);
        setFaceApiError(null);
        console.log('Face-api.js models loaded successfully for mirroring!');
      } catch (error) {
        const faceApiError = error instanceof EmotionDetectiveError
          ? error
          : createError('FACE_API_MODELS_LOAD_FAILED', error as Error, {
            component: 'EmotionMirroring',
            action: 'initializeModels'
          });

        setFaceApiError(faceApiError);
        setLoadingProgress(prev => ({ ...prev, error: faceApiError.userMessage }));
        logError(faceApiError);
      }
    };

    initializeModels();
  }, []);

  // Start camera with comprehensive error handling
  const startCamera = async () => {
    try {
      setCameraError(null);
      console.log('🎥 [MIRRORING] Starting camera for emotion mirroring...');

      // Use camera service with graceful degradation
      const stream = await withGracefulDegradation(
        async () => {
          return await cameraService.requestCameraAccess({
            width: 640,
            height: 480,
            facingMode: 'user'
          });
        },
        async () => {
          // Fallback: Try with basic constraints
          return await cameraService.requestCameraAccessWithFallback({
            width: 320,
            height: 240,
            facingMode: 'user'
          });
        },
        (error) => {
          setCameraError(error);
          logError(error);
        }
      );

      console.log('🎥 [MIRRORING] Camera stream obtained successfully!');
      setVideoStream(stream);
      setCameraActive(true);
      setCameraError(null);

      // Set up video element with proper error handling
      setTimeout(() => {
        if (videoRef.current && stream) {
          // Clear any existing srcObject first to prevent conflicts
          if (videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
          }
          
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready before playing
          const handleCanPlay = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('🎥 [MIRRORING] Video playing successfully');
                // Wait a bit more before starting detection to ensure video is stable
                setTimeout(() => {
                  startRealTimeDetection();
                }, 500);
              }).catch((playError) => {
                // Only log non-abort errors (abort errors are normal when switching streams)
                if (playError.name !== 'AbortError') {
                  console.error('🎥 [MIRRORING] Video play() failed:', playError);
                  const cameraPlayError = createError('CAMERA_HARDWARE_ERROR', playError, {
                    component: 'EmotionMirroring',
                    action: 'videoPlay'
                  });
                  setCameraError(cameraPlayError);
                }
              });
              
              // Remove the event listener after use
              videoRef.current.removeEventListener('canplay', handleCanPlay);
            }
          };
          
          videoRef.current.addEventListener('canplay', handleCanPlay);
        }
      }, 200); // Increased timeout to give more time for stream setup
    } catch (error) {
      const cameraError = error instanceof EmotionDetectiveError
        ? error
        : createError('CAMERA_HARDWARE_ERROR', error as Error, {
          component: 'EmotionMirroring',
          action: 'startCamera'
        });

      setCameraError(cameraError);
      setGuidance(cameraError.userMessage);
      logError(cameraError);
    }
  };

  // Auto-start camera when component mounts and models are ready
  useEffect(() => {
    if (isInitialized && !cameraActive && !cameraError) {
      startCamera();
    }
  }, [cameraActive, cameraError, isInitialized, startCamera]);

  // Subscribe to camera status changes
  useEffect(() => {
    const unsubscribe = cameraService.onStatusChange((status) => {
      setVideoStream(status.stream);
      setCameraActive(status.isActive);

      if (status.error) {
        setCameraError(status.error);
        setGuidance(status.error.userMessage);
      } else {
        setCameraError(null);
      }
    });

    return unsubscribe;
  }, []);

  // Stop camera using camera service
  const stopCamera = async () => {
    try {
      await cameraService.stopCamera();

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setVideoStream(null);
      setCameraActive(false);
      setCameraError(null);

      // Stop real-time detection if active
      if (stopDetectionRef.current) {
        stopDetectionRef.current();
        stopDetectionRef.current = null;
        setIsRealTimeActive(false);
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  // Start real-time detection with better error handling
  const startRealTimeDetection = () => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) {
      console.log('🚫 Cannot start detection - missing requirements');
      return;
    }

    // Check if video is actually ready
    if (videoRef.current.readyState < 2) {
      console.log('⏳ Video not ready yet, waiting...');
      // Try again after a short delay
      setTimeout(() => {
        startRealTimeDetection();
      }, 500);
      return;
    }

    console.log('🎯 Starting real-time emotion detection');
    
    const stopFn = emotionDetectionService.startRealTimeDetection(
      videoRef.current,
      canvasRef.current,
      (result) => {
        setDetectionResult(result);
        const guidanceText = emotionDetectionService.getDetectionGuidance(result);
        setGuidance(guidanceText);
      },
      300 // Increased interval to 300ms for better stability
    );

    stopDetectionRef.current = stopFn;
    setIsRealTimeActive(true);
  };

  // Stop real-time detection
  const stopRealTimeDetection = () => {
    if (stopDetectionRef.current) {
      stopDetectionRef.current();
      stopDetectionRef.current = null;
      setIsRealTimeActive(false);
      setDetectionResult(null);
      setGuidance('');

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };

  // Capture and analyze emotion with enhanced confidence scoring
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !isInitialized || isCapturing) return;

    setIsCapturing(true);
    setAttempts(prev => prev + 1);

    try {
      const result = await emotionDetectionService.captureAndAnalyze(
        videoRef.current,
        targetEmotion
      );

      setCaptureResult(result);
      console.log('Mirroring capture result:', result);

      // Enhanced score calculation with multiple factors
      let score = 0;
      if (result.success && result.result) {
        // Base score on detection confidence (0-40 points)
        const detectionScore = Math.round(result.result.detectionConfidence * 40);

        // Emotion confidence score (0-40 points)
        const emotionScore = Math.round(result.confidence * 40);

        // Bonus for correct emotion match (0-20 points)
        const matchBonus = result.isMatch ? 20 : 0;

        score = detectionScore + emotionScore + matchBonus;
        score = Math.min(100, Math.max(0, score));
      }

      // Enhanced success criteria with confidence thresholds
      const highConfidence = result.confidence >= 0.7;
      const mediumConfidence = result.confidence >= 0.5;
      const goodDetection = result.result?.detectionConfidence ? result.result.detectionConfidence >= 0.7 : false;

      const success = result.isMatch && highConfidence && goodDetection;
      const partialSuccess = result.isMatch && mediumConfidence;

      if (success) {
        // Perfect match - stop detection and complete
        stopRealTimeDetection();
        setTimeout(() => {
          onMirroringComplete(score, true);
        }, 2000);
      } else if (partialSuccess && attempts >= 2) {
        // Partial success after 2 attempts
        setTimeout(() => {
          onMirroringComplete(Math.max(60, score), true);
        }, 2000);
      } else if (attempts >= 3) {
        // After 3 attempts, allow moving on with minimum score
        setTimeout(() => {
          onMirroringComplete(Math.max(30, score), false);
        }, 2000);
      } else {
        // Continue trying - provide specific feedback
        const feedbackMessage = getFeedbackMessage(result, attempts);
        setGuidance(feedbackMessage);
      }

    } catch (error) {
      console.error('Mirroring capture error:', error);
      setCaptureResult({
        success: false,
        detectedEmotion: 'error',
        confidence: 0,
        isMatch: false,
        result: null
      });
      setGuidance('Error analyzing your expression. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Get specific feedback based on detection results
  const getFeedbackMessage = (result: any, attemptNumber: number): string => {
    if (!result.success) {
      return "No face detected. Please position your face clearly in the camera view.";
    }

    if (result.result?.detectionConfidence < 0.5) {
      return "Face detection is unclear. Move closer to the camera and ensure good lighting.";
    }

    if (result.confidence < 0.4) {
      return `Try to express the ${targetEmotion} emotion more clearly. Look at the reference image for guidance.`;
    }

    if (!result.isMatch) {
      return `You're showing ${result.detectedEmotion} but we need ${targetEmotion}. Try to match the reference image more closely.`;
    }

    if (result.confidence < 0.6) {
      return `Good attempt! Try to express the ${targetEmotion} emotion a bit more clearly.`;
    }

    return `Almost there! Attempt ${attemptNumber + 1} - try to hold the expression a bit longer.`;
  };

  // Retry mirroring
  const handleRetry = () => {
    setCaptureResult(null);
    setAttempts(0);
    setGuidance('');
    if (!isRealTimeActive) {
      startRealTimeDetection();
    }
    onRetry();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="w-full h-[100vh] flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 text-center py-3 px-4 bg-white/80 backdrop-blur-sm border-b">
        <h2 className="text-xl font-bold text-purple-600">Mirror the {targetEmotion.charAt(0).toUpperCase() + targetEmotion.slice(1)} Emotion</h2>
        {attempts > 0 && (
          <Badge variant="outline" className="mt-1">
            Attempt {attempts} of 3
          </Badge>
        )}
      </div>

      {/* Error Alerts - Compact */}
      {(cameraError || faceApiError) && (
        <div className="flex-shrink-0 p-2">
          <Alert variant="destructive" className="text-sm">
            <AlertDescription>
              {cameraError ? 'Camera access needed. Please allow camera permissions.' : 'Loading face detection...'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Model Loading - Compact */}
      {!isInitialized && (
        <div className="flex-shrink-0 p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading AI models...</p>
            <Progress value={(loadingProgress.modelsLoaded / loadingProgress.totalModels) * 100} className="mt-2" />
          </div>
        </div>
      )}

      {/* Main Interface - Single Screen */}
      {isInitialized && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Reference and Camera Side by Side */}
          <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0">
            {/* Reference Image - Scaled Down */}
            <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center">
                <h3 className="font-semibold text-sm">Target Expression</h3>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                {referenceImage ? (
                  <div className="relative w-3/4 h-3/4 max-w-[200px] max-h-[200px]">
                    <img
                      src={referenceImage.path}
                      alt={`Reference ${targetEmotion} emotion`}
                      className="w-full h-full object-cover rounded-lg border-2 border-green-200"
                    />
                    <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs">
                      {targetEmotion.charAt(0).toUpperCase() + targetEmotion.slice(1)}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-3/4 h-3/4 max-w-[200px] max-h-[200px] bg-muted rounded-lg">
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Feed */}
            <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center">
                <h3 className="font-semibold text-sm">Your Expression</h3>
              </div>
              <div className="flex-1 flex items-center justify-center p-3 relative">
                {cameraActive && videoStream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-lg"
                      muted
                      autoPlay
                      playsInline
                    />
                    <canvas
                      ref={canvasRef}
                      width="640"
                      height="480"
                      className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
                    />

                    {/* Live Detection Indicator */}
                    {detectionResult && isRealTimeActive && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] >= 0.6 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] >= 0.6 ? '✓ Ready!' : 'Keep trying...'}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
                    <p className="text-muted-foreground text-sm">Starting camera...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Shutter Button and Status */}
          <div className="flex-shrink-0 flex flex-col items-center py-4 px-6 bg-white/80 backdrop-blur-sm">
            {/* Status Message */}
            <div className="text-center mb-3 min-h-[2rem]">
              {guidance ? (
                <p className="text-sm text-muted-foreground">{guidance}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Copy the target expression and tap the shutter when ready
                </p>
              )}
            </div>

            {/* Camera Shutter Button */}
            <div className="relative">
              <button
                onClick={captureAndAnalyze}
                disabled={!isInitialized || isCapturing || !cameraActive}
                className={cn(
                  "w-16 h-16 rounded-full border-4 border-white shadow-lg transition-all duration-200",
                  "flex items-center justify-center",
                  isCapturing
                    ? "bg-orange-500 animate-pulse"
                    : "bg-red-500 hover:bg-red-600 active:scale-95",
                  (!isInitialized || !cameraActive) && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  boxShadow: '0 0 0 2px #374151, 0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {isCapturing ? (
                  <div className="w-6 h-6 bg-white rounded-full animate-pulse" />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-full" />
                )}
              </button>

              {/* Retry Button */}
              {attempts > 0 && (
                <button
                  onClick={handleRetry}
                  className="absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                >
                  ↻
                </button>
              )}
            </div>

            {/* Result Feedback - Compact */}
            {captureResult && (
              <div className="mt-3 text-center">
                {captureResult.isMatch && captureResult.confidence >= 0.6 ? (
                  <div className="text-green-600 font-semibold text-sm">
                    🎉 Perfect! You nailed the {targetEmotion} expression!
                  </div>
                ) : captureResult.success ? (
                  <div className="text-orange-600 font-semibold text-sm">
                    Close! Try to show more {targetEmotion}. {attempts < 3 ? 'Try again!' : 'Great effort!'}
                  </div>
                ) : (
                  <div className="text-red-600 font-semibold text-sm">
                    No face detected. Make sure you're clearly visible.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionMirroring;