import React, { useEffect, useRef, useState } from 'react';
import { emotionDetectionService, ModelLoadingProgress } from '../../services/emotion-detective/EmotionDetectionService';
import { FaceApiResult, FaceImageData, EmotionMirroringProps } from '../../types/emotion-detective';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
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

  // Auto-start camera when component mounts and models are ready
  useEffect(() => {
    if (isInitialized && !cameraActive && !cameraError) {
      startCamera();
    }
  }, [isInitialized]);

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

      // Set up video element
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            console.log('🎥 [MIRRORING] Video playing successfully');
            // Auto-start real-time detection
            startRealTimeDetection();
          }).catch((playError) => {
            console.error('🎥 [MIRRORING] Video play() failed:', playError);
            const cameraPlayError = createError('CAMERA_HARDWARE_ERROR', playError, {
              component: 'EmotionMirroring',
              action: 'videoPlay'
            });
            setCameraError(cameraPlayError);
          });
        }
      }, 100);
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

  // Start real-time detection
  const startRealTimeDetection = () => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) return;

    const stopFn = emotionDetectionService.startRealTimeDetection(
      videoRef.current,
      canvasRef.current,
      (result) => {
        setDetectionResult(result);
        const guidanceText = emotionDetectionService.getDetectionGuidance(result);
        setGuidance(guidanceText);
      },
      200 // Detection every 200ms
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
        const ctx = canvasRef.current.getContext('2d');
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
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Mirror the Emotion</h2>
        <p className="text-muted-foreground mt-2">
          Look at the reference image and try to mirror the <span className="font-semibold capitalize">{targetEmotion}</span> emotion
        </p>
      </div>

      {/* Error Alerts */}
      <div className="space-y-4 mb-6">
        {/* Camera Error Alert */}
        {cameraError && !dismissedErrors.has(cameraError.code) && (
          <CameraErrorAlert
            error={cameraError}
            onRetry={() => {
              setCameraError(null);
              startCamera();
            }}
            onSkip={() => {
              setDismissedErrors(prev => new Set(prev).add(cameraError.code));
              setCameraError(null);
              // Continue without camera - show manual verification option
            }}
            onDismiss={() => {
              setDismissedErrors(prev => new Set(prev).add(cameraError.code));
              setCameraError(null);
            }}
          />
        )}

        {/* Face-API Error Alert */}
        {faceApiError && !dismissedErrors.has(faceApiError.code) && (
          <FaceApiErrorAlert
            error={faceApiError}
            onRetry={() => {
              setFaceApiError(null);
              // Retry model loading
              emotionDetectionService.reset();
              window.location.reload(); // Simple retry by reloading
            }}
            onContinueWithoutAI={() => {
              setDismissedErrors(prev => new Set(prev).add(faceApiError.code));
              setFaceApiError(null);
              // Continue with manual verification
            }}
            loadingProgress={loadingProgress}
          />
        )}
      </div>

      {/* Model Loading Progress */}
      {!isInitialized && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Loading Face Detection Models</CardTitle>
            <CardDescription>
              {loadingProgress.currentModel} ({loadingProgress.modelsLoaded}/{loadingProgress.totalModels})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={(loadingProgress.modelsLoaded / loadingProgress.totalModels) * 100}
              className="mb-2"
            />
            {loadingProgress.error && (
              <Alert variant="destructive">
                <AlertDescription>Error: {loadingProgress.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Mirroring Interface */}
      {isInitialized && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Reference Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Reference Image</CardTitle>
              <CardDescription className="text-center">
                Try to mirror this <span className="font-semibold capitalize">{targetEmotion}</span> expression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="relative border-2 border-border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={referenceImage.path}
                    alt={`Reference ${targetEmotion} emotion`}
                    className="w-full h-auto max-w-sm"
                    style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                  />
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="w-full justify-center">
                      Target: {targetEmotion.charAt(0).toUpperCase() + targetEmotion.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Your Camera</CardTitle>
              <CardDescription className="text-center">
                Express the emotion and click capture when ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cameraActive && videoStream ? (
                <div className="flex justify-center">
                  <div className="relative border-2 border-border rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      width="640"
                      height="480"
                      className="block w-full h-auto max-w-sm bg-black"
                      muted
                      autoPlay
                      playsInline
                      style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                    />
                    <canvas
                      ref={canvasRef}
                      width="640"
                      height="480"
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ aspectRatio: '4/3', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Starting camera...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls and Status */}
      {cameraActive && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mirroring Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={captureAndAnalyze}
                disabled={!isInitialized || isCapturing}
                variant="default"
                size="lg"
              >
                {isCapturing ? 'Analyzing...' : 'Capture & Analyze'}
              </Button>

              {attempts > 0 && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="lg"
                >
                  Try Again
                </Button>
              )}
            </div>

            {attempts > 0 && (
              <div className="text-center">
                <Badge variant="outline">
                  Attempt {attempts} of 3
                </Badge>
              </div>
            )}

            <Separator />

            {/* Guidance */}
            {guidance && (
              <Alert>
                <AlertDescription>{guidance}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detection Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Detection */}
        {detectionResult && isRealTimeActive && (
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Live Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Face Detection Confidence */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Face Detection</span>
                  <Badge variant={detectionResult.detectionConfidence >= 0.7 ? "default" : "secondary"}>
                    {(detectionResult.detectionConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Progress
                  value={detectionResult.detectionConfidence * 100}
                  className="h-2"
                />
              </div>

              <Separator />

              {/* Target Emotion Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">Target: {targetEmotion}</span>
                  <Badge variant={detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] >= 0.6 ? "default" : "outline"}>
                    {(detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Progress
                  value={detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] * 100}
                  className="h-3"
                />
                {detectionResult.expressions[targetEmotion as keyof typeof detectionResult.expressions] >= 0.6 && (
                  <p className="text-xs text-green-600 font-medium">✓ Good expression! Ready to capture</p>
                )}
              </div>

              <Separator />

              {/* All Emotions */}
              <div>
                <h4 className="font-medium mb-2">All Detected Emotions:</h4>
                <div className="space-y-2">
                  {Object.entries(detectionResult.expressions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([emotion, confidence]) => (
                      <div key={emotion} className="flex justify-between items-center">
                        <span className={`capitalize text-sm ${emotion === targetEmotion ? 'font-bold text-green-600' : ''}`}>
                          {emotion}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={confidence * 100} className="w-16 h-1" />
                          <span className="text-xs font-mono w-10 text-right">
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Capture Analysis Results */}
        {captureResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Analysis Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Success Status */}
              <div className="flex justify-between items-center">
                <span className="font-medium">Detection Status:</span>
                <Badge variant={captureResult.success ? "default" : "destructive"}>
                  {captureResult.success ? 'Face Detected' : 'No Face Found'}
                </Badge>
              </div>

              {captureResult.success && captureResult.result && (
                <>
                  {/* Face Detection Confidence */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Face Detection Quality:</span>
                      <Badge variant={captureResult.result.detectionConfidence >= 0.7 ? "default" : "secondary"}>
                        {(captureResult.result.detectionConfidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={captureResult.result.detectionConfidence * 100} className="h-2" />
                  </div>

                  <Separator />

                  {/* Emotion Analysis */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Target Emotion:</span>
                      <Badge variant="outline" className="capitalize">{targetEmotion}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium">Detected Emotion:</span>
                      <Badge
                        variant={captureResult.isMatch ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {captureResult.detectedEmotion}
                      </Badge>
                    </div>

                    {/* Emotion Confidence with Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Emotion Confidence:</span>
                        <span className="text-sm font-mono">{(captureResult.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={captureResult.confidence * 100}
                        className={`h-2 ${captureResult.confidence >= 0.6 ? '' : 'opacity-60'}`}
                      />
                    </div>

                    {/* Match Status */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Emotion Match:</span>
                      <Badge variant={captureResult.isMatch ? "default" : "destructive"}>
                        {captureResult.isMatch ? '✓ Perfect Match!' : '✗ Different Emotion'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Score Breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Score Breakdown:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Face Quality:</span>
                        <span>{Math.round(captureResult.result.detectionConfidence * 40)}/40</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emotion Clarity:</span>
                        <span>{Math.round(captureResult.confidence * 40)}/40</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Match Bonus:</span>
                        <span>{captureResult.isMatch ? '20' : '0'}/20</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Score:</span>
                        <span>
                          {Math.min(100, Math.max(0,
                            Math.round(captureResult.result.detectionConfidence * 40) +
                            Math.round(captureResult.confidence * 40) +
                            (captureResult.isMatch ? 20 : 0)
                          ))}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Success/Failure Messages */}
              {captureResult.isMatch && captureResult.confidence >= 0.7 && (
                <Alert>
                  <AlertDescription className="text-green-600 font-medium">
                    🎉 Excellent! You perfectly mirrored the {targetEmotion} emotion!
                  </AlertDescription>
                </Alert>
              )}

              {captureResult.isMatch && captureResult.confidence >= 0.5 && captureResult.confidence < 0.7 && (
                <Alert>
                  <AlertDescription className="text-blue-600 font-medium">
                    👍 Good job! You showed the {targetEmotion} emotion clearly enough.
                  </AlertDescription>
                </Alert>
              )}

              {!captureResult.success && (
                <Alert variant="destructive">
                  <AlertDescription>
                    No face detected. Please ensure your face is clearly visible in the camera.
                  </AlertDescription>
                </Alert>
              )}

              {captureResult.success && !captureResult.isMatch && attempts < 3 && (
                <Alert>
                  <AlertDescription>
                    You're showing <strong>{captureResult.detectedEmotion}</strong> but we need <strong>{targetEmotion}</strong>.
                    Look at the reference image and try again!
                  </AlertDescription>
                </Alert>
              )}

              {captureResult.success && captureResult.confidence < 0.5 && attempts < 3 && (
                <Alert>
                  <AlertDescription>
                    The emotion detection confidence is low. Try to express the {targetEmotion} emotion more clearly.
                  </AlertDescription>
                </Alert>
              )}

              {attempts >= 3 && (
                <Alert>
                  <AlertDescription className="text-orange-600">
                    You've completed all 3 attempts. Great effort! You'll still earn points for trying.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Mirror Emotions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Look at the reference image on the left to see the target emotion</li>
            <li>Position your face in the center of the camera view</li>
            <li>Try to copy the facial expression shown in the reference image</li>
            <li>When you think you have the right expression, click "Capture & Analyze"</li>
            <li>The system will tell you if your expression matches the target emotion</li>
            <li>You have up to 3 attempts to get it right!</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionMirroring;