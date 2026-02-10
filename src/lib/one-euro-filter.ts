class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null || this.s === null) {
      this.y = value;
      this.s = value;
    } else {
      this.s = alpha * value + (1 - alpha) * this.s;
      this.y = this.s;
    }
    return this.y;
  }

  reset() {
    this.y = null;
    this.s = null;
  }

  lastValue(): number | null {
    return this.y;
  }
}

export class OneEuroFilter {
  private freq: number;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(
    freq: number = 30,
    minCutoff: number = 1.0,
    beta: number = 0.007,
    dCutoff: number = 1.0
  ) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestamp?: number): number {
    if (this.lastTime !== null && timestamp !== undefined) {
      const dt = timestamp - this.lastTime;
      if (dt > 0) {
        this.freq = 1.0 / (dt / 1000);
      }
    }
    this.lastTime = timestamp ?? null;

    const prevX = this.xFilter.lastValue();
    const dx = prevX === null ? 0 : (value - prevX) * this.freq;

    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.filter(value, this.alpha(cutoff));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export class GazeFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(freq = 30, minCutoff = 1.5, beta = 0.01) {
    this.xFilter = new OneEuroFilter(freq, minCutoff, beta);
    this.yFilter = new OneEuroFilter(freq, minCutoff, beta);
  }

  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, timestamp),
      y: this.yFilter.filter(y, timestamp),
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}
