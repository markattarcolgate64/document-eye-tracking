"use client";

import { useGazeStore } from "@/stores/gaze-store";

export default function GazeCursor() {
  const currentGaze = useGazeStore((s) => s.currentGaze);

  if (!currentGaze) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] w-8 h-8 rounded-full border-2 border-blue-400 bg-blue-400/20 -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
      style={{
        left: currentGaze.x,
        top: currentGaze.y,
      }}
    />
  );
}
