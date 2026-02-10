"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { onGaze, removeGazeListener } from "@/lib/gaze-engine";
import type { GazePoint } from "@/types";

interface HeadPositionStatus {
  faceDetected: boolean;
  isStable: boolean;
  message: string;
}

interface Props {
  onReady: () => void;
}

export default function HeadPositionGuide({ onReady }: Props) {
  const [status, setStatus] = useState<HeadPositionStatus>({
    faceDetected: false,
    isStable: false,
    message: "Waiting for face detection...",
  });
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);
  const gazeCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const handleGazeForDetection = useCallback((point: GazePoint) => {
    if (point && !isNaN(point.x) && !isNaN(point.y)) {
      gazeCountRef.current++;
    }
  }, []);

  useEffect(() => {
    onGaze(handleGazeForDetection);

    const checkInterval = setInterval(() => {
      const count = gazeCountRef.current;

      if (count === 0) {
        setStatus({
          faceDetected: false,
          isStable: false,
          message: "No face detected. Ensure good lighting and face the camera.",
        });
        setReadyCountdown(null);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }

      const isStable = count >= 3;
      gazeCountRef.current = 0;

      if (!isStable) {
        setStatus({
          faceDetected: true,
          isStable: false,
          message: "Face detected -- hold still...",
        });
        return;
      }

      setStatus({
        faceDetected: true,
        isStable: true,
        message: "Position looks good!",
      });

      if (!countdownRef.current) {
        setReadyCountdown(3);
        let count = 3;
        countdownRef.current = setInterval(() => {
          count--;
          if (count <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            removeGazeListener();
            onReadyRef.current();
          } else {
            setReadyCountdown(count);
          }
        }, 1000);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      removeGazeListener();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [handleGazeForDetection]);

  // Move WebGazer video into our container for the position check
  useEffect(() => {
    const moveVideo = () => {
      const container = document.getElementById("head-position-video-slot");
      const wgContainer = document.getElementById("webgazerVideoContainer");
      if (container && wgContainer) {
        wgContainer.style.cssText = `
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1 !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        `;
      }
    };

    moveVideo();
    const retryTimeout = setTimeout(moveVideo, 500);

    return () => {
      clearTimeout(retryTimeout);
      // Restore default styling -- CSS will take over
      const wgContainer = document.getElementById("webgazerVideoContainer");
      if (wgContainer) {
        wgContainer.style.cssText = "";
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="head-position-video-slot"
        className="relative w-72 h-52 rounded-2xl overflow-hidden border-2 border-gray-700 bg-gray-900"
      >
        {/* WebGazer video gets repositioned here */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className={`w-36 h-48 rounded-[50%] border-2 border-dashed transition-colors duration-300 ${
              status.isStable
                ? "border-green-500"
                : status.faceDetected
                ? "border-yellow-500"
                : "border-red-500/50"
            }`}
          />
        </div>
      </div>

      <div className="space-y-2 w-72">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              status.faceDetected ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span className="text-xs text-gray-400">Face detected</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              status.isStable ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span className="text-xs text-gray-400">Position stable</span>
        </div>
      </div>

      <p
        className={`text-sm font-medium ${
          status.isStable ? "text-green-400" : "text-yellow-400"
        }`}
      >
        {readyCountdown !== null
          ? `Starting calibration in ${readyCountdown}...`
          : status.message}
      </p>
    </div>
  );
}
