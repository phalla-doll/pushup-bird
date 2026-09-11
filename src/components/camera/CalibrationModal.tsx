import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CameraFeed } from './CameraFeed';
import { soundManager } from '../../lib/sound';
import { CheckCircle2, ChevronRight, ShieldCheck, Sparkles, X } from 'lucide-react';

interface CalibrationModalProps {
  onClose: () => void;
  onComplete: () => void;
}

type CalibrationStep = 'REST_POSITION' | 'HOLDING_REST' | 'PUSHUP_ACTION' | 'COMPLETED';

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ onClose, onComplete }) => {
  const {
    landmarks,
    calibration,
    setCalibration,
    resetCalibrationToDefaults,
  } = useGameStore();

  const [step, setStep] = useState<CalibrationStep>('REST_POSITION');
  const [holdProgress, setHoldProgress] = useState(0);
  const [lowestYRecorded, setLowestYRecorded] = useState(0.45);
  const [maxPupilDistRecorded, setMaxPupilDistRecorded] = useState(0.12);
  const [isFaceAligned, setIsFaceAligned] = useState(false);

  const baselineYRef = useRef(0.38);
  const baselinePupilRef = useRef(0.12);
  const holdStartRef = useRef<number | null>(null);

  // Check face visibility
  useEffect(() => {
    setIsFaceAligned(landmarks.faceDetected && landmarks.noseY > 0.1 && landmarks.noseY < 0.9);
  }, [landmarks]);

  // Step 2: 2-second hold in top plank position
  useEffect(() => {
    if (step === 'HOLDING_REST') {
      let intervalId: number;

      const checkHold = () => {
        if (!landmarks.faceDetected) {
          holdStartRef.current = null;
          setHoldProgress(0);
          return;
        }

        const now = Date.now();
        if (!holdStartRef.current) {
          holdStartRef.current = now;
        }

        const elapsed = now - holdStartRef.current;
        const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
        setHoldProgress(pct);

        if (pct >= 100) {
          // Record baseline
          baselineYRef.current = landmarks.noseY;
          baselinePupilRef.current = landmarks.pupilDistance;
          soundManager.playCountdownBeep(true);
          setStep('PUSHUP_ACTION');
        }
      };

      intervalId = window.setInterval(checkHold, 50);
      return () => clearInterval(intervalId);
    }
  }, [step, landmarks]);

  // Step 3: Monitor one full push-up rep (down then up)
  useEffect(() => {
    if (step === 'PUSHUP_ACTION') {
      if (!landmarks.faceDetected) return;

      const currentY = landmarks.noseY;
      const currentPupil = landmarks.pupilDistance;

      // Track the maximum nose drop (deepest push-up position)
      if (currentY > lowestYRecorded) {
        setLowestYRecorded(currentY);
      }
      if (currentPupil > maxPupilDistRecorded) {
        setMaxPupilDistRecorded(currentPupil);
      }

      // Check if user has gone down significantly and pushed back up near baseline
      const hasReachedBottom = lowestYRecorded - baselineYRef.current >= 0.14;
      const hasReturnedToTop = currentY <= baselineYRef.current + 0.08;

      if (hasReachedBottom && hasReturnedToTop) {
        // Step 4: Compute dynamic thresholds according to Section 6.1 spec
        // Y_bottom = Y_0 + 0.65 * (Y_max - Y_0)
        // Y_top = Y_0 + 0.20 * (Y_max - Y_0)
        const y0 = baselineYRef.current;
        const yMax = lowestYRecorded;
        const deltaY = Math.max(0.18, yMax - y0);

        const yBottomThreshold = Math.min(0.85, y0 + 0.65 * deltaY);
        const yTopThreshold = Math.max(0.20, y0 + 0.20 * deltaY);
        const minDepthRatio = Math.max(1.15, maxPupilDistRecorded / baselinePupilRef.current);

        setCalibration({
          yRest: y0,
          yChestDown: yMax,
          dRest: baselinePupilRef.current,
          dChestDown: maxPupilDistRecorded,
          yTopThreshold,
          yBottomThreshold,
          minDepthRatio,
          isCalibrated: true,
        });

        soundManager.playRepCelebration();
        setStep('COMPLETED');
      }
    }
  }, [step, landmarks, lowestYRecorded, maxPupilDistRecorded, setCalibration]);

  const handleStartHold = () => {
    holdStartRef.current = null;
    setHoldProgress(0);
    setStep('HOLDING_REST');
  };

  const handleUseDefaults = () => {
    resetCalibrationToDefaults();
    setCalibration({ isCalibrated: true });
    onComplete();
  };

  return (
    <div
      id="calibration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="calibration-modal-card"
        className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-slate-100 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-arcade text-xs">
              CAL
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Rep Calibration
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Biomechanical Setup
                </span>
              </h2>
              <p className="text-xs text-slate-400">10-second calibration to map your natural push-up range</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera View with Landmark Guide */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-full sm:w-1/2 flex justify-center">
            <CameraFeed compact={false} />
          </div>

          <div className="w-full sm:w-1/2 flex flex-col gap-3">
            {/* Step 1: Position check */}
            {step === 'REST_POSITION' && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl p-3.5 bg-slate-800/80 border border-slate-700">
                  <span className="text-xs font-arcade text-cyan-400">STEP 1 / 3</span>
                  <h3 className="font-semibold text-white mt-1 text-sm">Top Plank Setup</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Place your laptop on the floor facing you. Assume a high plank position with arms extended.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${isFaceAligned ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className={isFaceAligned ? 'text-emerald-300' : 'text-slate-400'}>
                    {isFaceAligned ? 'Face aligned in camera view' : 'Position face inside the frame'}
                  </span>
                </div>

                <button
                  id="calibration-start-hold-btn"
                  onClick={handleStartHold}
                  disabled={!isFaceAligned}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Hold Position (2s)
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Holding rest position */}
            {step === 'HOLDING_REST' && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl p-3.5 bg-slate-800/80 border border-cyan-500/30">
                  <span className="text-xs font-arcade text-cyan-400">STEP 2 / 3</span>
                  <h3 className="font-semibold text-white mt-1 text-sm">Hold Still (Top Plank)</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Recording baseline height and pupillary distance...
                  </p>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-75 rounded-full"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                  <span className="text-right text-[11px] text-cyan-300 font-mono-code block mt-1">
                    {holdProgress}%
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Perform 1 test push-up */}
            {step === 'PUSHUP_ACTION' && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl p-3.5 bg-slate-800/80 border border-amber-500/40">
                  <span className="text-xs font-arcade text-amber-400">STEP 3 / 3</span>
                  <h3 className="font-semibold text-white mt-1 text-sm">Do 1 Test Push-Up</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Lower your chest all the way down toward the floor, then push fully back up to the top!
                  </p>
                </div>

                <div className="space-y-1.5 text-xs font-mono-code bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Nose Y:</span>
                    <span className="text-cyan-300">{(landmarks.noseY || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Depth Reached:</span>
                    <span className="text-emerald-400">{lowestYRecorded.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Completed */}
            {step === 'COMPLETED' && (
              <div className="flex flex-col gap-3 text-center">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                  <h3 className="font-bold text-white text-base">Calibration Complete!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Dynamic top and bottom thresholds set for your body & camera angle.
                  </p>
                </div>

                <button
                  id="calibration-confirm-play-btn"
                  onClick={onComplete}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Ready! Launch Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & bypass */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero video stored or sent anywhere</span>
          </div>

          <button
            id="calibration-skip-preset-btn"
            onClick={handleUseDefaults}
            className="text-slate-400 hover:text-cyan-400 underline underline-offset-2 transition-colors text-[11px]"
          >
            Use standard preset instead
          </button>
        </div>
      </div>
    </div>
  );
};
