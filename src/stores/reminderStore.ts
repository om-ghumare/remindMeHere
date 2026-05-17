// ============================================================
// RemindMeHere — Reminder Store (Zustand)
// ============================================================
import { create } from 'zustand';
import { Reminder, CreateReminderInput } from '../types';
import * as db from '../db/database';

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;

  // Actions
  loadReminders: () => Promise<void>;
  addReminder: (input: CreateReminderInput) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<CreateReminderInput>) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, untilISO: string) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,

  loadReminders: async () => {
    set({ loading: true, error: null });
    try {
      const reminders = await db.getAllReminders();
      set({ reminders, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addReminder: async (input) => {
    const reminder = await db.createReminder(input);
    set((s) => ({ reminders: [reminder, ...s.reminders] }));
    return reminder;
  },

  updateReminder: async (id, updates) => {
    await db.updateReminder(id, updates);
    const updated = await db.getReminderById(id);
    if (updated) {
      set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? updated : r)),
      }));
    }
  },

  completeReminder: async (id) => {
    await db.completeReminder(id);
    const updated = await db.getReminderById(id);
    if (updated) {
      set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? updated : r)),
      }));
    }
  },

  snoozeReminder: async (id, untilISO) => {
    await db.snoozeReminder(id, untilISO);
    const updated = await db.getReminderById(id);
    if (updated) {
      set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? updated : r)),
      }));
    }
  },

  toggleActive: async (id, isActive) => {
    await db.toggleReminderActive(id, isActive);
    const updated = await db.getReminderById(id);
    if (updated) {
      set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? updated : r)),
      }));
    }
  },

  deleteReminder: async (id) => {
    await db.deleteReminder(id);
    set((s) => ({
      reminders: s.reminders.filter((r) => r.id !== id),
    }));
  },
}));
