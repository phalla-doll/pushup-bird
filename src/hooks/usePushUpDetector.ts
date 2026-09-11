import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PushUpState } from '../types';

export function usePushUpDetector() {
  const {
    status,
    landmarks,
    calibration,
    pushUpState,
    setPushUpState,
    triggerFlap,
    registerRep,
  } = useGameStore();

  const lastFlapTimeRef = useRef<number>(0);
  const internalStateRef = useRef<PushUpState>('TOP');
  const maxDepthReachedRef = useRef<number>(0);

  // Keep internal ref in sync
  useEffect(() => {
    internalStateRef.current = pushUpState;
  }, [pushUpState]);

  useEffect(() => {
    if (!landmarks.faceDetected) {
      return;
    }

    const { noseY, depthRatio, timestamp } = landmarks;
    const { yTopThreshold, yBottomThreshold, minDepthRatio } = calibration;
    const now = timestamp || performance.now();

    // Enforce 350ms cooldown window post-flap
    if (now - lastFlapTimeRef.current < 350) {
      return;
    }

    const currentState = internalStateRef.current;

    // Evaluate state machine transitions
    if (currentState === 'TOP' || currentState === 'COOLDOWN') {
      // User is descending toward chest-down position
      // Both vertical drop and proximity expansion can validate
      const isDownVertical = noseY >= yBottomThreshold;
      // If user calibrated depth ratio, check proximity condition
      const isDownDepth = calibration.isCalibrated ? depthRatio >= minDepthRatio : true;

      if (isDownVertical && isDownDepth) {
        internalStateRef.current = 'BOTTOM';
        setPushUpState('BOTTOM');
        maxDepthReachedRef.current = noseY;
      }
    } else if (currentState === 'BOTTOM') {
      // Keep track of maximum depth
      if (noseY > maxDepthReachedRef.current) {
        maxDepthReachedRef.current = noseY;
      }

      // User pushing back up to top plank
      if (noseY <= yTopThreshold) {
        // Successful push-up rep completed!
        lastFlapTimeRef.current = now;
        internalStateRef.current = 'TOP';
        setPushUpState('TOP');

        if (status === 'playing') {
          triggerFlap();
          registerRep();
        }
      }
    }
  }, [
    landmarks,
    calibration,
    status,
    triggerFlap,
    registerRep,
    setPushUpState,
  ]);

  // Compute live normalized depth progress (0% to 100%) for visual form bar
  const yTop = calibration.yTopThreshold;
  const yBottom = calibration.yBottomThreshold;
  const range = Math.max(0.05, yBottom - yTop);
  const rawProgress = (landmarks.noseY - yTop) / range;
  const progressPercent = Math.max(0, Math.min(100, Math.round(rawProgress * 100)));

  return {
    pushUpState,
    progressPercent,
    isTargetDepthReached: landmarks.noseY >= yBottom,
  };
}
