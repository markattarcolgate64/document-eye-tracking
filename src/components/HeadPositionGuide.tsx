"use client";

import { useEffect, useRef, useState } from "react";

interface HeadPositionStatus {
  isCentered: boolean;
  isCorrectDistance: boolean;
  isStable: boolean;
  message: string;
}

interface Props {
  onReady: () => void;
  compact?: boolean;
}

export default function HeadPositionGuide({ onReady, compact = false }: Props) {
  const [status, setStatus] = useState<HeadPositionStatus>({
    isCentered: false,
    isCorrectDistance: false,
    isStable: false,
    message: "Position your face in the oval guide",
  });
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const video = document.getElementById(
        "webgazerVideoFeed"
      ) as HTMLVideoElement | null;

      if (!video || video.videoWidth === 0) {
        setStatus({
          isCentered: false,
          isCorrectDistance: false,
          isStable: false,
          message: "Waiting for camera...",
        });
        return;
      }

      const faceOverlay = document.getElementById("webgazerFaceOverlay") as HTMLCanvasElement | null;
      const videoContainer = document.getElementById("webgazerVideoContainer");

      let faceDetected = false;
      let faceCentered = false;
      let faceCorrectSize = false;

      if (faceOverlay && videoContainer) {
        const ctx = faceOverlay.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, faceOverlay.width, faceOverlay.height);
          const pixels = imageData.data;
          let nonEmpty = 0;
          for (let i = 3; i < pixels.length; i += 16) {
            if (pixels[i] > 0) nonEmpty++;
          }
          faceDetected = nonEmpty > 50;
        }
      }

      if (!faceDetected) {
        const gazeDot = document.getElementById("webgazerGazeDot");
        faceDetected = gazeDot !== null && gazeDot.style.display !== "none";
      }

      if (faceDetected) {
        faceCentered = true;
        faceCorrectSize = true;
        stableCountRef.current++;
      } else {
        stableCountRef.current = 0;
      }

      const isStable = stableCountRef.current >= 10;

      if (!faceDetected) {
        setStatus({
          isCentered: false,
          isCorrectDistance: false,
          isStable: false,
          message: "No face detected. Ensure good lighting and face the camera.",
        });
        setReadyCountdown(null);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      } else if (!faceCentered) {
        setStatus({
          isCentered: false,
          isCorrectDistance: faceCorrectSize,
          isStable: false,
          message: "Center your face in the camera view",
        });
      } else if (!faceCorrectSize) {
        setStatus({
          isCentered: true,
          isCorrectDistance: false,
          isStable: false,
          message: "Move closer to or further from the screen (arm's length)",
        });
      } else if (!isStable) {
        setStatus({
          isCentered: true,
          isCorrectDistance: true,
          isStable: false,
          message: "Hold still...",
        });
      } else {
        setStatus({
          isCentered: true,
          isCorrectDistance: true,
          isStable: true,
          message: "Position looks good!",
        });

        if (readyCountdown === null && !countdownRef.current) {
          setReadyCountdown(3);
          let count = 3;
          countdownRef.current = setInterval(() => {
            count--;
            if (count <= 0) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              countdownRef.current = null;
              onReady();
            } else {
              setReadyCountdown(count);
            }
          }, 1000);
        }
      }
    }, 200);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [onReady, readyCountdown]);

  const allGood = status.isCentered && status.isCorrectDistance && status.isStable;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          allGood
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-400"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            allGood ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          }`}
        />
        {status.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-48 rounded-2xl overflow-hidden border-2 border-gray-700 bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className={`w-32 h-44 rounded-[50%] border-2 border-dashed transition-colors duration-300 ${
              allGood
                ? "border-green-500"
                : status.isCentered
                ? "border-yellow-500"
                : "border-red-500"
            }`}
          />
        </div>
        <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500 z-10">
          Align face within the oval
        </p>
      </div>

      <div className="space-y-2 w-64">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status.isCentered ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span className="text-xs text-gray-400">Face centered</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status.isCorrectDistance ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span className="text-xs text-gray-400">Good distance</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status.isStable ? "bg-green-500" : "bg-gray-600"
            }`}
          />
          <span className="text-xs text-gray-400">Holding still</span>
        </div>
      </div>

      <p
        className={`text-sm font-medium ${
          allGood ? "text-green-400" : "text-yellow-400"
        }`}
      >
        {readyCountdown !== null
          ? `Starting in ${readyCountdown}...`
          : status.message}
      </p>
    </div>
  );
}
