import { useEffect, useRef, type RefObject } from 'react';
import { useGameStore } from '../store/useGameStore';
import { extractKeyLandmarks, getFaceLandmarker } from '../lib/vision';

interface UseFaceTrackerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasOverlayRef?: RefObject<HTMLCanvasElement | null>;
}

export function useFaceTracker({ videoRef, canvasOverlayRef }: UseFaceTrackerProps) {
  const {
    isVisionReady,
    calibration,
    setVisionReady,
    setCameraPermission,
    setTrackingStatus,
    updateLandmarks,
    setFps,
  } = useGameStore();

  const isRunningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize camera and FaceLandmarker
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    async function init() {
      try {
        setTrackingStatus('initializing');

        // Request camera with recommended 640x480 resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Initialize FaceLandmarker
        const landmarker = await getFaceLandmarker();
        if (isCancelled) return;

        if (landmarker) {
          setVisionReady(true);
          setTrackingStatus('tracking');
          startInferenceLoop();
        } else {
          setTrackingStatus('lost');
        }
      } catch (err) {
        console.warn('Camera permission not granted or unavailable (Manual Spacebar Mode available):', err);
        setCameraPermission(false);
        setTrackingStatus('lost');
      }
    }

    init();

    return () => {
      isCancelled = true;
      isRunningRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startInferenceLoop = () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const processFrame = async () => {
      if (!isRunningRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && !video.paused) {
        const now = performance.now();

        // Calculate FPS
        frameCountRef.current++;
        if (now - lastFpsCalcRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current)));
          frameCountRef.current = 0;
          lastFpsCalcRef.current = now;
        }

        // Process only new video frames
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          const landmarker = await getFaceLandmarker();
          if (landmarker && isRunningRef.current) {
            try {
              const results = landmarker.detectForVideo(video, now);

              if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const keyPoints = extractKeyLandmarks(results.faceLandmarks[0]);

                if (keyPoints) {
                  // Compute Depth Ratio: currentPupilDist / dRest
                  const dRest = calibration.dRest > 0 ? calibration.dRest : 0.12;
                  const depthRatio = Math.round((keyPoints.pupilDistance / dRest) * 100) / 100;

                  updateLandmarks({
                    noseX: keyPoints.noseX,
                    noseY: keyPoints.noseY,
                    chinY: keyPoints.chinY,
                    pupilDistance: keyPoints.pupilDistance,
                    depthRatio,
                    faceDetected: true,
                    timestamp: now,
                  });

                  setTrackingStatus('tracking');

                  // Draw landmark debug overlay on mini canvas
                  drawDebugOverlay(keyPoints.noseX, keyPoints.noseY, keyPoints.pupilDistance);
                }
              } else {
                updateLandmarks({ faceDetected: false });
                setTrackingStatus('lost');
                clearDebugOverlay();
              }
            } catch (inferErr) {
              // Frame dropped, proceed gracefully
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  const drawDebugOverlay = (noseX: number, noseY: number, pupilDist: number) => {
    const canvas = canvasOverlayRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Note: Video is mirrored in CSS (scale-x -1), so overlay can be drawn naturally or mirrored
    const nx = (1 - noseX) * canvas.width; // Mirrored coordinate
    const ny = noseY * canvas.height;

    // Draw nose tracking target dot
    ctx.beginPath();
    ctx.arc(nx, ny, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e'; // Bright Green
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Subtle crosshair
    ctx.beginPath();
    ctx.moveTo(nx - 12, ny);
    ctx.lineTo(nx + 12, ny);
    ctx.moveTo(nx, ny - 12);
    ctx.lineTo(nx, ny + 12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const clearDebugOverlay = () => {
    const canvas = canvasOverlayRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return { isVisionReady };
}
