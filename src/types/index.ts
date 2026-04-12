import { Timestamp } from "firebase/firestore";

export interface ScreeningResult {
  prediction: string | number;
  probabilities: number[];
  heatmapUrl?: string | null;
}

export interface Scan {
  id: string;
  ownerId: string;
  fileName: string;
  url: string;
  status: "idle" | "analyzing" | "processing" | "completed" | "error" | "done";
  result: ScreeningResult | null;
  storagePath?: string;
  createdAt: Timestamp | { toDate: () => Date };
}

export interface AuthError extends Error {
  code?: string;
}
