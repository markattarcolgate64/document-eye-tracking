"use client";

interface CalibrationPointProps {
  x: number;
  y: number;
  clickCount: number;
  requiredClicks: number;
  isActive: boolean;
  onClick: () => void;
}

export default function CalibrationPoint({
  x,
  y,
  clickCount,
  requiredClicks,
  isActive,
  onClick,
}: CalibrationPointProps) {
  const progress = clickCount / requiredClicks;

  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
      style={{ left: `${x}%`, top: `${y}%` }}
      disabled={!isActive}
    >
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${
            isActive
              ? "border-blue-500 bg-blue-500/20 animate-pulse cursor-pointer"
              : clickCount >= requiredClicks
              ? "border-green-500 bg-green-500/30"
              : "border-gray-400 bg-gray-400/10"
          }`}
        />
        <div
          className="absolute inset-0 rounded-full bg-blue-500 transition-all duration-200"
          style={{
            transform: `scale(${progress})`,
            opacity: progress * 0.5,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-3 h-3 rounded-full ${
              isActive ? "bg-blue-500" : clickCount >= requiredClicks ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>
      </div>
    </button>
  );
}
