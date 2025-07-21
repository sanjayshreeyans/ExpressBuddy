import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EmotionDetectiveError } from '../../utils/errorHandling';

interface ErrorAlertProps {
  error: EmotionDetectiveError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

/**
 * Generic error alert component
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  className = ''
}) => {
  const getAlertVariant = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (error.severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '❌';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <Alert variant={getAlertVariant()} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            <span>{getIcon()}</span>
            Something needs attention
            <Badge variant="outline" className="ml-2">
              {error.severity}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 text-base">
            {error.userMessage}
          </AlertDescription>
          
          {error.fallbackAction && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <p className="text-sm font-medium">What you can do:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.fallbackAction}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {showRetry && error.recoverable && onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} size="sm" variant="ghost">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

/**
 * Camera access error component
 */
export const CameraErrorAlert: React.FC<{
  error: EmotionDetectiveError;
  onRetry?: () => void;
  onSkip?: () => void;
  onDismiss?: () => void;
}> = ({ error, onRetry, onSkip, onDismiss }) => {
  const getCameraInstructions = () => {
    switch (error.code) {
      case 'CAMERA_ACCESS_DENIED':
        return (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">To enable camera access:</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Click the camera icon in your browser's address bar</li>
              <li>Select "Allow" for camera permissions</li>
              <li>Refresh the page if needed</li>
            </ol>
          </div>
        );
      case 'CAMERA_NOT_FOUND':
        return (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              Make sure your camera is connected and not being used by other applications.
            </p>
          </div>
        );
      case 'CAMERA_IN_USE':
        return (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              Close other apps that might be using your camera (like video calls, other browser tabs, etc.).
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <span>📷</span>
          Camera Issue
        </CardTitle>
        <CardDescription className="text-orange-700">
          {error.userMessage}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {getCameraInstructions()}
        
        <div className="flex flex-wrap gap-3 mt-4">
          {error.recoverable && onRetry && (
            <Button onClick={onRetry} size="sm">
              Try Camera Again
            </Button>
          )}
          {onSkip && (
            <Button onClick={onSkip} size="sm" variant="outline">
              Skip Camera Activities
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} size="sm" variant="ghost">
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Face-API loading error component
 */
export const FaceApiErrorAlert: React.FC<{
  error: EmotionDetectiveError;
  onRetry?: () => void;
  onContinueWithoutAI?: () => void;
  loadingProgress?: { modelsLoaded: number; totalModels: number };
}> = ({ error, onRetry, onContinueWithoutAI, loadingProgress }) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <span>🤖</span>
          AI System Issue
        </CardTitle>
        <CardDescription className="text-red-700">
          {error.userMessage}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loadingProgress && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Loading progress: {loadingProgress.modelsLoaded}/{loadingProgress.totalModels} models
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(loadingProgress.modelsLoaded / loadingProgress.totalModels) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
        
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">
            The emotion detection AI is having trouble starting. You can still enjoy the lesson with manual verification!
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          {error.recoverable && onRetry && (
            <Button onClick={onRetry} size="sm">
              Retry AI Loading
            </Button>
          )}
          {onContinueWithoutAI && (
            <Button onClick={onContinueWithoutAI} size="sm" variant="outline">
              Continue Without AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * TTS error component
 */
export const TTSErrorAlert: React.FC<{
  error: EmotionDetectiveError;
  onRetry?: () => void;
  onContinueWithoutAudio?: () => void;
}> = ({ error, onRetry, onContinueWithoutAudio }) => {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="text-yellow-800 flex items-center gap-2">
            <span>🔊</span>
            Audio Issue
          </AlertTitle>
          <AlertDescription className="mt-2 text-yellow-700">
            {error.userMessage}
          </AlertDescription>
          
          <div className="mt-3">
            <p className="text-sm text-yellow-600">
              Don't worry - you can still read along with the text!
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {error.recoverable && onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Try Audio Again
            </Button>
          )}
          {onContinueWithoutAudio && (
            <Button onClick={onContinueWithoutAudio} size="sm" variant="ghost">
              Continue Reading
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

/**
 * Network error component
 */
export const NetworkErrorAlert: React.FC<{
  error: EmotionDetectiveError;
  onRetry?: () => void;
  onWorkOffline?: () => void;
}> = ({ error, onRetry, onWorkOffline }) => {
  return (
    <Alert variant="destructive">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            <span>🌐</span>
            Connection Issue
          </AlertTitle>
          <AlertDescription className="mt-2">
            {error.userMessage}
          </AlertDescription>
          
          <div className="mt-3 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">Troubleshooting tips:</p>
            <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Disable VPN if you're using one</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Try Again
            </Button>
          )}
          {onWorkOffline && (
            <Button onClick={onWorkOffline} size="sm" variant="ghost">
              Work Offline
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

/**
 * Browser compatibility warning
 */
export const BrowserCompatibilityAlert: React.FC<{
  missingFeatures: string[];
  onContinue?: () => void;
  onDismiss?: () => void;
}> = ({ missingFeatures, onContinue, onDismiss }) => {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="text-blue-800 flex items-center gap-2">
            <span>🌐</span>
            Browser Compatibility
          </AlertTitle>
          <AlertDescription className="mt-2 text-blue-700">
            Some features may not work optimally in your current browser.
          </AlertDescription>
          
          <div className="mt-3">
            <p className="text-sm font-medium text-blue-800">Missing features:</p>
            <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
              {missingFeatures.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-3 p-3 bg-blue-100 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Recommended browsers:</strong> Chrome, Firefox, Safari, or Edge
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {onContinue && (
            <Button onClick={onContinue} size="sm" variant="outline">
              Continue Anyway
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} size="sm" variant="ghost">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};