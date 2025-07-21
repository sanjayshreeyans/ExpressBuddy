import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { EmotionDetectiveError, createError, logError } from '../../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: EmotionDetectiveError) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: EmotionDetectiveError | null;
  errorId: string;
}

/**
 * Error Boundary for Emotion Detective Learning components
 * Provides graceful error handling and recovery options
 */
export class EmotionDetectiveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const emotionError = error instanceof EmotionDetectiveError
      ? error
      : createError('UNKNOWN_ERROR', error, {
          component: 'ErrorBoundary',
          action: 'componentRender'
        });

    return {
      hasError: true,
      error: emotionError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const emotionError = this.state.error || createError('UNKNOWN_ERROR', error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch'
    }, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Log the error
    logError(emotionError);

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(emotionError);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <span>⚠️</span>
                    Oops! Something went wrong
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Don't worry - we can fix this together!
                  </CardDescription>
                </div>
                <Badge variant={error.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {error.severity} error
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* User-friendly error message */}
              <Alert>
                <AlertTitle>What happened?</AlertTitle>
                <AlertDescription className="text-base">
                  {error.userMessage}
                </AlertDescription>
              </Alert>

              {/* Fallback action suggestion */}
              {error.fallbackAction && (
                <Alert>
                  <AlertTitle>What can you do?</AlertTitle>
                  <AlertDescription className="text-base">
                    {error.fallbackAction}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {error.recoverable && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1"
                    size="lg"
                  >
                    Try Again
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleRefresh}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Error details for debugging (only in development) */}
              {(this.props.showErrorDetails || process.env.NODE_ENV === 'development') && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Technical Details (for developers)
                  </summary>
                  <div className="mt-3 p-4 bg-muted rounded-lg text-sm font-mono">
                    <div className="space-y-2">
                      <div><strong>Error Code:</strong> {error.code}</div>
                      <div><strong>Error ID:</strong> {this.state.errorId}</div>
                      <div><strong>Component:</strong> {error.context?.component}</div>
                      <div><strong>Action:</strong> {error.context?.action}</div>
                      <div><strong>Timestamp:</strong> {error.context?.timestamp.toISOString()}</div>
                      {error.message && (
                        <div><strong>Technical Message:</strong> {error.message}</div>
                      )}
                      {error.context?.additionalInfo && (
                        <div>
                          <strong>Additional Info:</strong>
                          <pre className="mt-1 text-xs overflow-auto">
                            {JSON.stringify(error.context.additionalInfo, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Help text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem continues, try refreshing the page or 
                  <br />
                  contact support with Error ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EmotionDetectiveErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EmotionDetectiveErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default EmotionDetectiveErrorBoundary;