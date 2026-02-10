"use client";

interface ReadProgressBarProps {
  coveragePercent: number;
  readSpans: number;
  totalSpans: number;
  elapsedTime: number;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ReadProgressBar({
  coveragePercent,
  readSpans,
  totalSpans,
  elapsedTime,
}: ReadProgressBarProps) {
  const color =
    coveragePercent >= 80
      ? "bg-green-500"
      : coveragePercent >= 40
      ? "bg-yellow-500"
      : "bg-orange-500";

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Reading Progress: {coveragePercent.toFixed(1)}%
        </span>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            {readSpans}/{totalSpans} sections read
          </span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(coveragePercent, 100)}%` }}
        />
      </div>
    </div>
  );
}
