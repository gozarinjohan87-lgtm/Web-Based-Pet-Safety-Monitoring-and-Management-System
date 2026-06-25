import React, { useRef, useState, useEffect } from 'react';
import { Camera, VideoOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  className?: string;
  buttonLabel?: string;
}

export function CameraCapture({ onCapture, className = '', buttonLabel = 'Capture Photo' }: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop all video tracks to release camera hardware
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      // Clean up stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Request camera and initialize stream
  const startCamera = async (deviceId?: string) => {
    setError('');
    setIsActive(true);
    
    // Cleanup any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' } } // Prefer back camera on mobile
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Query available video inputs
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (!deviceId && videoDevices.length > 0) {
        // Match the active track's device ID if we didn't specify one
        const activeTrack = mediaStream.getVideoTracks()[0];
        const settings = activeTrack?.getSettings();
        if (settings?.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        } else {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setPermissionState('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please update your browser settings.');
      } else {
        setError('Could not access camera: ' + (err.message || 'Unknown error'));
      }
      setIsActive(false);
    }
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    startCamera(id);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions equal to the video stream size
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Draw current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(dataUrl);

        // Flash screen indicator effect
        const flashOverlay = document.getElementById('camera-flash');
        if (flashOverlay) {
          flashOverlay.classList.remove('opacity-0');
          flashOverlay.classList.add('opacity-80');
          setTimeout(() => {
            flashOverlay.classList.remove('opacity-80');
            flashOverlay.classList.add('opacity-0');
          }, 150);
        }

        // Stop camera after capture to save resource
        stopCamera();
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* If not active, show simple launch camera controls */}
      {!isActive ? (
        <button
          type="button"
          onClick={() => startCamera()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Camera className="h-4 w-4" />
          <span>Launch Direct Browser Camera</span>
        </button>
      ) : (
        <div className="border border-amber-200 bg-stone-900 rounded-2xl p-3 text-white space-y-3 overflow-hidden relative shadow-lg">
          {/* Header toolbar */}
          <div className="flex justify-between items-center text-[11px] font-semibold border-b border-stone-800 pb-2">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              Live Camera Stream
            </span>
            <div className="flex items-center gap-2">
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-0.5 text-white max-w-[120px] text-[10px] focus:outline-hidden"
                >
                  {devices.map((device, i) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={stopCamera}
                className="text-stone-400 hover:text-white underline font-bold"
              >
                Close
              </button>
            </div>
          </div>

          {/* Camera View Area */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1] flip-camera" // mirror view for intuitive selfie/capture, standard back can be adjusted but usually default mirror is fine
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Flash screen effect overlay */}
            <div 
              id="camera-flash" 
              className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none"
            />
          </div>

          {/* Captured placeholder canvas (hidden) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Bottom Actions toolbar */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={captureFrame}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              {buttonLabel}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px]">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <p className="font-medium leading-normal">{error}</p>
        </div>
      )}
    </div>
  );
}
