import type { GazePoint } from "@/types";

const SMOOTHING_WINDOW = 5;

let gazeBuffer: GazePoint[] = [];
let gazeListener: ((point: GazePoint) => void) | null = null;
let isRunning = false;

function smoothGaze(buffer: GazePoint[]): GazePoint {
  const len = buffer.length;
  if (len === 0) return { x: 0, y: 0, timestamp: Date.now() };
  const sumX = buffer.reduce((s, p) => s + p.x, 0);
  const sumY = buffer.reduce((s, p) => s + p.y, 0);
  return {
    x: sumX / len,
    y: sumY / len,
    timestamp: buffer[len - 1].timestamp,
  };
}

export async function initGazeEngine(): Promise<void> {
  const webgazer = (await import("webgazer")).default;

  webgazer.params.showVideoPreview = true;
  webgazer.params.showFaceOverlay = false;
  webgazer.params.showFaceFeedbackBox = false;

  webgazer.setRegression("ridge");

  webgazer.setGazeListener(
    (data: { x: number; y: number } | null) => {
      if (!data) return;

      const raw: GazePoint = {
        x: data.x,
        y: data.y,
        timestamp: Date.now(),
      };

      gazeBuffer.push(raw);
      if (gazeBuffer.length > SMOOTHING_WINDOW) {
        gazeBuffer = gazeBuffer.slice(-SMOOTHING_WINDOW);
      }

      const smoothed = smoothGaze(gazeBuffer);

      if (gazeListener) {
        gazeListener(smoothed);
      }
    }
  );

  await webgazer.begin();
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
  gazeBuffer = [];
  gazeListener = null;
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

export function getIsRunning(): boolean {
  return isRunning;
}
