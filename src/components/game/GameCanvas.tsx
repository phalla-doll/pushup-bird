import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { HUD } from './HUD';
import { PHYSICS } from '../../lib/physics';
import { soundManager } from '../../lib/sound';
import { Play, Dumbbell, Sparkles } from 'lucide-react';

interface GameCanvasProps {
  onOpenCalibration: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onOpenCalibration }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    status,
    countdownValue,
    manualMode,
    startGame,
    startCountdown,
    setCountdownValue,
    triggerFlap,
  } = useGameStore();

  // Run the physics and render loop
  useGameLoop({ canvasRef });

  // Handle Spacebar and tap controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'playing') {
          triggerFlap();
        } else if (status === 'idle') {
          startCountdown();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, triggerFlap, startCountdown]);

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

  const handleScreenClick = () => {
    if (status === 'idle') {
      startCountdown();
    } else if (status === 'playing' && manualMode) {
      triggerFlap();
    }
  };

  return (
    <div
      id="game-viewport-container"
      onClick={handleScreenClick}
      className="relative w-full max-w-[480px] h-[640px] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 select-none flex items-center justify-center cursor-pointer"
    >
      {/* 2D HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        width={PHYSICS.CANVAS_WIDTH}
        height={PHYSICS.CANVAS_HEIGHT}
        className="w-full h-full object-contain"
      />

      {/* Arcade Scanline visual layer */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      {/* HUD Layer (active during countdown and playing) */}
      {(status === 'playing' || status === 'countdown') && (
        <HUD onOpenCalibration={onOpenCalibration} />
      )}

      {/* Countdown Overlay (3, 2, 1, GO!) */}
      {status === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/40 backdrop-blur-xs">
          <div className="flex flex-col items-center animate-bounce">
            <span className="font-arcade text-7xl sm:text-8xl text-amber-400 drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
              {countdownValue}
            </span>
            <span className="text-sm font-semibold tracking-widest uppercase text-white bg-slate-900/80 px-4 py-1.5 rounded-full border border-amber-500/30 mt-4 backdrop-blur-sm">
              Get into Plank Position!
            </span>
          </div>
        </div>
      )}

      {/* Idle / Ready Start Screen Overlay */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/55 backdrop-blur-xs p-6 text-center">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl max-w-xs flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 animate-pulse">
              <Dumbbell className="w-7 h-7" />
            </div>

            <div>
              <h2 className="font-arcade text-xl text-white">READY TO REP?</h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Lower your chest into a push-up and push back up to flap through the pipes!
              </p>
            </div>

            <button
              id="start-gameplay-btn"
              onClick={(e) => {
                e.stopPropagation();
                startCountdown();
              }}
              className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              START REPPING
            </button>

            <span className="text-[11px] text-slate-400">
              Or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono-code text-slate-200">SPACE</kbd>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
