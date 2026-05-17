// ============================================================
// RemindMeHere — Notification Service
// ============================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Send a local notification when a geofence is triggered.
 */
export async function sendGeofenceNotification(reminder: Reminder, eventType: 'enter' | 'exit'): Promise<string> {
  const actionText = eventType === 'enter' ? "You're near" : "You're leaving";
  const locationText = reminder.locationName || 'a saved location';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `📍 ${reminder.title}`,
      body: `${actionText} ${locationText}!`,
      data: {
        reminderId: reminder.id,
        eventType,
      },
      sound: true,
      ...(Platform.OS === 'android' && {
        channelId: 'remindmehere-alerts',
      }),
      categoryIdentifier: 'REMINDER_ACTIONS',
    },
    trigger: null, // Immediate
  });

  return id;
}

/**
 * Set up notification action categories (Done / Snooze).
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('REMINDER_ACTIONS', [
    {
      identifier: 'COMPLETE',
      buttonTitle: '✅ Done',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: '⏰ Later',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'VIEW',
      buttonTitle: '👀 View',
      options: { opensAppToForeground: true },
    },
  ]);
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
