// ============================================================
// RemindMeHere — Location Store (Zustand)
// ============================================================
import { create } from 'zustand';
import { LocationCoords, PermissionState } from '../types';

interface LocationState {
  currentLocation: LocationCoords | null;
  permissionState: PermissionState;
  isTracking: boolean;

  setCurrentLocation: (coords: LocationCoords | null) => void;
  setPermissionState: (state: Partial<PermissionState>) => void;
  setIsTracking: (tracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  permissionState: {
    foregroundLocation: 'undetermined',
    backgroundLocation: 'undetermined',
    notifications: 'undetermined',
  },
  isTracking: false,

  setCurrentLocation: (coords) => set({ currentLocation: coords }),

  setPermissionState: (partial) =>
    set((s) => ({
      permissionState: { ...s.permissionState, ...partial },
    })),

  setIsTracking: (tracking) => set({ isTracking: tracking }),
}));
