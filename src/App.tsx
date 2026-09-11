import React, { useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { GameCanvas } from './components/game/GameCanvas';
import { CalibrationModal } from './components/camera/CalibrationModal';
import { GameOverModal } from './components/game/GameOverModal';
import { HowToPlayModal } from './components/game/HowToPlayModal';

export default function App() {
  const {
    status,
    startCountdown,
    resetGame,
  } = useGameStore();

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleCalibrationComplete = () => {
    setIsCalibrationOpen(false);
    startCountdown();
  };

  return (
    <div
      id="video-game-root"
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none"
    >
      {/* 100% Full-Screen Video Game Arena */}
      <GameCanvas
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* In-Game Calibration Modal Overlay */}
      {isCalibrationOpen && (
        <CalibrationModal
          onClose={() => setIsCalibrationOpen(false)}
          onComplete={handleCalibrationComplete}
        />
      )}

      {/* In-Game Controls & How to Play Guide Modal */}
      {isHelpOpen && (
        <HowToPlayModal onClose={() => setIsHelpOpen(false)} />
      )}

      {/* In-Game Set Results / Game Over Modal */}
      {status === 'gameover' && (
        <GameOverModal
          onRestart={() => {
            resetGame();
            startCountdown();
          }}
          onOpenCalibration={() => setIsCalibrationOpen(true)}
        />
      )}
    </div>
  );
}
