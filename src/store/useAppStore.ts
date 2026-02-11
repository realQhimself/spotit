/**
 * Global application state managed with Zustand.
 */
import { create } from 'zustand';

interface AppState {
  isAuthenticated: boolean;
  currentRoomId: string | null;
  isOnline: boolean;
}

interface AppActions {
  setAuthenticated: (value: boolean) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setOnline: (value: boolean) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  // ── State ───────────────────────────────────────────────────────────
  isAuthenticated: false,
  currentRoomId: null,
  isOnline: true,

  // ── Actions ─────────────────────────────────────────────────────────
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  setOnline: (value) => set({ isOnline: value }),
}));
