// ============================================================
// RemindMeHere — Settings Store (Zustand + MMKV)
// ============================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  hasCompletedOnboarding: boolean;
  defaultRadius: number;
  appLockEnabled: boolean;

  setOnboardingComplete: () => void;
  setDefaultRadius: (radius: number) => void;
  setAppLockEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = '@remindmehere_settings';

export const useSettingsStore = create<SettingsState>((set) => ({
  hasCompletedOnboarding: false,
  defaultRadius: 150,
  appLockEnabled: false,

  setOnboardingComplete: () => {
    set({ hasCompletedOnboarding: true });
    persistSettings({ hasCompletedOnboarding: true });
  },

  setDefaultRadius: (radius) => {
    set({ defaultRadius: radius });
    persistSettings({ defaultRadius: radius });
  },

  setAppLockEnabled: (enabled) => {
    set({ appLockEnabled: enabled });
    persistSettings({ appLockEnabled: enabled });
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
          defaultRadius: parsed.defaultRadius ?? 150,
          appLockEnabled: parsed.appLockEnabled ?? false,
        });
      }
    } catch {
      // First launch, use defaults
    }
  },
}));

async function persistSettings(partial: Record<string, any>) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...partial }));
  } catch {
    // Non-critical
  }
}
