import type { GazePoint } from "@/types";

const DRIFT_WINDOW_MS = 10000;
const DRIFT_CHECK_INTERVAL_MS = 5000;
const OFF_SCREEN_THRESHOLD = 0.4; // 40% of points off-screen = drift warning
const NO_DATA_THRESHOLD_MS = 3000;

export type DriftStatus = "ok" | "warning" | "lost";

export class DriftDetector {
  private recentPoints: GazePoint[] = [];
  private lastPointTime: number = Date.now();
  private listener: ((status: DriftStatus, message: string) => void) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(listener: (status: DriftStatus, message: string) => void) {
    this.listener = listener;
    this.lastPointTime = Date.now();

    this.intervalId = setInterval(() => {
      this.check();
    }, DRIFT_CHECK_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listener = null;
    this.recentPoints = [];
  }

  addPoint(point: GazePoint) {
    this.lastPointTime = point.timestamp;
    this.recentPoints.push(point);

    const cutoff = Date.now() - DRIFT_WINDOW_MS;
    this.recentPoints = this.recentPoints.filter((p) => p.timestamp > cutoff);
  }

  private check() {
    if (!this.listener) return;

    const now = Date.now();

    if (now - this.lastPointTime > NO_DATA_THRESHOLD_MS) {
      this.listener(
        "lost",
        "Face not detected. Please reposition in front of the camera."
      );
      return;
    }

    if (this.recentPoints.length < 10) {
      return;
    }

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const margin = 50;

    let offScreenCount = 0;
    for (const p of this.recentPoints) {
      if (
        p.x < -margin ||
        p.x > screenW + margin ||
        p.y < -margin ||
        p.y > screenH + margin
      ) {
        offScreenCount++;
      }
    }

    const offScreenRatio = offScreenCount / this.recentPoints.length;

    if (offScreenRatio > OFF_SCREEN_THRESHOLD) {
      this.listener(
        "warning",
        "Eye tracking may have drifted. Consider re-calibrating."
      );
    } else {
      this.listener("ok", "");
    }
  }
}
