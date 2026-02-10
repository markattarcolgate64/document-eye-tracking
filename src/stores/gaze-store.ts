import { create } from "zustand";
import type { GazePoint, Fixation } from "@/types";

interface GazeStore {
  currentGaze: GazePoint | null;
  currentFixation: Fixation | null;
  isTracking: boolean;
  setGaze: (point: GazePoint) => void;
  setFixation: (fixation: Fixation | null) => void;
  setTracking: (tracking: boolean) => void;
  reset: () => void;
}

export const useGazeStore = create<GazeStore>((set) => ({
  currentGaze: null,
  currentFixation: null,
  isTracking: false,

  setGaze: (point) => set({ currentGaze: point }),
  setFixation: (fixation) => set({ currentFixation: fixation }),
  setTracking: (tracking) => set({ isTracking: tracking }),
  reset: () =>
    set({
      currentGaze: null,
      currentFixation: null,
      isTracking: false,
    }),
}));
