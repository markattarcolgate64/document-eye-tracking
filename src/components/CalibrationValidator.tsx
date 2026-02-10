"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { onGaze, removeGazeListener } from "@/lib/gaze-engine";
import type { CalibrationQuality, GazePoint } from "@/types";

const VALIDATION_POINTS = [
  { x: 25, y: 25 },
  { x: 75, y: 25 },
  { x: 75, y: 75 },
  { x: 25, y: 75 },
];

const SAMPLES_PER_POINT = 30;
const TIMEOUT_PER_POINT_MS = 8000;

interface Props {
  onComplete: (quality: CalibrationQuality, averageError: number) => void;
  onRetry: () => void;
}

export default function CalibrationValidator({ onComplete, onRetry }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  const activeIndexRef = useRef(0);
  const samplesRef = useRef<GazePoint[]>([]);
  const errorsRef = useRef<number[]>([]);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const finishPoint = useCallback((samples: GazePoint[], idx: number) => {
    const target = VALIDATION_POINTS[idx];
    const screenX = (target.x / 100) * window.innerWidth;
    const screenY = (target.y / 100) * window.innerHeight;

    let avgError = 300;
    if (samples.length > 0) {
      avgError = samples.reduce((sum, s) => {
        const dx = s.x - screenX;
        const dy = s.y - screenY;
        return sum + Math.sqrt(dx * dx + dy * dy);
      }, 0) / samples.length;
    }

    errorsRef.current.push(avgError);

    if (idx < VALIDATION_POINTS.length - 1) {
      samplesRef.current = [];
      setDisplayCount(0);
      setActiveIndex(idx + 1);
    } else {
      if (doneRef.current) return;
      doneRef.current = true;

      const totalError = errorsRef.current.reduce((a, b) => a + b, 0) / errorsRef.current.length;

      let quality: CalibrationQuality;
      if (totalError < 75) quality = "excellent";
      else if (totalError < 150) quality = "good";
      else if (totalError < 250) quality = "fair";
      else quality = "poor";

      onCompleteRef.current(quality, totalError);
    }
  }, []);

  useEffect(() => {
    if (doneRef.current) return;

    samplesRef.current = [];

    const startTimeout = setTimeout(() => {
      onGaze((point: GazePoint) => {
        if (doneRef.current) return;
        samplesRef.current.push(point);
        setDisplayCount(samplesRef.current.length);

        if (samplesRef.current.length >= SAMPLES_PER_POINT) {
          removeGazeListener();
          finishPoint([...samplesRef.current], activeIndexRef.current);
        }
      });
    }, 800);

    const fallbackTimeout = setTimeout(() => {
      if (doneRef.current) return;
      removeGazeListener();
      finishPoint([...samplesRef.current], activeIndexRef.current);
    }, TIMEOUT_PER_POINT_MS);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(fallbackTimeout);
      removeGazeListener();
    };
  }, [activeIndex, finishPoint]);

  const point = VALIDATION_POINTS[activeIndex];

  return (
    <div className="min-h-screen relative bg-gray-950">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 px-6 py-3 rounded-full text-center">
        <p className="text-white text-sm">
          Validation: Look at the dot ({activeIndex + 1}/{VALIDATION_POINTS.length})
        </p>
        <p className="text-blue-400 text-xs mt-1">
          {displayCount > 0
            ? `Collecting... (${displayCount}/${SAMPLES_PER_POINT})`
            : "Get ready..."}
        </p>
      </div>

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 z-50"
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-yellow-500 animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-yellow-300" />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        <button
          onClick={onRetry}
          className="text-xs px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Re-calibrate
        </button>
        <button
          onClick={() => {
            if (doneRef.current) return;
            doneRef.current = true;
            removeGazeListener();
            onComplete("fair", 200);
          }}
          className="text-xs px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors"
        >
          Skip Validation
        </button>
      </div>
    </div>
  );
}
