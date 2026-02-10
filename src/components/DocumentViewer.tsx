"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useDocumentStore } from "@/stores/document-store";
import { useGazeStore } from "@/stores/gaze-store";
import { useCalibrationStore } from "@/stores/calibration-store";
import {
  initGazeEngine,
  onGaze,
  removeGazeListener,
  showPredictionPoints,
  showVideo,
  getIsRunning,
} from "@/lib/gaze-engine";
import { FixationDetector } from "@/lib/fixation-detector";
import { ReadTracker } from "@/lib/read-tracker";
import { DriftDetector } from "@/lib/drift-detector";
import type { DriftStatus } from "@/lib/drift-detector";
import {
  registerTextSpans,
  refreshSpanRects,
  getTotalSpanCount,
} from "@/lib/text-mapper";
import GazeCursor from "./GazeCursor";
import ReadProgressBar from "./ReadProgressBar";
import type { GazePoint, Fixation } from "@/types";

const READ_THRESHOLD_MS = 250;

export default function DocumentViewer() {
  const { document: doc, updateSession } = useDocumentStore();
  const { setGaze, setTracking } = useGazeStore();
  const { averageError } = useCalibrationStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const fixationDetectorRef = useRef<FixationDetector | null>(null);
  const readTrackerRef = useRef<ReadTracker | null>(null);
  const driftDetectorRef = useRef<DriftDetector | null>(null);
  const [coveragePercent, setCoveragePercent] = useState(0);
  const [readSpans, setReadSpans] = useState(0);
  const [totalSpans, setTotalSpans] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showGazeCursor, setShowGazeCursor] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [driftWarning, setDriftWarning] = useState<string | null>(null);
  const startTimeRef = useRef(0);
  const registeredPagesRef = useRef<Set<number>>(new Set());

  // Initialize refs in effect to avoid impure render
  useEffect(() => {
    startTimeRef.current = Date.now();
    if (!readTrackerRef.current) {
      readTrackerRef.current = new ReadTracker(READ_THRESHOLD_MS);
    }
    if (!driftDetectorRef.current) {
      driftDetectorRef.current = new DriftDetector();
    }
  }, []);

  const applyHighlight = useCallback((spanId: string, status: string) => {
    const el = window.document.querySelector(
      `[data-span-id="${spanId}"]`
    ) as HTMLElement | null;
    if (!el) return;

    el.classList.remove("gaze-fixated", "gaze-partial", "gaze-read");

    switch (status) {
      case "fixated":
        el.classList.add("gaze-fixated");
        break;
      case "partial":
        el.classList.add("gaze-partial");
        break;
      case "read":
        el.classList.add("gaze-read");
        break;
    }
  }, []);

  const handleFixation = useCallback(
    (fixation: Fixation) => {
      const tracker = readTrackerRef.current;
      if (!tracker) return;

      tracker.recordFixation(fixation);

      if (fixation.targetSpanId) {
        const status = tracker.getStatus(fixation.targetSpanId);
        applyHighlight(fixation.targetSpanId, status);
      }

      const total = getTotalSpanCount();
      const read = tracker.getReadCount();
      const coverage = tracker.getCoveragePercent(total);

      setReadSpans(read);
      setTotalSpans(total);
      setCoveragePercent(coverage);

      updateSession({
        readMap: tracker.getReadMap(),
        totalSpans: total,
        readSpans: read,
      });
    },
    [applyHighlight, updateSession]
  );

  // Scan for new pages and register their text spans
  const scanAndRegisterPages = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const pages = container.querySelectorAll(".rpv-core__page-layer");
    pages.forEach((page, idx) => {
      if (!registeredPagesRef.current.has(idx)) {
        const textLayer = page.querySelector(".rpv-core__text-layer");
        if (textLayer && textLayer.children.length > 0) {
          registerTextSpans(page as HTMLElement, idx);
          registeredPagesRef.current.add(idx);
        }
      }
    });

    setTotalSpans(getTotalSpanCount());

    // Also re-apply highlights for already-read spans that may have re-rendered
    if (readTrackerRef.current) {
      const readMap = readTrackerRef.current.getReadMap();
      Object.keys(readMap).forEach((spanId) => {
        const data = readMap[spanId];
        if (data.isRead) {
          applyHighlight(spanId, "read");
        } else if (data.totalDwellTime > 0) {
          applyHighlight(spanId, "partial");
        }
      });
    }
  }, [applyHighlight]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Gaze tracking setup
  useEffect(() => {
    if (!isReady) return;

    const adaptiveRadius = averageError
      ? FixationDetector.radiusFromCalibrationError(averageError)
      : 50;

    fixationDetectorRef.current = new FixationDetector({
      radius: adaptiveRadius,
      onFixation: handleFixation,
    });

    const drift = driftDetectorRef.current;
    if (drift) {
      drift.start((driftStatus: DriftStatus, message: string) => {
        if (driftStatus === "ok") {
          setDriftWarning(null);
        } else {
          setDriftWarning(message);
        }
      });
    }

    const startTracking = async () => {
      if (!getIsRunning()) {
        await initGazeEngine();
      }
      await showPredictionPoints(false);
      await showVideo(false);

      onGaze((point: GazePoint) => {
        setGaze(point);
        fixationDetectorRef.current?.addPoint(point);
        drift?.addPoint(point);
      });

      setTracking(true);
    };

    startTracking();

    return () => {
      removeGazeListener();
      setTracking(false);
      fixationDetectorRef.current?.flush();
      drift?.stop();
    };
  }, [isReady, handleFixation, setGaze, setTracking, averageError]);

  // Scroll handler: refresh rects + scan for new pages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        refreshSpanRects(container);
        scanAndRegisterPages();
      }, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scanAndRegisterPages]);

  // Visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (window.document.hidden) {
        removeGazeListener();
      } else if (isReady) {
        onGaze((point: GazePoint) => {
          setGaze(point);
          fixationDetectorRef.current?.addPoint(point);
          driftDetectorRef.current?.addPoint(point);
        });
      }
    };

    window.document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      window.document.removeEventListener("visibilitychange", handleVisibility);
  }, [isReady, setGaze]);

  // On document load, start polling for text layers to appear
  const handleDocumentLoad = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const pollForTextLayer = () => {
      attempts++;
      scanAndRegisterPages();

      if (getTotalSpanCount() > 0) {
        setIsReady(true);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(pollForTextLayer, 500);
      } else {
        // Give up waiting and mark ready anyway
        setIsReady(true);
      }
    };

    setTimeout(pollForTextLayer, 500);
  }, [scanAndRegisterPages]);

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">No document loaded. Please upload a PDF.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <ReadProgressBar
        coveragePercent={coveragePercent}
        readSpans={readSpans}
        totalSpans={totalSpans}
        elapsedTime={elapsedTime}
      />

      {driftWarning && (
        <div className="bg-yellow-900/50 border-b border-yellow-700 px-6 py-2 flex items-center justify-between">
          <p className="text-yellow-400 text-xs">{driftWarning}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDriftWarning(null)}
              className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
            >
              Dismiss
            </button>
            <a href="/calibrate" className="text-xs px-2 py-1 bg-yellow-700 text-white rounded">
              Re-calibrate
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-gray-800">
        <h2 className="text-white text-sm font-medium truncate max-w-md">{doc.name}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGazeCursor(!showGazeCursor)}
            className={`text-xs px-3 py-1.5 rounded ${
              showGazeCursor ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            {showGazeCursor ? "Hide Cursor" : "Show Cursor"}
          </button>
          <a href="/report" className="text-xs px-3 py-1.5 rounded bg-green-700 text-white hover:bg-green-600">
            Finish & Report
          </a>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ height: "calc(100vh - 120px)" }}
      >
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer fileUrl={doc.fileUrl} onDocumentLoad={handleDocumentLoad} />
        </Worker>
      </div>

      {showGazeCursor && <GazeCursor />}
    </div>
  );
}
