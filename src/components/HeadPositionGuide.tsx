"use client";

import { useEffect, useRef, useState } from "react";

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
    message: "Waiting for camera...",
  });
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);
  const stableCountRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onReadyRef = useRef(onReady);
  const videoSlotRef = useRef<HTMLDivElement>(null);
  const originalParentRef = useRef<HTMLElement | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Detect face by checking if the video feed is active and has image data
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const video = document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null;

      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        stableCountRef.current = 0;
        setStatus({
          faceDetected: false,
          isStable: false,
          message: "Waiting for camera...",
        });
        setReadyCountdown(null);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }

      // Check if video has non-black content (camera is working and face likely present)
      // by sampling a small canvas from the center of the video
      let faceDetected = false;
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const cx = video.videoWidth / 2 - size / 2;
          const cy = video.videoHeight / 2 - size / 2;
          ctx.drawImage(video, cx, cy, size, size, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size);
          const pixels = imageData.data;

          // Check brightness variance -- a face has texture/variation,
          // a covered/black camera does not
          let sum = 0;
          let sumSq = 0;
          const sampleCount = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            sum += brightness;
            sumSq += brightness * brightness;
          }
          const mean = sum / sampleCount;
          const variance = sumSq / sampleCount - mean * mean;

          // If mean brightness > 20 and variance > 100, there's likely a face
          faceDetected = mean > 20 && variance > 100;
        }
      } catch {
        // Canvas security error (shouldn't happen with local webcam)
        faceDetected = false;
      }

      if (!faceDetected) {
        stableCountRef.current = 0;
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

      stableCountRef.current++;
      const isStable = stableCountRef.current >= 6; // ~3 seconds at 500ms intervals

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
        let c = 3;
        countdownRef.current = setInterval(() => {
          c--;
          if (c <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            onReadyRef.current();
          } else {
            setReadyCountdown(c);
          }
        }, 1000);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // Physically move WebGazer video element into our container
  useEffect(() => {
    const tryMove = () => {
      const slot = videoSlotRef.current;
      const wgContainer = document.getElementById("webgazerVideoContainer");
      if (!slot || !wgContainer || movedRef.current) return;

      originalParentRef.current = wgContainer.parentElement;
      slot.appendChild(wgContainer);
      movedRef.current = true;

      wgContainer.style.cssText = `
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        z-index: 1 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        display: block !important;
      `;
    };

    tryMove();
    const retry = setTimeout(tryMove, 300);
    const retry2 = setTimeout(tryMove, 800);

    return () => {
      clearTimeout(retry);
      clearTimeout(retry2);

      const wgContainer = document.getElementById("webgazerVideoContainer");
      if (wgContainer && movedRef.current) {
        const target = originalParentRef.current || document.body;
        target.appendChild(wgContainer);
        wgContainer.style.cssText = "";
        movedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={videoSlotRef}
        className="relative w-72 h-52 rounded-2xl overflow-hidden border-2 border-gray-700 bg-gray-900"
      >
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
