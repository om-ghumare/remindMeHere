// ============================================================
// RemindMeHere — Background Geofence Task
// This MUST be defined at the top-level module scope.
// ============================================================
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { GEOFENCE_TASK_NAME } from '../constants/config';
import { getReminderById, recordTrigger, completeReminder } from '../db/database';
import { sendGeofenceNotification } from '../services/notifications';

/**
 * Background task handler for geofence events.
 * Called by the OS when the user enters/exits a registered geofence.
 */
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[GeofenceTask] Error:', error.message);
    return;
  }

  if (!data) return;

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  const reminderId = region.identifier;
  if (!reminderId) return;

  const reminder = await getReminderById(reminderId);

  if (!reminder || !reminder.isActive || reminder.completedAt) {
    return;
  }

  // Check snooze
  if (reminder.snoozedUntil) {
    const snoozeEnd = new Date(reminder.snoozedUntil);
    if (snoozeEnd > new Date()) {
      return; // Still snoozed
    }
  }

  const type = eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';

  // Only trigger if the event type matches what the user requested
  if (reminder.triggerOn !== 'both' && reminder.triggerOn !== type) {
    return;
  }

  // Record the trigger
  await recordTrigger(reminderId, region.latitude ?? 0, region.longitude ?? 0);

  // Send notification
  await sendGeofenceNotification(reminder, type);

  // Auto-complete if not recurring
  if (!reminder.isRecurring) {
    // Don't auto-complete; let the user mark it done via notification action
    // This way they can snooze if they can't do it right now
  }
});
