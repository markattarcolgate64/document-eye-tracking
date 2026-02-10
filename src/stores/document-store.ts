import { create } from "zustand";
import type { DocumentMeta, GazeSession, VerificationResult } from "@/types";

interface DocumentStore {
  document: DocumentMeta | null;
  session: GazeSession | null;
  verification: VerificationResult | null;
  setDocument: (doc: DocumentMeta) => void;
  startSession: (doc: DocumentMeta) => void;
  updateSession: (partial: Partial<GazeSession>) => void;
  setVerification: (result: VerificationResult) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  document: null,
  session: null,
  verification: null,

  setDocument: (doc) => set({ document: doc }),

  startSession: (doc) =>
    set({
      session: {
        documentId: doc.id,
        documentName: doc.name,
        startTime: Date.now(),
        endTime: null,
        fixations: [],
        readMap: {},
        totalSpans: 0,
        readSpans: 0,
      },
    }),

  updateSession: (partial) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...partial } : null,
    })),

  setVerification: (result) => set({ verification: result }),

  reset: () => set({ document: null, session: null, verification: null }),
}));
