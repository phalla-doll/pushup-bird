import { create } from 'zustand';
import { CalibrationProfile, GameSessionStats, GameStatus, PushUpState, TrackingLandmarks } from '../types';
import { soundManager } from '../lib/sound';

interface GameStoreState {
  // Game lifecycle
  status: GameStatus;
  countdownValue: number;
  stats: GameSessionStats;

  // Vision & tracking
  isVisionReady: boolean;
  hasCameraPermission: boolean | null;
  trackingStatus: 'initializing' | 'tracking' | 'lost' | 'simulated';
  landmarks: TrackingLandmarks;
  pushUpState: PushUpState;
  calibration: CalibrationProfile;
  fps: number;

  // Controls & triggers
  isMuted: boolean;
  manualMode: boolean; // Enables spacebar / click flap
  flapEvent: number; // Counter incremented on each flap trigger

  // Actions
  setStatus: (status: GameStatus) => void;
  setCountdownValue: (val: number) => void;
  triggerFlap: () => void;
  incrementScore: () => void;
  registerRep: () => void;
  updateLandmarks: (landmarks: Partial<TrackingLandmarks>) => void;
  setPushUpState: (state: PushUpState) => void;
  setCalibration: (profile: Partial<CalibrationProfile>) => void;
  setTrackingStatus: (status: 'initializing' | 'tracking' | 'lost' | 'simulated') => void;
  setVisionReady: (ready: boolean) => void;
  setCameraPermission: (granted: boolean) => void;
  setFps: (fps: number) => void;
  toggleMute: () => void;
  setManualMode: (enabled: boolean) => void;
  startCountdown: () => void;
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  resetCalibrationToDefaults: () => void;
}

const DEFAULT_CALIBRATION: CalibrationProfile = {
  yRest: 0.35,
  yChestDown: 0.72,
  dRest: 0.12,
  dChestDown: 0.17,
  yTopThreshold: 0.42, // default Y_top
  yBottomThreshold: 0.62, // default Y_bottom
  minDepthRatio: 1.25,
  isCalibrated: false,
};

const getSavedHighScore = (): number => {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('pushup_bird_high_score');
  return saved ? parseInt(saved, 10) || 0 : 0;
};

const getSavedTotalReps = (): number => {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('pushup_bird_total_reps');
  return saved ? parseInt(saved, 10) || 0 : 0;
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  status: 'idle',
  countdownValue: 3,
  stats: {
    score: 0,
    highScore: getSavedHighScore(),
    reps: 0,
    totalLifetimeReps: getSavedTotalReps(),
    startTime: null,
    durationSeconds: 0,
    caloriesBurned: 0,
    streak: 0,
    maxStreak: 0,
  },

  isVisionReady: false,
  hasCameraPermission: null,
  trackingStatus: 'initializing',
  landmarks: {
    noseX: 0.5,
    noseY: 0.4,
    chinY: 0.5,
    pupilDistance: 0.12,
    depthRatio: 1.0,
    faceDetected: false,
    timestamp: 0,
  },
  pushUpState: 'TOP',
  calibration: DEFAULT_CALIBRATION,
  fps: 0,

  isMuted: false,
  manualMode: false,
  flapEvent: 0,

  setStatus: (status) => set({ status }),
  setCountdownValue: (countdownValue) => set({ countdownValue }),

  triggerFlap: () => {
    soundManager.playFlap();
    set((state) => ({ flapEvent: state.flapEvent + 1 }));
  },

  incrementScore: () => {
    soundManager.playScore();
    set((state) => {
      const newScore = state.stats.score + 1;
      const newHigh = Math.max(newScore, state.stats.highScore);
      if (newHigh > state.stats.highScore) {
        localStorage.setItem('pushup_bird_high_score', newHigh.toString());
      }
      return {
        stats: {
          ...state.stats,
          score: newScore,
          highScore: newHigh,
        },
      };
    });
  },

  registerRep: () => {
    soundManager.playRepCelebration();
    set((state) => {
      const newReps = state.stats.reps + 1;
      const newTotal = state.stats.totalLifetimeReps + 1;
      const newStreak = state.stats.streak + 1;
      const newMaxStreak = Math.max(newStreak, state.stats.maxStreak);
      localStorage.setItem('pushup_bird_total_reps', newTotal.toString());

      // Approximate 0.38 kcal per pushup + slight effort factor
      const newCalories = Math.round((newReps * 0.4 + (state.stats.durationSeconds * 0.05)) * 10) / 10;

      return {
        stats: {
          ...state.stats,
          reps: newReps,
          totalLifetimeReps: newTotal,
          streak: newStreak,
          maxStreak: newMaxStreak,
          caloriesBurned: newCalories,
        },
      };
    });
  },

  updateLandmarks: (update) =>
    set((state) => ({
      landmarks: { ...state.landmarks, ...update },
    })),

  setPushUpState: (pushUpState) => set({ pushUpState }),

  setCalibration: (update) =>
    set((state) => ({
      calibration: { ...state.calibration, ...update },
    })),

  setTrackingStatus: (trackingStatus) => set({ trackingStatus }),
  setVisionReady: (isVisionReady) => set({ isVisionReady }),
  setCameraPermission: (hasCameraPermission) => set({ hasCameraPermission }),
  setFps: (fps) => set({ fps }),

  toggleMute: () =>
    set((state) => {
      const nextMuted = !state.isMuted;
      soundManager.setMuted(nextMuted);
      return { isMuted: nextMuted };
    }),

  setManualMode: (manualMode) => set({ manualMode }),

  startCountdown: () => {
    set({ status: 'countdown', countdownValue: 3 });
  },

  startGame: () => {
    set((state) => ({
      status: 'playing',
      stats: {
        ...state.stats,
        score: 0,
        reps: 0,
        startTime: Date.now(),
        durationSeconds: 0,
        caloriesBurned: 0,
        streak: 0,
      },
    }));
  },

  endGame: () => {
    soundManager.playCrash();
    set((state) => {
      const durationSeconds = state.stats.startTime
        ? Math.floor((Date.now() - state.stats.startTime) / 1000)
        : 0;
      const finalCalories = Math.round((state.stats.reps * 0.4 + (durationSeconds * 0.05)) * 10) / 10;

      return {
        status: 'gameover',
        stats: {
          ...state.stats,
          durationSeconds,
          caloriesBurned: finalCalories,
        },
      };
    });
  },

  resetGame: () => {
    set((state) => ({
      status: 'idle',
      stats: {
        ...state.stats,
        score: 0,
        reps: 0,
        startTime: null,
        durationSeconds: 0,
        caloriesBurned: 0,
        streak: 0,
      },
    }));
  },

  resetCalibrationToDefaults: () => {
    set({ calibration: DEFAULT_CALIBRATION });
  },
}));
