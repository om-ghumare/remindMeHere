// ============================================================
// RemindMeHere — Core Type Definitions
// ============================================================

export type TriggerType = 'enter' | 'exit' | 'both';
export type ReminderPriority = 'low' | 'normal' | 'high';
export type TriggerAction = 'dismissed' | 'completed' | 'snoozed';

export type CategoryId =
  | 'shopping'
  | 'work'
  | 'personal'
  | 'health'
  | 'finance'
  | 'social'
  | 'general';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  icon: string; // Ionicons name
}

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  locationAddress: string | null;
  radiusMeters: number;
  triggerOn: TriggerType;
  isRecurring: boolean;
  isActive: boolean;
  category: CategoryId;
  priority: ReminderPriority;
  createdAt: string; // ISO 8601
  updatedAt: string;
  completedAt: string | null;
  snoozedUntil: string | null;
  triggerCount: number;
  lastTriggered: string | null;
}

export interface TriggerHistoryEntry {
  id: string;
  reminderId: string;
  triggeredAt: string;
  actionTaken: TriggerAction | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  icon: string;
  createdAt: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  locationAddress?: string;
  radiusMeters?: number;
  triggerOn?: TriggerType;
  isRecurring?: boolean;
  category?: CategoryId;
  priority?: ReminderPriority;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

export interface PermissionState {
  foregroundLocation: PermissionStatus;
  backgroundLocation: PermissionStatus;
  notifications: PermissionStatus;
}
