"use client";

import { useRouter } from "next/navigation";
import { useCalibrationStore } from "@/stores/calibration-store";
import DocumentUploader from "@/components/DocumentUploader";

export default function Home() {
  const router = useRouter();
  const { isCalibrated, quality } = useCalibrationStore();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-500"
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
            <h1 className="text-xl font-bold text-white">Document Eye Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            {isCalibrated ? (
              <span
                className={`text-xs px-3 py-1.5 rounded-full ${
                  quality === "excellent"
                    ? "bg-green-500/20 text-green-400"
                    : quality === "good"
                    ? "bg-blue-500/20 text-blue-400"
                    : quality === "fair"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                Calibrated ({quality})
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-full bg-gray-700 text-gray-400">
                Not Calibrated
              </span>
            )}
            <button
              onClick={() => router.push("/calibrate")}
              className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {isCalibrated ? "Re-calibrate" : "Calibrate"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Verify Document Reading
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload a document, read it naturally, and get a verification report
            showing what you read based on your eye movements.
          </p>
        </div>

        {!isCalibrated && (
          <div className="max-w-lg mx-auto mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-yellow-400 text-sm">
              Please calibrate eye tracking before uploading a document.{" "}
              <button
                onClick={() => router.push("/calibrate")}
                className="underline hover:text-yellow-300"
              >
                Start calibration
              </button>
            </p>
          </div>
        )}

        <DocumentUploader />

        {/* How it works */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-white text-center mb-8">
            How It Works
          </h3>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h4 className="text-white font-medium mb-1">Calibrate</h4>
              <p className="text-gray-500 text-sm">
                13-point eye tracking calibration using your webcam
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <h4 className="text-white font-medium mb-1">Read</h4>
              <p className="text-gray-500 text-sm">
                Upload a PDF and read it naturally while we track your gaze
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <h4 className="text-white font-medium mb-1">Verify</h4>
              <p className="text-gray-500 text-sm">
                Get a detailed report on what you read and coverage stats
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
