/**
 * Camera Service with comprehensive error handling for Emotion Detective Learning
 * Provides graceful degradation and user-friendly error messages for camera access
 */

import { 
  EmotionDetectiveError, 
  createError, 
  handleCameraError, 
  logError,
  retryWithBackoff,
  withGracefulDegradation
} from '../../utils/errorHandling';

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportedConstraints: MediaTrackSupportedConstraints;
  devices: MediaDeviceInfo[];
}

export interface CameraStatus {
  isActive: boolean;
  stream: MediaStream | null;
  error: EmotionDetectiveError | null;
  deviceId?: string;
  constraints?: CameraConstraints;
}

export class CameraService {
  private static instance: CameraService;
  private currentStream: MediaStream | null = null;
  private currentStatus: CameraStatus = {
    isActive: false,
    stream: null,
    error: null
  };
  private statusCallbacks: ((status: CameraStatus) => void)[] = [];

  private constructor() {
    // Listen for device changes
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange.bind(this));
    }
  }

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Check if camera access is supported in the current browser
   */
  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Get camera capabilities and available devices
   */
  public async getCameraCapabilities(): Promise<CameraCapabilities> {
    try {
      if (!this.isSupported()) {
        return {
          hasCamera: false,
          hasMultipleCameras: false,
          supportedConstraints: {},
          devices: []
        };
      }

      // Get supported constraints
      const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      return {
        hasCamera: videoDevices.length > 0,
        hasMultipleCameras: videoDevices.length > 1,
        supportedConstraints,
        devices: videoDevices
      };

    } catch (error) {
      const cameraError = handleCameraError(error as Error, {
        component: 'CameraService',
        action: 'getCameraCapabilities'
      });
      
      logError(cameraError);
      
      return {
        hasCamera: false,
        hasMultipleCameras: false,
        supportedConstraints: {},
        devices: []
      };
    }
  }

  /**
   * Request camera access with comprehensive error handling
   */
  public async requestCameraAccess(
    constraints: CameraConstraints = { width: 640, height: 480, facingMode: 'user' }
  ): Promise<MediaStream> {
    try {
      // Check browser support first
      if (!this.isSupported()) {
        throw createError('WEBRTC_NOT_SUPPORTED', undefined, {
          component: 'CameraService',
          action: 'requestCameraAccess'
        });
      }

      // Stop any existing stream
      await this.stopCamera();

      // Build media constraints
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: constraints.width || 640 },
          height: { ideal: constraints.height || 480 },
          facingMode: constraints.facingMode || 'user'
        },
        audio: false
      };

      // Add frame rate if supported
      if (constraints.frameRate) {
        (mediaConstraints.video as MediaTrackConstraints).frameRate = {
          ideal: constraints.frameRate
        };
      }

      // Request camera access with retry mechanism
      const stream = await retryWithBackoff(async () => {
        return await navigator.mediaDevices.getUserMedia(mediaConstraints);
      }, 2, 1000, 5000);

      // Validate stream
      if (!stream || stream.getVideoTracks().length === 0) {
        throw createError('CAMERA_NOT_FOUND', new Error('No video tracks in stream'), {
          component: 'CameraService',
          action: 'requestCameraAccess'
        });
      }

      // Store current stream and update status
      this.currentStream = stream;
      this.updateStatus({
        isActive: true,
        stream,
        error: null,
        constraints
      });

      // Add event listeners for stream events
      this.addStreamEventListeners(stream);

      console.log('✅ Camera access granted successfully');
      return stream;

    } catch (error) {
      const cameraError = error instanceof EmotionDetectiveError 
        ? error 
        : handleCameraError(error as Error, {
            component: 'CameraService',
            action: 'requestCameraAccess'
          });

      this.updateStatus({
        isActive: false,
        stream: null,
        error: cameraError
      });

      logError(cameraError);
      throw cameraError;
    }
  }

  /**
   * Request camera access with graceful degradation
   */
  public async requestCameraAccessWithFallback(
    preferredConstraints: CameraConstraints = { width: 640, height: 480, facingMode: 'user' }
  ): Promise<MediaStream> {
    return await withGracefulDegradation(
      // Primary: Try with preferred constraints
      async () => {
        return await this.requestCameraAccess(preferredConstraints);
      },
      // Fallback: Try with basic constraints
      async () => {
        console.log('🔄 Trying camera access with fallback constraints...');
        return await this.requestCameraAccess({
          width: 320,
          height: 240,
          facingMode: 'user'
        });
      },
      (error) => {
        console.warn('Camera access failed, trying fallback:', error.userMessage);
      }
    );
  }

  /**
   * Stop camera and release resources
   */
  public async stopCamera(): Promise<void> {
    try {
      if (this.currentStream) {
        // Stop all tracks
        this.currentStream.getTracks().forEach(track => {
          track.stop();
          console.log(`🛑 Stopped camera track: ${track.kind} (${track.label})`);
        });

        this.currentStream = null;
      }

      this.updateStatus({
        isActive: false,
        stream: null,
        error: null
      });

      console.log('✅ Camera stopped successfully');

    } catch (error) {
      const cameraError = createError('CAMERA_HARDWARE_ERROR', error as Error, {
        component: 'CameraService',
        action: 'stopCamera'
      });

      logError(cameraError);
      throw cameraError;
    }
  }

  /**
   * Switch to a different camera device
   */
  public async switchCamera(deviceId: string): Promise<MediaStream> {
    try {
      const currentConstraints = this.currentStatus.constraints || {};
      
      const newConstraints: CameraConstraints = {
        ...currentConstraints,
        // Remove facingMode when using specific deviceId
        facingMode: undefined
      };

      // Build media constraints with specific device
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: newConstraints.width || 640 },
          height: { ideal: newConstraints.height || 480 }
        },
        audio: false
      };

      // Stop current stream
      await this.stopCamera();

      // Request new stream
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      this.currentStream = stream;
      this.updateStatus({
        isActive: true,
        stream,
        error: null,
        deviceId,
        constraints: newConstraints
      });

      this.addStreamEventListeners(stream);

      console.log(`✅ Switched to camera device: ${deviceId}`);
      return stream;

    } catch (error) {
      const cameraError = handleCameraError(error as Error, {
        component: 'CameraService',
        action: 'switchCamera'
      });

      this.updateStatus({
        isActive: false,
        stream: null,
        error: cameraError
      });

      logError(cameraError);
      throw cameraError;
    }
  }

  /**
   * Get current camera status
   */
  public getStatus(): CameraStatus {
    return { ...this.currentStatus };
  }

  /**
   * Subscribe to camera status updates
   */
  public onStatusChange(callback: (status: CameraStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if camera is currently active
   */
  public isActive(): boolean {
    return this.currentStatus.isActive && !!this.currentStream;
  }

  /**
   * Get current camera stream
   */
  public getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * Test camera access without actually starting the camera
   */
  public async testCameraAccess(): Promise<{
    hasPermission: boolean;
    error: EmotionDetectiveError | null;
  }> {
    try {
      if (!this.isSupported()) {
        return {
          hasPermission: false,
          error: createError('WEBRTC_NOT_SUPPORTED', undefined, {
            component: 'CameraService',
            action: 'testCameraAccess'
          })
        };
      }

      // Try to get a very basic stream and immediately stop it
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1, height: 1 },
        audio: false
      });

      // Immediately stop the test stream
      testStream.getTracks().forEach(track => track.stop());

      return {
        hasPermission: true,
        error: null
      };

    } catch (error) {
      const cameraError = handleCameraError(error as Error, {
        component: 'CameraService',
        action: 'testCameraAccess'
      });

      return {
        hasPermission: false,
        error: cameraError
      };
    }
  }

  /**
   * Get camera permission status
   */
  public async getPermissionStatus(): Promise<PermissionState | 'unsupported'> {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        return 'unsupported';
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state;

    } catch (error) {
      console.warn('Could not query camera permission:', error);
      return 'unsupported';
    }
  }

  /**
   * Update camera status and notify callbacks
   */
  private updateStatus(newStatus: Partial<CameraStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...newStatus };
    
    // Notify all callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.getStatus());
      } catch (error) {
        console.error('Error in camera status callback:', error);
      }
    });
  }

  /**
   * Add event listeners to camera stream
   */
  private addStreamEventListeners(stream: MediaStream): void {
    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        console.warn('📷 Camera track ended unexpectedly');
        this.updateStatus({
          isActive: false,
          stream: null,
          error: createError('CAMERA_HARDWARE_ERROR', new Error('Camera track ended'), {
            component: 'CameraService',
            action: 'trackEnded'
          })
        });
      });

      videoTrack.addEventListener('mute', () => {
        console.warn('📷 Camera track muted');
      });

      videoTrack.addEventListener('unmute', () => {
        console.log('📷 Camera track unmuted');
      });
    }
  }

  /**
   * Handle device changes (camera connected/disconnected)
   */
  private async handleDeviceChange(): Promise<void> {
    try {
      console.log('📷 Camera devices changed, checking current stream...');
      
      if (this.currentStream) {
        const tracks = this.currentStream.getVideoTracks();
        
        // Check if current track is still active
        if (tracks.length === 0 || tracks[0].readyState === 'ended') {
          console.warn('📷 Current camera is no longer available');
          
          this.updateStatus({
            isActive: false,
            stream: null,
            error: createError('CAMERA_NOT_FOUND', new Error('Camera disconnected'), {
              component: 'CameraService',
              action: 'deviceChange'
            })
          });
        }
      }
    } catch (error) {
      console.error('Error handling device change:', error);
    }
  }

  /**
   * Cleanup and disconnect
   */
  public async disconnect(): Promise<void> {
    try {
      await this.stopCamera();
      
      // Remove device change listener
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange.bind(this));
      }
      
      // Clear callbacks
      this.statusCallbacks = [];
      
      console.log('✅ Camera service disconnected');
      
    } catch (error) {
      console.error('Error disconnecting camera service:', error);
    }
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();

export default CameraService;