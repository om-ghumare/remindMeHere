// ============================================================
// RemindMeHere — App Configuration Constants
// ============================================================

export const APP_NAME = 'RemindMeHere';
export const APP_VERSION = '1.0.0';

// Geofencing
export const DEFAULT_RADIUS_METERS = 150;
export const MIN_RADIUS_METERS = 100;
export const MAX_RADIUS_METERS = 1000;
export const MAX_GEOFENCES_ANDROID = 100;
export const MAX_GEOFENCES_IOS = 20;
export const GEOFENCE_TASK_NAME = 'REMINDMEHERE_GEOFENCE_TASK';

// Notifications
export const NOTIFICATION_CHANNEL_ID = 'remindmehere-alerts';
export const NOTIFICATION_CHANNEL_NAME = 'Location Reminders';

// Database
export const DATABASE_NAME = 'remindmehere.db';
export const DATABASE_VERSION = 1;

// Auto-cleanup
export const COMPLETED_HISTORY_RETENTION_DAYS = 30;

// Snooze default (hours)
export const DEFAULT_SNOOZE_HOURS = 1;

// Map
export const DEFAULT_MAP_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const DEFAULT_MAP_REGION = {
  latitude: 18.5204, // Pune, India (user's likely location)
  longitude: 73.8567,
  ...DEFAULT_MAP_DELTA,
};
