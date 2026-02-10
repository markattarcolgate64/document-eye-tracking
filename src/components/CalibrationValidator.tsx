"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onGaze, removeGazeListener } from "@/lib/gaze-engine";
import type { CalibrationQuality, GazePoint } from "@/types";

const VALIDATION_POINTS = [
  { x: 25, y: 25 },
  { x: 75, y: 25 },
  { x: 75, y: 75 },
  { x: 25, y: 75 },
];

const SAMPLES_PER_POINT = 30;

interface Props {
  onComplete: (quality: CalibrationQuality, averageError: number) => void;
  onRetry: () => void;
}

export default function CalibrationValidator({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const samplesRef = useRef<GazePoint[]>([]);
  const errorsRef = useRef<number[]>([]);

  const calculateError = useCallback(
    (targetX: number, targetY: number, samples: GazePoint[]) => {
      const screenX = (targetX / 100) * window.innerWidth;
      const screenY = (targetY / 100) * window.innerHeight;

      const avgError =
        samples.reduce((sum, s) => {
          const dx = s.x - screenX;
          const dy = s.y - screenY;
          return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0) / samples.length;

      return avgError;
    },
    []
  );

  const startCollecting = useCallback(() => {
    setIsCollecting(true);
    samplesRef.current = [];

    onGaze((point: GazePoint) => {
      samplesRef.current.push(point);
      setSampleCount(samplesRef.current.length);

      if (samplesRef.current.length >= SAMPLES_PER_POINT) {
        removeGazeListener();
        setIsCollecting(false);

        const target = VALIDATION_POINTS[activeIndex];
        const error = calculateError(
          target.x,
          target.y,
          samplesRef.current
        );
        errorsRef.current.push(error);

        if (activeIndex < VALIDATION_POINTS.length - 1) {
          setActiveIndex((prev) => prev + 1);
        } else {
          const avgError =
            errorsRef.current.reduce((a, b) => a + b, 0) /
            errorsRef.current.length;

          let quality: CalibrationQuality;
          if (avgError < 75) quality = "excellent";
          else if (avgError < 125) quality = "good";
          else if (avgError < 200) quality = "fair";
          else quality = "poor";

          onComplete(quality, avgError);
        }
      }
    });
  }, [activeIndex, calculateError, onComplete]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startCollecting();
    }, 1000);
    return () => {
      clearTimeout(timeout);
      removeGazeListener();
    };
  }, [activeIndex, startCollecting]);

  const point = VALIDATION_POINTS[activeIndex];

  return (
    <div className="min-h-screen relative bg-gray-950">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 px-6 py-3 rounded-full">
        <p className="text-white text-sm">
          Validation: Look at the dot ({activeIndex + 1}/
          {VALIDATION_POINTS.length})
        </p>
        {isCollecting && (
          <p className="text-blue-400 text-xs mt-1 text-center">
            Collecting... ({sampleCount}/{SAMPLES_PER_POINT})
          </p>
        )}
      </div>

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-yellow-500 animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-yellow-300" />
        </div>
      </div>
    </div>
  );
}
