import React from 'react';
import {
  Dumbbell,
  ShieldCheck,
  Video,
  Keyboard,
  Maximize2,
  Sparkles,
  X,
  Volume2,
} from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div
      id="how-to-play-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="how-to-play-modal-card"
        className="w-full max-w-lg rounded-3xl border-2 border-amber-500/40 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col gap-4 relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-arcade text-xs">
              ?
            </div>
            <div>
              <h2 className="font-arcade text-base sm:text-lg text-white tracking-wide flex items-center gap-2">
                HOW TO PLAY
              </h2>
              <p className="text-xs text-slate-400">Motion-Controlled Flappy Bird Exergaming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Steps */}
        <div className="space-y-3 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="font-arcade text-sky-400 text-[10px]">1. CAMERA PLACEMENT</span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Place your laptop or phone on the floor facing you, tilted slightly up (~30°). Assume a high plank position with your face in view.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-arcade text-amber-400 text-[10px]">2. PUSH-UP FLAP MECHANIC</span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Lower your chest toward the floor to fill the depth meter. Then, push powerfully back up to the top plank! Each rep flaps the bird through the pipes.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-arcade text-emerald-400 text-[10px]">3. GAME CONTROLS & HOTKEYS</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-300 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-[10px] text-amber-300">
                    SPACE / CLICK
                  </kbd>
                  <span>Manual Flap</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-[10px] text-amber-300">
                    P / ESC
                  </kbd>
                  <span>Pause Game</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-[10px] text-amber-300">
                    F
                  </kbd>
                  <span>Toggle Fullscreen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono-code text-[10px] text-amber-300">
                    M
                  </kbd>
                  <span>Mute Audio</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            MediaPipe face tracking runs 100% locally via WebAssembly. No video is ever saved or transmitted.
          </span>
        </div>

        {/* Action Button */}
        <button
          id="how-to-play-confirm-btn"
          onClick={onClose}
          className="w-full py-3 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-orange-500/25 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          GOT IT, LET&apos;S REP!
        </button>
      </div>
    </div>
  );
};
