import React, { useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useFaceTracker } from '../../hooks/useFaceTracker';
import { Camera, Eye, Maximize2, Minimize2, VideoOff } from 'lucide-react';

interface CameraFeedProps {
  compact?: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ compact = true }) => {
  const {
    hasCameraPermission,
    trackingStatus,
    landmarks,
    pushUpState,
    calibration,
    fps,
  } = useGameStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Run the MediaPipe Face Tracker hook
  useFaceTracker({
    videoRef,
    canvasOverlayRef: canvasRef,
  });

  const getStatusBadge = () => {
    if (hasCameraPermission === false) {
      return {
        label: 'Camera Blocked',
        color: 'bg-red-500/20 text-red-400 border-red-500/40',
        dot: 'bg-red-500',
      };
    }
    if (trackingStatus === 'initializing') {
      return {
        label: 'Starting Vision...',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400 animate-pulse',
      };
    }
    if (trackingStatus === 'tracking' && landmarks.faceDetected) {
      return {
        label: 'Face Locked',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
      };
    }
    return {
      label: 'Locating Face...',
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      dot: 'bg-yellow-400 animate-ping',
    };
  };

  const badge = getStatusBadge();

  return (
    <div
      id="camera-feed-container"
      className={`relative transition-all duration-300 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/90 shadow-2xl backdrop-blur-md ${
        isExpanded
          ? 'w-72 h-56'
          : compact
          ? 'w-44 h-32'
          : 'w-full max-w-sm h-64'
      }`}
    >
      {/* Video Feed (mirrored for natural webcam experience) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover -scale-x-100"
      />

      {/* Overlay Canvas for Landmark dots and depth guide */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Camera Blocked Fallback */}
      {hasCameraPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-3">
          <VideoOff className="w-8 h-8 text-red-400 mb-1" />
          <p className="text-xs font-semibold text-red-300">Camera Access Denied</p>
          <p className="text-[10px] text-slate-400 mt-1">Enable camera in browser permissions or use Spacebar mode</p>
        </div>
      )}

      {/* Status Bar Header */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium backdrop-blur-sm ${badge.color}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span>{badge.label}</span>
        </div>

        {compact && (
          <button
            id="camera-toggle-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
            title={isExpanded ? 'Minimize Camera' : 'Expand Camera'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Bottom Telemetry Info */}
      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono-code text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span>{fps > 0 ? `${fps} FPS` : '--'}</span>
          <span>•</span>
          <span className={pushUpState === 'BOTTOM' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
            {pushUpState}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>{landmarks.depthRatio ? `${landmarks.depthRatio}x` : '1.0x'}</span>
        </div>
      </div>
    </div>
  );
};
