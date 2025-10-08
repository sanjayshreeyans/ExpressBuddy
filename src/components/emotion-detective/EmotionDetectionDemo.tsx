import React, { useEffect, useRef, useState } from 'react';
import { emotionDetectionService, ModelLoadingProgress } from '../../services/emotion-detective/EmotionDetectionService';
import { FaceApiResult } from '../../types/emotion-detective';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';

interface EmotionDetectionDemoProps { }

export const EmotionDetectionDemo: React.FC<EmotionDetectionDemoProps> = () => {
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

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 [STATE] videoStream changed:', !!videoStream, videoStream?.id);
  }, [videoStream]);

  useEffect(() => {
    console.log('🔄 [STATE] cameraActive changed:', cameraActive);
  }, [cameraActive]);

  useEffect(() => {
    console.log('🔄 [STATE] isInitialized changed:', isInitialized);
  }, [isInitialized]);
  const [detectionResult, setDetectionResult] = useState<FaceApiResult | null>(null);
  const [guidance, setGuidance] = useState<string>('');
  const [targetEmotion, setTargetEmotion] = useState<string>('happy');
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [captureResult, setCaptureResult] = useState<any>(null);
  const stopDetectionRef = useRef<(() => void) | null>(null);

  const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];

  // Initialize face-api.js models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        await emotionDetectionService.initialize('/models', setLoadingProgress);
        setIsInitialized(true);
        console.log('Face-api.js models loaded successfully!');
      } catch (error) {
        console.error('Failed to initialize face-api.js:', error);
        setLoadingProgress(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }));
      }
    };

    initializeModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      console.log('🎥 [CAMERA] Starting camera request...');
      console.log('🎥 [CAMERA] videoRef.current exists:', !!videoRef.current);
      console.log('🎥 [CAMERA] Current cameraActive state:', cameraActive);
      console.log('🎥 [CAMERA] Current videoStream state:', !!videoStream);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      console.log('🎥 [CAMERA] Camera stream obtained successfully!');
      console.log('🎥 [CAMERA] Stream details:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      // Log video track details
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        console.log('🎥 [CAMERA] Video track details:', {
          id: track.id,
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings()
        });
      }

      console.log('🎥 [CAMERA] Setting videoStream state...');
      setVideoStream(stream);
      setCameraActive(true);
      console.log('🎥 [CAMERA] Camera activated - state updated');

      // Wait for React to render the video element, then set up the stream
      setTimeout(() => {
        console.log('🎥 [CAMERA] Setting up video element after render...');
        if (videoRef.current) {
          console.log('🎥 [CAMERA] Video element exists, setting srcObject...');
          console.log('🎥 [CAMERA] Video element current state:', {
            srcObject: !!videoRef.current.srcObject,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            readyState: videoRef.current.readyState,
            paused: videoRef.current.paused,
            muted: videoRef.current.muted,
            autoplay: videoRef.current.autoplay
          });

          videoRef.current.srcObject = stream;
          console.log('🎥 [CAMERA] srcObject set successfully');

          // Add event listeners for debugging
          videoRef.current.onloadstart = () => console.log('🎥 [VIDEO] loadstart event fired');
          videoRef.current.onloadedmetadata = () => {
            console.log('🎥 [VIDEO] loadedmetadata event fired');
            console.log('🎥 [VIDEO] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          };
          videoRef.current.oncanplay = () => console.log('🎥 [VIDEO] canplay event fired');
          videoRef.current.onplay = () => console.log('🎥 [VIDEO] play event fired');
          videoRef.current.onplaying = () => console.log('🎥 [VIDEO] playing event fired');
          videoRef.current.onerror = (e) => console.error('🎥 [VIDEO] error event fired:', e);

          // Try to play the video manually
          videoRef.current.play().then(() => {
            console.log('🎥 [CAMERA] Video play() succeeded');
          }).catch((playError) => {
            console.error('🎥 [CAMERA] Video play() failed:', playError);
          });

          // Log final state
          setTimeout(() => {
            console.log('🎥 [CAMERA] Final video element state after 1 second:', {
              srcObject: !!videoRef.current?.srcObject,
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight,
              readyState: videoRef.current?.readyState,
              paused: videoRef.current?.paused,
              currentTime: videoRef.current?.currentTime
            });
          }, 1000);

        } else {
          console.error('🎥 [CAMERA] ERROR: videoRef.current is still null after timeout!');
        }
      }, 100); // Give React time to render the video element
    } catch (error) {
      console.error('🎥 [CAMERA] ERROR accessing camera:', error);
      console.error('🎥 [CAMERA] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      alert('Could not access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setVideoStream(null);
    setCameraActive(false);

    // Stop real-time detection if active
    if (stopDetectionRef.current) {
      stopDetectionRef.current();
      stopDetectionRef.current = null;
      setIsRealTimeActive(false);
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
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };

  // Capture and analyze emotion
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !isInitialized) return;

    try {
      const result = await emotionDetectionService.captureAndAnalyze(
        videoRef.current,
        targetEmotion
      );
      setCaptureResult(result);
      console.log('Capture result:', result);
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Emotion Detection Demo</h1>
        <p className="text-muted-foreground mt-2">Real-time facial emotion recognition using AI</p>
      </div>

      {/* Model Loading Progress */}
      {!isInitialized && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Loading Face-API.js Models</CardTitle>
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

      {/* Camera Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Camera Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={startCamera}
              disabled={cameraActive || !isInitialized}
              variant="default"
              size="lg"
            >
              Start Camera
            </Button>
            <Button
              onClick={stopCamera}
              disabled={!cameraActive}
              variant="destructive"
              size="lg"
            >
              Stop Camera
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video and Canvas Container */}
      {cameraActive && videoStream && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="relative border-2 border-border rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  width="640"
                  height="480"
                  className="block w-full h-auto bg-black"
                  muted
                  autoPlay
                  playsInline
                  style={{ minHeight: '480px' }}
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  className="absolute top-0 left-0 pointer-events-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection Controls */}
      {cameraActive && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detection Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={startRealTimeDetection}
                disabled={isRealTimeActive || !isInitialized}
                variant="secondary"
              >
                {isRealTimeActive ? 'Detection Active' : 'Start Real-time Detection'}
              </Button>
              <Button
                onClick={stopRealTimeDetection}
                disabled={!isRealTimeActive}
                variant="outline"
              >
                Stop Detection
              </Button>
            </div>

            <Separator />

            {/* Target Emotion Selection */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="font-medium">Target Emotion:</span>
              <Select value={targetEmotion} onValueChange={setTargetEmotion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emotions.map(emotion => (
                    <SelectItem key={emotion} value={emotion}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={captureAndAnalyze}
                disabled={!isInitialized}
                variant="default"
              >
                Capture & Analyze
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Real-time Detection Results */}
        {detectionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Real-time Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary">
                  Detection Confidence: {(detectionResult.detectionConfidence * 100).toFixed(1)}%
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Emotion Scores:</h4>
                <div className="space-y-2">
                  {Object.entries(detectionResult.expressions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([emotion, confidence]) => (
                      <div key={emotion} className="flex justify-between items-center">
                        <span className="capitalize">{emotion}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={confidence * 100} className="w-20 h-2" />
                          <span className="text-sm font-mono w-12 text-right">
                            {(confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {guidance && (
                <Alert>
                  <AlertDescription>{guidance}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Capture Analysis Results */}
        {captureResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Capture Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Success:</span>
                <Badge variant={captureResult.success ? "default" : "destructive"}>
                  {captureResult.success ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Target Emotion:</span>
                <Badge variant="outline" className="capitalize">{targetEmotion}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Detected Emotion:</span>
                <Badge variant="secondary" className="capitalize">{captureResult.detectedEmotion}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span>{(captureResult.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Match:</span>
                <Badge variant={captureResult.isMatch ? "default" : "destructive"}>
                  {captureResult.isMatch ? '✓ Yes' : '✗ No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Wait for the face-api.js models to load completely</li>
            <li>Click "Start Camera" to activate your webcam</li>
            <li>Click "Start Real-time Detection" to see live emotion detection with face overlay</li>
            <li>Select a target emotion and click "Capture & Analyze" to test emotion matching</li>
            <li>Try expressing different emotions to see how well the system detects them</li>
            <li>The green box shows face detection, red dots show facial landmarks</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionDetectionDemo;