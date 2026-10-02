import { MatrixRawData } from '../scraper/uff-scraper';
import { ParsedTranscript } from '../parser/transcript-parser';
import { StudentProgressSummary } from '../analytics/matrix-analyzer';

const STORAGE_KEY = 'uff_matriz_historico_state_v2';
const LEGACY_STORAGE_KEY_V1 = 'uff_matriz_historico_state_v1';

export interface StoredAppState {
  rawMatrixText?: string;
  rawTranscriptText?: string;
  matrixFileName?: string;
  transcriptFileName?: string;
  matrixData?: MatrixRawData;
  transcriptData?: ParsedTranscript;
  analysisResult?: StudentProgressSummary;
  customEquivalences?: Record<string, string>;
  manualStatusMap?: Record<string, 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'>;
  updatedAt?: string;
}

export function saveAppStateToStorage(state: StoredAppState): void {
  if (typeof window === 'undefined') return;
  try {
    const dataToSave: StoredAppState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function loadAppStateFromStorage(): StoredAppState | null {
  if (typeof window === 'undefined') return null;
  try {
    // Clean legacy v1 storage if present
    if (window.localStorage.getItem(LEGACY_STORAGE_KEY_V1)) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAppState;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return null;
  }
}

export function clearAppStateFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch (err) {
    console.error('Failed to clear state from localStorage:', err);
  }
}
