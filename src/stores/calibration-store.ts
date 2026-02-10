import { create } from "zustand";
import type { CalibrationState, CalibrationQuality } from "@/types";

interface CalibrationStore extends CalibrationState {
  setCalibrated: (quality: CalibrationQuality, averageError: number) => void;
  reset: () => void;
}

export const useCalibrationStore = create<CalibrationStore>((set) => ({
  isCalibrated: false,
  quality: null,
  averageError: null,
  timestamp: null,

  setCalibrated: (quality, averageError) =>
    set({
      isCalibrated: true,
      quality,
      averageError,
      timestamp: Date.now(),
    }),

  reset: () =>
    set({
      isCalibrated: false,
      quality: null,
      averageError: null,
      timestamp: null,
    }),
}));
