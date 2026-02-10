import type { GazePoint } from "@/types";

const DEFAULT_WINDOW = 20;
const DEFAULT_THRESHOLD = 3.0;

export class OutlierRejector {
  private buffer: GazePoint[] = [];
  private windowSize: number;
  private threshold: number;

  constructor(windowSize = DEFAULT_WINDOW, threshold = DEFAULT_THRESHOLD) {
    this.windowSize = windowSize;
    this.threshold = threshold;
  }

  isOutlier(point: GazePoint): boolean {
    if (this.buffer.length < 5) {
      this.buffer.push(point);
      return false;
    }

    const meanX = this.buffer.reduce((s, p) => s + p.x, 0) / this.buffer.length;
    const meanY = this.buffer.reduce((s, p) => s + p.y, 0) / this.buffer.length;

    const stdX = Math.sqrt(
      this.buffer.reduce((s, p) => s + (p.x - meanX) ** 2, 0) / this.buffer.length
    );
    const stdY = Math.sqrt(
      this.buffer.reduce((s, p) => s + (p.y - meanY) ** 2, 0) / this.buffer.length
    );

    const safeStdX = Math.max(stdX, 10);
    const safeStdY = Math.max(stdY, 10);

    const zX = Math.abs(point.x - meanX) / safeStdX;
    const zY = Math.abs(point.y - meanY) / safeStdY;

    const isOut = zX > this.threshold || zY > this.threshold;

    if (!isOut) {
      this.buffer.push(point);
      if (this.buffer.length > this.windowSize) {
        this.buffer.shift();
      }
    }

    return isOut;
  }

  reset() {
    this.buffer = [];
  }
}
