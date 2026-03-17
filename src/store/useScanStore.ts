/**
 * Active scan-session state managed with Zustand.
 */
import { create } from 'zustand';
import type { Detection, EnrichmentStatus, ScanType } from '../types/detection';

interface ScanState {
  scanMode: ScanType | null;
  isScanning: boolean;
  detections: Detection[];
  capturedPhotoUri: string | null;
  selectedRoomId: string | null;
  selectedZoneId: string | null;
}

interface ScanActions {
  startScan: (mode: ScanType) => void;
  stopScan: () => void;
  addDetection: (detection: Detection) => void;
  updateDetection: (
    id: string,
    updates: Partial<Detection>,
  ) => void;
  clearDetections: () => void;
  setCapturedPhoto: (uri: string | null) => void;
  setRoom: (roomId: string | null) => void;
  setZone: (zoneId: string | null) => void;
}

const initialState: ScanState = {
  scanMode: null,
  isScanning: false,
  detections: [],
  capturedPhotoUri: null,
  selectedRoomId: null,
  selectedZoneId: null,
};

export const useScanStore = create<ScanState & ScanActions>((set) => ({
  ...initialState,

  // ── Actions ─────────────────────────────────────────────────────────
  startScan: (mode) =>
    set({
      scanMode: mode,
      isScanning: true,
      detections: [],
      capturedPhotoUri: null,
    }),

  stopScan: () =>
    set({
      isScanning: false,
    }),

  addDetection: (detection) =>
    set((state) => ({
      detections: [...state.detections, detection],
    })),

  updateDetection: (id, updates) =>
    set((state) => ({
      detections: state.detections.map((d) =>
        d.id === id ? { ...d, ...updates } : d,
      ),
    })),

  clearDetections: () => set({ detections: [] }),

  setCapturedPhoto: (uri) => set({ capturedPhotoUri: uri }),

  setRoom: (roomId) => set({ selectedRoomId: roomId }),

  setZone: (zoneId) => set({ selectedZoneId: zoneId }),
}));
