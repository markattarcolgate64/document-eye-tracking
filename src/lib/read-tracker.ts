import type { Fixation, RegionReadData, ReadStatus } from "@/types";

const DEFAULT_READ_THRESHOLD = 250; // ms dwell time to consider "read"

export class ReadTracker {
  private readMap: Map<string, RegionReadData> = new Map();
  private readThreshold: number;

  constructor(readThreshold: number = DEFAULT_READ_THRESHOLD) {
    this.readThreshold = readThreshold;
  }

  recordFixation(fixation: Fixation) {
    if (!fixation.targetSpanId) return;

    const id = fixation.targetSpanId;
    const existing = this.readMap.get(id);

    if (existing) {
      existing.totalDwellTime += fixation.duration;
      existing.fixationCount += 1;
      existing.lastFixationTime = fixation.startTime + fixation.duration;
      existing.isRead = existing.totalDwellTime >= this.readThreshold;
    } else {
      this.readMap.set(id, {
        totalDwellTime: fixation.duration,
        fixationCount: 1,
        firstFixationTime: fixation.startTime,
        lastFixationTime: fixation.startTime + fixation.duration,
        isRead: fixation.duration >= this.readThreshold,
      });
    }
  }

  getStatus(spanId: string): ReadStatus {
    const data = this.readMap.get(spanId);
    if (!data) return "unread";
    if (data.isRead) return "read";
    if (data.totalDwellTime > 0) return "partial";
    return "unread";
  }

  getReadMap(): Record<string, RegionReadData> {
    return Object.fromEntries(this.readMap);
  }

  getReadCount(): number {
    let count = 0;
    this.readMap.forEach((v) => {
      if (v.isRead) count++;
    });
    return count;
  }

  getCoveragePercent(totalSpans: number): number {
    if (totalSpans === 0) return 0;
    return (this.getReadCount() / totalSpans) * 100;
  }

  getAverageFixationDuration(): number {
    let total = 0;
    let count = 0;
    this.readMap.forEach((v) => {
      total += v.totalDwellTime;
      count += v.fixationCount;
    });
    return count === 0 ? 0 : total / count;
  }

  reset() {
    this.readMap.clear();
  }
}
