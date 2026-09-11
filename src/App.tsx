import React, { useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameCanvas } from './components/game/GameCanvas';
import { CalibrationModal } from './components/camera/CalibrationModal';
import { GameOverModal } from './components/game/GameOverModal';
import { CameraFeed } from './components/camera/CameraFeed';
import {
  Dumbbell,
  Shield,
  Sliders,
  Sparkles,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Keyboard,
  Info,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const {
    status,
    stats,
    isMuted,
    manualMode,
    calibration,
    toggleMute,
    setManualMode,
    startCountdown,
    resetGame,
    triggerFlap,
  } = useGameStore();

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStartGame = () => {
    if (!calibration.isCalibrated) {
      setIsCalibrationOpen(true);
    } else {
      startCountdown();
    }
  };

  const handleCalibrationComplete = () => {
    setIsCalibrationOpen(false);
    startCountdown();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 sm:p-5 relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 px-3 sm:px-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md mb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-arcade text-sm shadow-md shadow-amber-500/20">
            PB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-arcade text-base sm:text-lg text-white tracking-wide">
                PUSHUP BIRD
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                FLAPPY REPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Motion-controlled arcade exergaming</p>
          </div>
        </div>

        {/* Header Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lifetime Reps */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Total Reps:</span>
            <span className="font-arcade text-white text-[11px]">
              {stats.totalLifetimeReps}
            </span>
          </div>

          {/* High Score */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-slate-400">Best:</span>
            <span className="font-arcade text-white text-[11px]">{stats.highScore}</span>
          </div>

          {/* Recalibrate CTA */}
          <button
            id="nav-calibrate-btn"
            onClick={() => setIsCalibrationOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="Calibrate Push-Up Depth"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Calibrate</span>
          </button>

          {/* Audio toggle */}
          <button
            id="nav-mute-btn"
            onClick={toggleMute}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Instructions toggle */}
          <button
            id="nav-info-btn"
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="How to Play"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Instructions Drawer */}
      {showInstructions && (
        <div
          id="instructions-banner"
          className="w-full max-w-3xl mb-4 p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-xl text-slate-200 text-xs flex flex-col sm:flex-row gap-4 items-start justify-between animate-in slide-in-from-top-3 duration-200"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-arcade text-amber-400 text-[10px]">1. POSITIONING</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Place laptop or phone on the floor facing you. Angle the webcam slightly up (~30°).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-arcade text-cyan-400 text-[10px]">2. MOTION FLAP</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                Lower down toward the bottom of the push-up, then push back up! Each full push-up triggers a flap.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="font-arcade text-emerald-400 text-[10px]">3. 100% PRIVATE</span>
              <p className="mt-1 text-slate-300 leading-relaxed">
                MediaPipe runs locally in your browser via WebAssembly. Zero video is saved or sent to any server.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="self-end sm:self-center text-slate-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Game Arena */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        <GameCanvas onOpenCalibration={() => setIsCalibrationOpen(true)} />
      </main>

      {/* Bottom Floating Control & Privacy Footer */}
      <footer className="w-full max-w-4xl mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 px-3 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">
            In-Memory Edge Vision (MediaPipe Tasks WASM) • 100% Private
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="test-flap-footer-btn"
            onClick={triggerFlap}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1.5"
          >
            <Keyboard className="w-3 h-3 text-amber-400" />
            <span>Test Flap Impulse</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Adapted Physics: <span className="font-mono-code text-slate-300">g=0.12, v0=-8.2</span>
          </span>
        </div>
      </footer>

      {/* Calibration Modal */}
      {isCalibrationOpen && (
        <CalibrationModal
          onClose={() => setIsCalibrationOpen(false)}
          onComplete={handleCalibrationComplete}
        />
      )}

      {/* Game Over Modal */}
      {status === 'gameover' && (
        <GameOverModal
          onRestart={resetGame}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
        />
      )}
    </div>
  );
}
