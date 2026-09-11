import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePushUpDetector } from '../../hooks/usePushUpDetector';
import { CameraFeed } from '../camera/CameraFeed';
import {
  Dumbbell,
  Flame,
  Volume2,
  VolumeX,
  Sliders,
  Keyboard,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface HUDProps {
  onOpenCalibration: () => void;
  onOpenHelp: () => void;
}

export const HUD: React.FC<HUDProps> = ({ onOpenCalibration, onOpenHelp }) => {
  const {
    status,
    stats,
    isMuted,
    manualMode,
    toggleMute,
    setManualMode,
    triggerFlap,
    pauseGame,
    resumeGame,
    resetGame,
    startCountdown,
  } = useGameStore();

  const { progressPercent, isTargetDepthReached, pushUpState } = usePushUpDetector();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pulse animation states for Score and Reps
  const [scorePulse, setScorePulse] = useState(false);
  const [repPulse, setRepPulse] = useState(false);

  const prevScoreRef = useRef(stats.score);
  const prevRepsRef = useRef(stats.reps);

  // Monitor fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Trigger pulse whenever score increases (pipe cleared)
  useEffect(() => {
    if (stats.score > prevScoreRef.current) {
      setScorePulse(true);
      const timer = setTimeout(() => setScorePulse(false), 360);
      prevScoreRef.current = stats.score;
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = stats.score;
  }, [stats.score]);

  // Trigger pulse whenever reps increase (push-up rep completed)
  useEffect(() => {
    if (stats.reps > prevRepsRef.current) {
      setRepPulse(true);
      const timer = setTimeout(() => setRepPulse(false), 390);
      prevRepsRef.current = stats.reps;
      return () => clearTimeout(timer);
    }
    prevRepsRef.current = stats.reps;
  }, [stats.reps]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20 select-none">
      {/* Top HUD Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Title Badge & Reps/Workout Stats */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Push-Up Reps Counter */}
          <div
            id="rep-counter-badge"
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border shadow-2xl backdrop-blur-md transition-all duration-200 will-change-transform ${
              repPulse
                ? 'animate-rep-pulse border-amber-400 bg-slate-800/95 ring-2 ring-amber-400/50 shadow-amber-500/30'
                : 'border-amber-500/40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-md transition-transform duration-200 ${
                repPulse ? 'scale-115 rotate-6' : ''
              }`}
            >
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${
                  repPulse ? 'text-amber-300' : 'text-amber-400'
                }`}
              >
                Push-Up Reps
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-arcade text-lg sm:text-xl leading-none transition-all duration-200 ${
                    repPulse ? 'text-amber-300 scale-110 inline-block drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-white'
                  }`}
                >
                  {stats.reps}
                </span>
                <span className="text-[10px] text-slate-400">reps</span>
              </div>
            </div>
          </div>

          {/* Calorie & Streak pill */}
          <div className="flex items-center gap-2">
            {stats.reps > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-mono-code backdrop-blur-sm shadow-md">
                <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span>{stats.caloriesBurned} kcal</span>
              </div>
            )}
            {stats.streak > 1 && (
              <div className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold shadow-md">
                {stats.streak}x STREAK
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Giant Arcade Pipes-Cleared Score */}
        <div className="flex flex-col items-center pointer-events-none">
          <div
            id="giant-score-display"
            className={`font-arcade text-5xl sm:text-6xl text-white select-none transition-all duration-150 will-change-transform ${
              scorePulse ? 'animate-score-pulse text-amber-300' : ''
            }`}
            style={{
              textShadow: scorePulse
                ? '0 0 24px rgba(251, 191, 36, 0.9), 4px 4px 0 #78350f, -3px -3px 0 #78350f, 3px -3px 0 #78350f, -3px 3px 0 #78350f'
                : '4px 4px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 6px 16px rgba(0,0,0,0.85)',
            }}
          >
            {stats.score}
          </div>
          {stats.highScore > 0 && (
            <span className="text-[11px] font-arcade text-amber-300 bg-slate-950/75 px-3 py-0.5 rounded-full mt-1 border border-amber-500/30 backdrop-blur-sm shadow-md">
              BEST: {stats.highScore}
            </span>
          )}
        </div>

        {/* Top Right: PiP Camera Feed & Arcade Action Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <CameraFeed compact={true} />

          <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md">
            {/* Pause button */}
            {status === 'playing' && (
              <button
                id="hud-pause-btn"
                onClick={pauseGame}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Pause Game (P or ESC)"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {/* Audio mute */}
            <button
              id="hud-mute-btn"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-200" />}
            </button>

            {/* Calibration button */}
            <button
              id="hud-calibration-btn"
              onClick={onOpenCalibration}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Calibrate Push-Up Depth"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Manual test flap mode toggle */}
            <button
              id="hud-manual-toggle-btn"
              onClick={() => setManualMode(!manualMode)}
              className={`p-2 rounded-xl transition-colors ${
                manualMode
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
              title="Toggle Spacebar / Tap manual testing mode"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Help / How to play */}
            <button
              id="hud-help-btn"
              onClick={onOpenHelp}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="How to Play & Controls"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Fullscreen toggle */}
            <button
              id="hud-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Left Vertical Side: Form Quality Depth Gauge */}
      <div className="flex items-center pointer-events-none mb-8">
        <div
          id="form-quality-depth-meter"
          className="flex flex-col items-center bg-slate-950/85 p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md"
        >
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-arcade">
            DEPTH
          </span>

          {/* Meter Track */}
          <div className="relative w-4 h-40 bg-slate-900 rounded-full overflow-hidden p-0.5 flex flex-col justify-end border border-slate-800">
            {/* Target Depth Marker Line */}
            <div className="absolute top-[30%] left-0 right-0 h-0.5 bg-amber-400 z-10 shadow-[0_0_6px_#f59e0b]" />

            {/* Depth Fill Gauge */}
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                isTargetDepthReached
                  ? 'bg-emerald-400 shadow-[0_0_14px_#34d399]'
                  : 'bg-gradient-to-t from-cyan-500 to-sky-400'
              }`}
              style={{ height: `${Math.max(6, progressPercent)}%` }}
            />
          </div>

          <span
            className={`text-[10px] font-mono-code font-bold mt-2 ${
              isTargetDepthReached ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
            }`}
          >
            {progressPercent}%
          </span>

          {/* Quick status cue */}
          <span
            className={`text-[9px] font-arcade mt-1 px-1.5 py-0.5 rounded text-center leading-tight ${
              pushUpState === 'BOTTOM'
                ? 'bg-amber-500/20 text-amber-300 font-bold'
                : 'text-slate-400'
            }`}
          >
            {pushUpState === 'BOTTOM' ? 'PUSH UP!' : 'DOWN'}
          </span>
        </div>
      </div>

      {/* Bottom Hint / Manual Flap Button */}
      {status === 'playing' && (
        <div className="w-full flex items-center justify-center pointer-events-auto pb-2">
          {manualMode ? (
            <button
              id="manual-flap-tap-btn"
              onClick={triggerFlap}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-arcade text-xs tracking-wider shadow-2xl transition-transform active:scale-95 flex items-center gap-2 border border-amber-300/40"
            >
              SPACEBAR OR TAP TO FLAP
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-xs">
              <span>Push-Up Motion Active</span>
              <span>•</span>
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-[10px] text-slate-300">P</kbd> to Pause</span>
            </div>
          )}
        </div>
      )}

      {/* In-Game Pause Menu Overlay */}
      {status === 'paused' && (
        <div
          id="in-game-pause-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl border-2 border-amber-500/40 bg-slate-900/95 p-6 shadow-2xl text-center flex flex-col items-center gap-4">
            <h2 className="font-arcade text-2xl text-white tracking-wider">
              GAME PAUSED
            </h2>
            <p className="text-xs text-slate-400">Take a breather, then jump back in!</p>

            <div className="w-full flex flex-col gap-2.5 mt-2">
              <button
                id="pause-resume-btn"
                onClick={resumeGame}
                className="w-full py-3 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                RESUME (P / SPACE)
              </button>

              <button
                id="pause-restart-btn"
                onClick={() => {
                  resetGame();
                  startCountdown();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart Set
              </button>

              <button
                id="pause-calibrate-btn"
                onClick={onOpenCalibration}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Calibrate Push-Up Depth
              </button>

              <button
                id="pause-quit-btn"
                onClick={resetGame}
                className="w-full py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Quit to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
