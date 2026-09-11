import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Dumbbell,
  Clock,
  Flame,
  RotateCcw,
  Timer,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';

interface GameOverModalProps {
  onRestart: () => void;
  onOpenCalibration: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart, onOpenCalibration }) => {
  const { stats, status } = useGameStore();

  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);

  useEffect(() => {
    if (status === 'gameover') {
      const isHigh = stats.score > 0 && stats.score >= stats.highScore;
      setIsNewHigh(isHigh);

      if (isHigh || stats.reps >= 10) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#ef4444'],
        });
      }
    }
  }, [status, stats.score, stats.highScore, stats.reps]);

  // Rest 60s timer countdown
  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restSecondsLeft]);

  const handleStartRest = () => {
    setRestSecondsLeft(60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="game-over-modal-backdrop"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        id="game-over-modal-card"
        className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/95 p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col gap-5 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center">
          {isNewHigh ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              New Personal Best!
            </div>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Session Finished
            </span>
          )}
          <h2 className="font-arcade text-2xl sm:text-3xl text-white tracking-wide mt-1">
            GAME OVER
          </h2>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Score */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1.5">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Pipes Cleared</span>
            <span className="font-arcade text-2xl text-white mt-1">{stats.score}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Best: {stats.highScore}</span>
          </div>

          {/* Push-Up Reps */}
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Verified Reps</span>
            <span className="font-arcade text-2xl text-amber-400 mt-1">{stats.reps}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Lifetime: {stats.totalLifetimeReps}</span>
          </div>

          {/* Duration */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Set Duration</span>
            <span className="font-mono-code text-xl font-bold text-white mt-1">
              {formatTime(stats.durationSeconds)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Time Under Tension</span>
          </div>

          {/* Calories Burned */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex flex-col items-center">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-1.5">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">Calories Est.</span>
            <span className="font-mono-code text-xl font-bold text-orange-400 mt-1">
              {stats.caloriesBurned} <span className="text-xs font-normal">kcal</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {stats.maxStreak > 1 ? `${stats.maxStreak}x streak` : 'Metabolic Burn'}
            </span>
          </div>
        </div>

        {/* Rest 60s Widget */}
        {restSecondsLeft !== null && restSecondsLeft > 0 ? (
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-pulse">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-cyan-200">Rest Timer Active</p>
                <p className="text-[11px] text-slate-400">Breathe and shake out your arms</p>
              </div>
            </div>
            <div className="font-arcade text-xl text-cyan-300">
              {restSecondsLeft}s
            </div>
          </div>
        ) : (
          <button
            id="start-rest-timer-btn"
            onClick={handleStartRest}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700/90 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Timer className="w-4 h-4 text-cyan-400" />
            Rest 60s (Recommended between sets)
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            id="gameover-restart-btn"
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-orange-500/25 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again (Next Set)
          </button>

          <button
            id="gameover-recalibrate-btn"
            onClick={onOpenCalibration}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Recalibrate Push-Up Depth Range
          </button>
        </div>
      </div>
    </div>
  );
};
