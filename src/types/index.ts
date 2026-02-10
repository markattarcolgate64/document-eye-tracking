export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface Fixation {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  targetSpanId: string | null;
}

export interface RegionReadData {
  totalDwellTime: number;
  fixationCount: number;
  firstFixationTime: number;
  lastFixationTime: number;
  isRead: boolean;
}

export interface GazeSession {
  documentId: string;
  documentName: string;
  startTime: number;
  endTime: number | null;
  fixations: Fixation[];
  readMap: Record<string, RegionReadData>;
  totalSpans: number;
  readSpans: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  clicks: number;
}

export type CalibrationQuality = "excellent" | "good" | "fair" | "poor";

export interface CalibrationState {
  isCalibrated: boolean;
  quality: CalibrationQuality | null;
  averageError: number | null;
  timestamp: number | null;
}

export type ReadStatus = "unread" | "fixated" | "partial" | "read";

export interface VerificationResult {
  coveragePercent: number;
  averageFixationDuration: number;
  totalReadTime: number;
  pagesRead: number;
  totalPages: number;
  verdict: "verified" | "partial" | "skimmed" | "insufficient";
  readMap: Record<string, RegionReadData>;
  timestamp: number;
}

export interface DocumentMeta {
  id: string;
  name: string;
  pageCount: number;
  uploadTime: number;
  fileUrl: string;
}
