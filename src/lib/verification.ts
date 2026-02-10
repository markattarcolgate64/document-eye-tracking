import type { VerificationResult, RegionReadData } from "@/types";

interface VerificationInput {
  readMap: Record<string, RegionReadData>;
  totalSpans: number;
  totalReadTime: number;
  pagesRead: number;
  totalPages: number;
}

export function computeVerification(
  input: VerificationInput
): VerificationResult {
  const { readMap, totalSpans, totalReadTime, pagesRead, totalPages } = input;

  let readCount = 0;
  let totalDwell = 0;
  let totalFixations = 0;

  Object.values(readMap).forEach((region) => {
    if (region.isRead) readCount++;
    totalDwell += region.totalDwellTime;
    totalFixations += region.fixationCount;
  });

  const coveragePercent =
    totalSpans === 0 ? 0 : (readCount / totalSpans) * 100;
  const averageFixationDuration =
    totalFixations === 0 ? 0 : totalDwell / totalFixations;

  let verdict: VerificationResult["verdict"];
  if (coveragePercent >= 80 && averageFixationDuration >= 100) {
    verdict = "verified";
  } else if (coveragePercent >= 40) {
    verdict = "partial";
  } else if (coveragePercent > 5) {
    verdict = "skimmed";
  } else {
    verdict = "insufficient";
  }

  return {
    coveragePercent,
    averageFixationDuration,
    totalReadTime,
    pagesRead,
    totalPages,
    verdict,
    readMap,
    timestamp: Date.now(),
  };
}

export function getVerdictLabel(
  verdict: VerificationResult["verdict"]
): string {
  switch (verdict) {
    case "verified":
      return "Verified Read";
    case "partial":
      return "Partial Read";
    case "skimmed":
      return "Skimmed";
    case "insufficient":
      return "Insufficient Data";
  }
}

export function getVerdictColor(
  verdict: VerificationResult["verdict"]
): string {
  switch (verdict) {
    case "verified":
      return "text-green-600";
    case "partial":
      return "text-yellow-600";
    case "skimmed":
      return "text-orange-600";
    case "insufficient":
      return "text-red-600";
  }
}
