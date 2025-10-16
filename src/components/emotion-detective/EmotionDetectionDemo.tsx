import React, { useEffect, useRef, useState } from 'react';
import { emotionDetectionService, ModelLoadingProgress } from '../../services/emotion-detective/EmotionDetectionService';
import { FaceApiResult } from '../../types/emotion-detective';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Zap, Play, Square, Camera, Smile, Pause,
  CheckCircle, BarChart3, AlertTriangle, Volume2, Settings
} from 'lucide-react';

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
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Compact Modern Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="py-2 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Emotion Detection</h1>
              <p className="text-xs text-gray-600">AI-powered recognition</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs">Beta</Badge>
        </div>
      </div>

      {/* Main Content - Optimized Vertical Layout */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 min-h-0">
        
        {/* Loading State - Compact */}
        {!isInitialized && (
          <Card className="border-l-4 border-l-purple-500 flex-shrink-0">
            <CardContent className="p-3 flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <Progress value={(loadingProgress.modelsLoaded / loadingProgress.totalModels) * 100} className="h-1.5 mb-1" />
                <div className="text-xs text-gray-600">
                  {Math.round((loadingProgress.modelsLoaded / loadingProgress.totalModels) * 100)}% - {loadingProgress.currentModel || 'Preparing...'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Controls - Horizontal Compact */}
        <Card className="flex-shrink-0">
          <CardContent className="p-3 flex gap-2">
            <Button
              onClick={startCamera}
              disabled={cameraActive || !isInitialized}
              className="flex-1 bg-green-600 hover:bg-green-700 h-9"
              size="sm"
            >
              <Play className="w-3 h-3 mr-1" />
              Start Camera
            </Button>
            <Button
              onClick={stopCamera}
              disabled={!cameraActive}
              className="flex-1 bg-red-600 hover:bg-red-700 h-9"
              size="sm"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
            {cameraActive && (
              <>
                <Button
                  onClick={startRealTimeDetection}
                  disabled={isRealTimeActive || !isInitialized}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                  size="sm"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Detect
                </Button>
                <Button
                  onClick={captureAndAnalyze}
                  disabled={!isInitialized}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 h-9"
                  size="sm"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  Capture
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Video Feed - Takes remaining space */}
        {cameraActive && videoStream && (
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardContent className="p-3 flex-1 min-h-0 flex flex-col">
              <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-0">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted
                  autoPlay
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results - Horizontal Cards at Bottom */}
        {(detectionResult || captureResult) && (
          <div className="flex-shrink-0 flex gap-3">
            {detectionResult && (
              <Card className="flex-1 border-l-4 border-l-green-500">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-gray-700">Live Detection</span>
                    </div>
                    <Badge className="bg-green-600 text-white text-xs">
                      {(detectionResult.detectionConfidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(detectionResult.expressions)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([emotion, confidence]) => (
                        <div key={emotion} className="flex justify-between items-center text-xs">
                          <span className="capitalize font-medium">{emotion}</span>
                          <span className="font-bold">{(confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {captureResult && (
              <Card className={`flex-1 border-l-4 ${captureResult.success ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-bold text-gray-700">Capture</span>
                    </div>
                    <Badge className={captureResult.success ? 'bg-green-600' : 'bg-red-600'} variant="outline">
                      {captureResult.success ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detected:</span>
                      <span className="font-bold capitalize">{captureResult.detectedEmotion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-bold">{(captureResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetectionDemo;