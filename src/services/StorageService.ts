/**
 * StorageService provides mechanisms to persist and retrieve screening sessions.
 * Now refactored to store GCS metadata in localStorage instead of binary blobs in IndexedDB.
 */

const STORAGE_KEY = 'NAIC_SCREENING_SESSION';

/**
 * Type-safe interface for a screening result
 */
export interface ScreeningResult {
  prediction: number;
  probabilities: number[];
}

/**
 * Type-safe interface for a persisted screening item
 */
export interface PersistedScreeningItem {
  key: string;      // GCS bucket path
  url: string;      // Signed URL
  fileName: string;
  result: ScreeningResult | null;
  status: 'idle' | 'analyzing' | 'done' | 'error';
}

class StorageService {
  /**
   * Saves the current session items to localStorage.
   * Only stores metadata, as images are on GCS.
   */
  saveSession(items: PersistedScreeningItem[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }

  /**
   * Loads the session from localStorage.
   */
  loadSession(): PersistedScreeningItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      
      return JSON.parse(saved) as PersistedScreeningItem[];
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      return [];
    }
  }

  /**
   * Clears the current session from localStorage.
   */
  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const storageService = typeof window !== 'undefined' ? new StorageService() : null;
