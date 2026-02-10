import type { GazePoint } from "@/types";
import { GazeFilter } from "./one-euro-filter";
import { OutlierRejector } from "./outlier-rejector";

let gazeListener: ((point: GazePoint) => void) | null = null;
let isRunning = false;
let gazeFilter: GazeFilter | null = null;
let outlierRejector: OutlierRejector | null = null;

function waitForVideoReady(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const video = document.getElementById(
        "webgazerVideoFeed"
      ) as HTMLVideoElement | null;
      if (
        video &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        video.readyState >= 2
      ) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

export async function initGazeEngine(): Promise<void> {
  if (isRunning) return;

  const webgazer = (await import("webgazer")).default;

  gazeFilter = new GazeFilter(30, 1.5, 0.01);
  outlierRejector = new OutlierRejector(20, 3.0);

  webgazer.params.showVideoPreview = true;
  webgazer.params.showFaceOverlay = false;
  webgazer.params.showFaceFeedbackBox = false;

  webgazer.setRegression("ridge");

  await webgazer.begin();
  await waitForVideoReady();

  webgazer.setGazeListener(
    (data: { x: number; y: number } | null) => {
      if (!data) return;
      if (isNaN(data.x) || isNaN(data.y)) return;

      const now = Date.now();
      const raw: GazePoint = { x: data.x, y: data.y, timestamp: now };

      if (outlierRejector && outlierRejector.isOutlier(raw)) {
        return;
      }

      if (gazeFilter) {
        const filtered = gazeFilter.filter(data.x, data.y, now);
        const smoothed: GazePoint = {
          x: filtered.x,
          y: filtered.y,
          timestamp: now,
        };
        if (gazeListener) {
          gazeListener(smoothed);
        }
      }
    }
  );

  isRunning = true;
}

export function onGaze(listener: (point: GazePoint) => void) {
  gazeListener = listener;
}

export function removeGazeListener() {
  gazeListener = null;
}

export async function stopGazeEngine(): Promise<void> {
  if (!isRunning) return;
  const webgazer = (await import("webgazer")).default;
  webgazer.end();
  isRunning = false;
  gazeListener = null;
  gazeFilter?.reset();
  outlierRejector?.reset();
}

export async function pauseGazeEngine(): Promise<void> {
  const webgazer = (await import("webgazer")).default;
  webgazer.pause();
}

export async function resumeGazeEngine(): Promise<void> {
  const webgazer = (await import("webgazer")).default;
  webgazer.resume();
}

export async function showVideo(show: boolean): Promise<void> {
  const webgazer = (await import("webgazer")).default;
  webgazer.showVideoPreview(show);
}

export async function showPredictionPoints(show: boolean): Promise<void> {
  const webgazer = (await import("webgazer")).default;
  webgazer.showPredictionPoints(show);
}

export async function clearCalibrationData(): Promise<void> {
  const webgazer = (await import("webgazer")).default;
  webgazer.clearData();
  gazeFilter?.reset();
  outlierRejector?.reset();
}

export function getIsRunning(): boolean {
  return isRunning;
}
