import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { HUD } from './HUD';
import { soundManager } from '../../lib/sound';
import {
  Play,
  Dumbbell,
  Sliders,
  HelpCircle,
  Trophy,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GameCanvasProps {
  onOpenCalibration: () => void;
  onOpenHelp: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onOpenCalibration,
  onOpenHelp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    status,
    countdownValue,
    manualMode,
    stats,
    isMuted,
    landmarks,
    hasCameraPermission,
    trackingStatus,
    calibration,
    startGame,
    startCountdown,
    pauseGame,
    resumeGame,
    setCountdownValue,
    triggerFlap,
    toggleMute,
    setManualMode,
  } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Run the full-screen physics and render loop
  useGameLoop({ canvasRef });

  // Monitor browser fullscreen state
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

  // Video Game Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is in an input or dialog
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'playing') {
          triggerFlap();
        } else if (status === 'idle') {
          handleStart();
        } else if (status === 'paused') {
          resumeGame();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (status === 'playing') {
          pauseGame();
        } else if (status === 'paused') {
          resumeGame();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        onOpenCalibration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, triggerFlap, pauseGame, resumeGame, toggleMute, onOpenCalibration]);

  // Handle countdown progression (3.. 2.. 1.. GO)
  useEffect(() => {
    if (status === 'countdown') {
      soundManager.playCountdownBeep(false);

      const timer = setInterval(() => {
        const current = useGameStore.getState().countdownValue;
        if (current > 1) {
          setCountdownValue(current - 1);
          soundManager.playCountdownBeep(false);
        } else {
          clearInterval(timer);
          soundManager.playCountdownBeep(true);
          startGame();
        }
      }, 900);

      return () => clearInterval(timer);
    }
  }, [status, setCountdownValue, startGame]);

  const handleStart = () => {
    if (!calibration.isCalibrated) {
      onOpenCalibration();
    } else {
      startCountdown();
    }
  };

  const handleScreenClick = () => {
    if (status === 'idle') {
      handleStart();
    } else if (status === 'playing' && manualMode) {
      triggerFlap();
    }
  };

  return (
    <div
      id="game-viewport-container"
      ref={containerRef}
      onClick={handleScreenClick}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 select-none flex items-center justify-center cursor-pointer"
    >
      {/* 2D HTML5 Canvas - Fullscreen Edge to Edge */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block absolute inset-0 pointer-events-none"
      />

      {/* Arcade Scanline visual layer */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />

      {/* HUD Layer (active during playing, countdown, or paused) */}
      {(status === 'playing' || status === 'countdown' || status === 'paused') && (
        <HUD onOpenCalibration={onOpenCalibration} onOpenHelp={onOpenHelp} />
      )}

      {/* Countdown Overlay (3, 2, 1, GO!) */}
      {status === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/40 backdrop-blur-xs pointer-events-none">
          <div className="flex flex-col items-center animate-bounce">
            <span
              className="font-arcade text-8xl sm:text-9xl text-amber-400 select-none"
              style={{
                textShadow:
                  '0 0 30px rgba(251, 191, 36, 0.9), 6px 6px 0 #78350f, -4px -4px 0 #78350f, 4px -4px 0 #78350f, -4px 4px 0 #78350f',
              }}
            >
              {countdownValue}
            </span>
            <div className="flex items-center gap-2 mt-6 bg-slate-900/90 border border-amber-500/40 px-6 py-2.5 rounded-full backdrop-blur-md shadow-2xl">
              <Dumbbell className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-arcade text-sm text-white tracking-widest uppercase">
                Get into High Plank Position!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Arcade Title / Attract Mode Screen Overlay */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between z-30 bg-slate-950/45 backdrop-blur-[2px] p-4 sm:p-8 pointer-events-auto">
          {/* Top Quick Actions bar */}
          <div className="w-full max-w-5xl flex items-center justify-between">
            {/* High Score and Total Reps badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-xs shadow-xl backdrop-blur-md">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">High Score:</span>
                <span className="font-arcade text-amber-300 text-xs">{stats.highScore}</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs shadow-xl backdrop-blur-md">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Lifetime Reps:</span>
                <span className="font-arcade text-white text-xs">{stats.totalLifetimeReps}</span>
              </div>
            </div>

            {/* Quick Game Settings Icons */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-xl backdrop-blur-md">
              <button
                id="title-help-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHelp();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="How to Play"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                id="title-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-200" />}
              </button>

              <button
                id="title-fullscreen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Center Arcade Title Marquee & Call To Action */}
          <div className="flex flex-col items-center text-center max-w-lg">
            {/* Arcade Logo Banner */}
            <div className="relative mb-2">
              <span className="text-[11px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-lg inline-block mb-3 font-arcade">
                EXER-GAMING ARCADE
              </span>
              <h1
                className="font-arcade text-4xl sm:text-6xl text-white tracking-wider drop-shadow-2xl"
                style={{
                  textShadow:
                    '0 0 35px rgba(245, 158, 11, 0.6), 5px 5px 0 #78350f, -3px -3px 0 #78350f, 3px -3px 0 #78350f, -3px 3px 0 #78350f, 0 8px 24px rgba(0,0,0,0.9)',
                }}
              >
                PUSHUP BIRD
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-2 font-medium leading-relaxed drop-shadow-md">
              Lower your chest into a push-up and push back up to flap through the pipes!
            </p>

            {/* Quick 3-Step Mechanics Strip */}
            <div className="grid grid-cols-3 gap-2.5 w-full my-5 text-left">
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <span className="font-arcade text-[9px] text-cyan-400">1. SETUP</span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Laptop on floor facing you.
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <span className="font-arcade text-[9px] text-amber-400">2. DOWN</span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Lower chest toward floor.
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
                <span className="font-arcade text-[9px] text-emerald-400">3. PUSH UP</span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Push up to trigger flap!
                </p>
              </div>
            </div>

            {/* Big Arcade Start Button */}
            <button
              id="title-start-game-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
              className="w-full py-4 px-8 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-2 border-amber-300/60"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="font-arcade text-sm">PRESS TO START GAME</span>
            </button>

            <span className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
              <span>Or press</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono-code text-slate-200 text-xs">
                SPACEBAR
              </kbd>
            </span>
          </div>

          {/* Bottom Telemetry & Calibration Bar */}
          <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-900/85 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl">
            {/* Camera status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  hasCameraPermission === false
                    ? 'bg-red-500'
                    : trackingStatus === 'tracking' && landmarks.faceDetected
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-[11px] text-slate-300">
                {hasCameraPermission === false
                  ? 'Camera Blocked (Spacebar Mode Ready)'
                  : trackingStatus === 'tracking' && landmarks.faceDetected
                  ? 'Webcam Face Vision Active • 100% Private'
                  : 'Webcam Vision Initializing...'}
              </span>
            </div>

            {/* Action buttons: Calibrate & Manual Mode */}
            <div className="flex items-center gap-2">
              <button
                id="title-calibrate-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCalibration();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Calibrate Depth Range</span>
              </button>

              <button
                id="title-toggle-manual-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setManualMode(!manualMode);
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  manualMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>{manualMode ? 'Manual: ON' : 'Manual: OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
