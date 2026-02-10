import type { GazePoint, Fixation } from "@/types";

const DEFAULT_FIXATION_RADIUS = 50;
const MIN_FIXATION_DURATION = 100; // ms

interface FixationDetectorConfig {
  radius?: number;
  minDuration?: number;
  onFixation?: (fixation: Fixation) => void;
}

export class FixationDetector {
  private radius: number;
  private minDuration: number;
  private onFixation: ((fixation: Fixation) => void) | null;
  private currentCluster: GazePoint[] = [];

  constructor(config: FixationDetectorConfig = {}) {
    this.radius = config.radius ?? DEFAULT_FIXATION_RADIUS;
    this.minDuration = config.minDuration ?? MIN_FIXATION_DURATION;
    this.onFixation = config.onFixation ?? null;
  }

  setRadius(radius: number) {
    this.radius = Math.max(20, Math.min(radius, 200));
  }

  static radiusFromCalibrationError(avgError: number): number {
    // Scale fixation radius to ~60-70% of calibration error
    // so we're sensitive enough to detect fixations but not so tight
    // that noise causes constant cluster breaks
    const scaled = avgError * 0.65;
    return Math.max(30, Math.min(scaled, 150));
  }

  private centroid(points: GazePoint[]): { x: number; y: number } {
    const n = points.length;
    return {
      x: points.reduce((s, p) => s + p.x, 0) / n,
      y: points.reduce((s, p) => s + p.y, 0) / n,
    };
  }

  private distance(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  addPoint(point: GazePoint): Fixation | null {
    if (this.currentCluster.length === 0) {
      this.currentCluster.push(point);
      return null;
    }

    const center = this.centroid(this.currentCluster);
    const dist = this.distance(center, point);

    if (dist <= this.radius) {
      this.currentCluster.push(point);
      return null;
    }

    const fixation = this.finalizeCluster();
    this.currentCluster = [point];
    return fixation;
  }

  private finalizeCluster(): Fixation | null {
    const cluster = this.currentCluster;
    if (cluster.length < 2) return null;

    const duration =
      cluster[cluster.length - 1].timestamp - cluster[0].timestamp;
    if (duration < this.minDuration) return null;

    const center = this.centroid(cluster);
    const el = document.elementFromPoint(center.x, center.y);

    let spanId: string | null = null;
    if (el) {
      const textSpan = el.closest("[data-span-id]") as HTMLElement | null;
      if (textSpan) {
        spanId = textSpan.getAttribute("data-span-id");
      }
    }

    const fixation: Fixation = {
      x: center.x,
      y: center.y,
      startTime: cluster[0].timestamp,
      duration,
      targetSpanId: spanId,
    };

    if (this.onFixation) {
      this.onFixation(fixation);
    }

    return fixation;
  }

  flush(): Fixation | null {
    const fixation = this.finalizeCluster();
    this.currentCluster = [];
    return fixation;
  }

  reset() {
    this.currentCluster = [];
  }
}
