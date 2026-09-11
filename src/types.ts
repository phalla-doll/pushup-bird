export type GameStatus = 'idle' | 'calibrating' | 'countdown' | 'playing' | 'gameover';

export type PushUpState = 'TOP' | 'GOING_DOWN' | 'BOTTOM' | 'PUSHING_UP' | 'COOLDOWN';

export interface TrackingLandmarks {
  noseX: number;
  noseY: number;
  chinY: number;
  pupilDistance: number;
  depthRatio: number;
  faceDetected: boolean;
  timestamp: number;
}

export interface CalibrationProfile {
  yRest: number; // Top baseline position
  yChestDown: number; // Deep bottom position
  dRest: number; // Rest eye distance
  dChestDown: number; // Chest-down eye distance
  yTopThreshold: number; // Dynamic hysteresis top trigger
  yBottomThreshold: number; // Dynamic hysteresis bottom trigger
  minDepthRatio: number; // Proximity threshold
  isCalibrated: boolean;
}

export interface PipePair {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GameSessionStats {
  score: number;
  highScore: number;
  reps: number;
  totalLifetimeReps: number;
  startTime: number | null;
  durationSeconds: number;
  caloriesBurned: number;
  streak: number;
  maxStreak: number;
}
