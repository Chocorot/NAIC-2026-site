import { Timestamp } from "firebase/firestore";

export interface ScreeningResult {
  prediction: string | number;
  probabilities: number[];
  heatmapUrl?: string | null;
}

export type ScanStatus = "idle" | "pending" | "processing" | "analyzing" | "completed" | "error" | "done";

export interface Scan {
  id: string;
  ownerId: string;
  fileName: string;
  url: string;
  status: ScanStatus;

  result: ScreeningResult | null;
  storagePath?: string;
  createdAt: Timestamp | { toDate: () => Date };
}

export interface AuthError extends Error {
  code?: string;
}
