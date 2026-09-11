import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { usePushUpDetector } from '../../hooks/usePushUpDetector';
import { CameraFeed } from '../camera/CameraFeed';
import { Dumbbell, Flame, Volume2, VolumeX, Sliders, Keyboard } from 'lucide-react';

interface HUDProps {
  onOpenCalibration: () => void;
}

export const HUD: React.FC<HUDProps> = ({ onOpenCalibration }) => {
  const {
    status,
    stats,
    isMuted,
    manualMode,
    toggleMute,
    setManualMode,
    triggerFlap,
  } = useGameStore();

  const { progressPercent, isTargetDepthReached, pushUpState } = usePushUpDetector();

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-20">
      {/* Top Row: Score, Reps Badge, PiP Stream & Quick Controls */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Rep Counter & Streak */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Rep Counter Badge */}
          <div
            id="rep-counter-badge"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-md">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Push-Up Reps
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-arcade text-lg text-white leading-none">
                  {stats.reps}
                </span>
                <span className="text-[10px] text-slate-400">reps</span>
              </div>
            </div>
          </div>

          {/* Calorie & Streak pill */}
          {stats.reps > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-mono-code backdrop-blur-xs">
                <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
                <span>{stats.caloriesBurned} kcal</span>
              </div>
              {stats.streak > 1 && (
                <div className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold">
                  {stats.streak}x STREAK
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Giant Retro Pipes-Cleared Score */}
        <div className="flex flex-col items-center">
          <div
            id="giant-score-display"
            className="font-arcade text-4xl sm:text-5xl text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] select-none"
            style={{
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            }}
          >
            {stats.score}
          </div>
          {stats.highScore > 0 && (
            <span className="text-[11px] font-mono-code text-amber-300 bg-slate-950/60 px-2.5 py-0.5 rounded-full mt-1 border border-amber-500/20 backdrop-blur-xs">
              BEST: {stats.highScore}
            </span>
          )}
        </div>

        {/* Right: PiP Camera Preview & Quick Options */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <CameraFeed compact={true} />

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 backdrop-blur-sm">
            <button
              id="hud-mute-btn"
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="hud-calibration-btn"
              onClick={onOpenCalibration}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Recalibrate Rep Depth"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              id="hud-manual-toggle-btn"
              onClick={() => setManualMode(!manualMode)}
              className={`p-1.5 rounded-lg transition-colors ${
                manualMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Toggle Spacebar / Click manual testing mode"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Left Vertical Side: Form Quality Depth Bar */}
      <div className="flex items-center pointer-events-none mb-12">
        <div
          id="form-quality-depth-meter"
          className="flex flex-col items-center bg-slate-950/80 p-2 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md"
        >
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            DEPTH
          </span>

          {/* Meter Track */}
          <div className="relative w-3.5 h-36 bg-slate-800 rounded-full overflow-hidden p-0.5 flex flex-col justify-end">
            {/* Target Depth Marker Line */}
            <div className="absolute top-[30%] left-0 right-0 h-0.5 bg-amber-400/80 z-10" />

            {/* Depth Fill Gauge */}
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                isTargetDepthReached
                  ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                  : 'bg-gradient-to-t from-cyan-500 to-sky-400'
              }`}
              style={{ height: `${Math.max(6, progressPercent)}%` }}
            />
          </div>

          <span
            className={`text-[9px] font-mono-code font-bold mt-1.5 ${
              isTargetDepthReached ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {progressPercent}%
          </span>

          {/* Quick status cue */}
          <span className="text-[8px] text-slate-400 mt-0.5 text-center leading-tight">
            {pushUpState === 'BOTTOM' ? 'PUSH UP!' : 'DOWN'}
          </span>
        </div>
      </div>

      {/* Bottom Hint / Manual Flap Button */}
      {status === 'playing' && (
        <div className="w-full flex items-center justify-center pointer-events-auto">
          {manualMode && (
            <button
              id="manual-flap-tap-btn"
              onClick={triggerFlap}
              className="px-6 py-2 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-arcade text-xs tracking-wider shadow-xl transition-transform active:scale-95 flex items-center gap-2"
            >
              SPACEBAR OR TAP TO FLAP
            </button>
          )}
        </div>
      )}
    </div>
  );
};
