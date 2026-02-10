"use client";

import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/stores/document-store";
import {
  computeVerification,
  getVerdictLabel,
  getVerdictColor,
} from "@/lib/verification";
import type { VerificationResult } from "@/types";

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function computeFromSession(session: NonNullable<ReturnType<typeof useDocumentStore.getState>["session"]>): VerificationResult {
  const endTime = session.endTime ?? Date.now();
  const totalReadTime = endTime - session.startTime;

  const pagesWithReads = new Set<number>();
  Object.keys(session.readMap).forEach((spanId) => {
    const match = spanId.match(/^page-(\d+)-/);
    if (match && session.readMap[spanId].isRead) {
      pagesWithReads.add(parseInt(match[1]));
    }
  });

  return computeVerification({
    readMap: session.readMap,
    totalSpans: session.totalSpans,
    totalReadTime,
    pagesRead: pagesWithReads.size,
    totalPages: session.totalSpans > 0 ? Math.ceil(session.totalSpans / 50) : 0,
  });
}

export default function VerificationReport() {
  const router = useRouter();
  const { session, verification } = useDocumentStore();

  const result = verification ?? (session ? computeFromSession(session) : null);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            No reading session data available.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Upload a Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Reading Verification Report
        </h1>

        <div className="bg-gray-900 rounded-2xl p-8 mb-6 text-center border border-gray-800">
          <p className="text-gray-400 text-sm mb-2">Verdict</p>
          <p className={`text-4xl font-bold ${getVerdictColor(result.verdict)}`}>
            {getVerdictLabel(result.verdict)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Coverage</p>
            <p className="text-2xl font-bold text-white">
              {result.coveragePercent.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Total Time</p>
            <p className="text-2xl font-bold text-white">
              {formatTime(result.totalReadTime)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Avg Fixation</p>
            <p className="text-2xl font-bold text-white">
              {result.averageFixationDuration.toFixed(0)}ms
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Pages Read</p>
            <p className="text-2xl font-bold text-white">
              {result.pagesRead}/{result.totalPages}
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <p className="text-gray-400 text-sm mb-3">Coverage Breakdown</p>
          <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all ${
                result.coveragePercent >= 80
                  ? "bg-green-500"
                  : result.coveragePercent >= 40
                  ? "bg-yellow-500"
                  : "bg-orange-500"
              }`}
              style={{
                width: `${Math.min(result.coveragePercent, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>Skimmed (40%)</span>
            <span>Verified (80%)</span>
            <span>100%</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <p className="text-gray-400 text-sm mb-4">Reading Quality Indicators</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Fixation Duration</span>
              <span
                className={`text-sm font-medium ${
                  result.averageFixationDuration >= 150 &&
                  result.averageFixationDuration <= 400
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {result.averageFixationDuration >= 150 &&
                result.averageFixationDuration <= 400
                  ? "Normal reading pace"
                  : result.averageFixationDuration < 150
                  ? "Very fast (skimming)"
                  : "Very slow (distracted)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Document Coverage</span>
              <span
                className={`text-sm font-medium ${
                  result.coveragePercent >= 80
                    ? "text-green-400"
                    : result.coveragePercent >= 40
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {result.coveragePercent >= 80
                  ? "Thorough"
                  : result.coveragePercent >= 40
                  ? "Partial"
                  : "Incomplete"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            New Document
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(result, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = window.document.createElement("a");
              a.href = url;
              a.download = `reading-report-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Export Report (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}
