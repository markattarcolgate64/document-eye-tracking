"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CalibrationPoint from "./CalibrationPoint";
import CalibrationValidator from "./CalibrationValidator";
import { useCalibrationStore } from "@/stores/calibration-store";
import { initGazeEngine, showPredictionPoints, showVideo } from "@/lib/gaze-engine";

const CALIBRATION_POINTS = [
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 90, y: 10 },
  { x: 10, y: 50 },
  { x: 50, y: 50 },
  { x: 90, y: 50 },
  { x: 10, y: 90 },
  { x: 50, y: 90 },
  { x: 90, y: 90 },
];

const CLICKS_PER_POINT = 5;

type Phase = "setup" | "calibrating" | "validating" | "complete";

export default function CalibrationScreen() {
  const router = useRouter();
  const { setCalibrated } = useCalibrationStore();
  const [phase, setPhase] = useState<Phase>("setup");
  const [activePointIndex, setActivePointIndex] = useState(0);
  const [clickCounts, setClickCounts] = useState<number[]>(
    CALIBRATION_POINTS.map(() => 0)
  );
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleStartCalibration = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      await initGazeEngine();
      await showPredictionPoints(false);
      await showVideo(true);
      setPhase("calibrating");
    } catch {
      setError(
        "Failed to initialize webcam. Please allow camera access and try again."
      );
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handlePointClick = useCallback(
    (index: number) => {
      setClickCounts((prev) => {
        const next = [...prev];
        next[index]++;
        return next;
      });

      const newCount = clickCounts[index] + 1;
      if (newCount >= CLICKS_PER_POINT) {
        if (index < CALIBRATION_POINTS.length - 1) {
          setActivePointIndex(index + 1);
        } else {
          setPhase("validating");
        }
      }
    },
    [clickCounts]
  );

  const handleValidationComplete = useCallback(
    (quality: "excellent" | "good" | "fair" | "poor", avgError: number) => {
      setCalibrated(quality, avgError);
      setPhase("complete");
    },
    [setCalibrated]
  );

  const handleRetry = useCallback(() => {
    setClickCounts(CALIBRATION_POINTS.map(() => 0));
    setActivePointIndex(0);
    setPhase("calibrating");
  }, []);

  const handleContinue = useCallback(() => {
    router.push("/read");
  }, [router]);

  const totalClicks = clickCounts.reduce((a, b) => a + b, 0);
  const totalRequired = CALIBRATION_POINTS.length * CLICKS_PER_POINT;
  const progress = (totalClicks / totalRequired) * 100;

  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-lg text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Eye Tracking Calibration
          </h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            We need to calibrate the eye tracker to your eyes. You will see 9
            dots on the screen. Look at each dot and click it 5 times. This
            helps the system learn where you are looking.
          </p>
          <ul className="text-left text-gray-400 mb-8 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">1.</span>
              Position yourself comfortably facing your webcam
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">2.</span>
              Ensure good lighting on your face
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">3.</span>
              Look at each dot and click it while looking at it
            </li>
          </ul>
          {error && (
            <p className="text-red-400 mb-4 text-sm">{error}</p>
          )}
          <button
            onClick={handleStartCalibration}
            disabled={isInitializing}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {isInitializing ? "Initializing Camera..." : "Start Calibration"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "validating") {
    return <CalibrationValidator onComplete={handleValidationComplete} onRetry={handleRetry} />;
  }

  if (phase === "complete") {
    const { quality, averageError } = useCalibrationStore.getState();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-lg text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Calibration Complete
          </h1>
          <div className="mb-6">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                quality === "excellent"
                  ? "bg-green-500/20 text-green-400"
                  : quality === "good"
                  ? "bg-blue-500/20 text-blue-400"
                  : quality === "fair"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              Quality: {quality?.charAt(0).toUpperCase()}{quality?.slice(1)}
            </span>
            <p className="text-gray-400 mt-2 text-sm">
              Average error: {averageError?.toFixed(0)}px
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Re-calibrate
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Continue to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calibrating phase
  return (
    <div className="min-h-screen relative bg-gray-950">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 px-6 py-3 rounded-full">
        <p className="text-white text-sm">
          Look at the pulsing dot and click it ({activePointIndex + 1}/
          {CALIBRATION_POINTS.length})
        </p>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {CALIBRATION_POINTS.map((point, idx) => (
        <CalibrationPoint
          key={idx}
          x={point.x}
          y={point.y}
          clickCount={clickCounts[idx]}
          requiredClicks={CLICKS_PER_POINT}
          isActive={idx === activePointIndex}
          onClick={() => handlePointClick(idx)}
        />
      ))}
    </div>
  );
}
