// ============================================================
// RemindMeHere — Geofence Manager
// ============================================================
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { GEOFENCE_TASK_NAME, MAX_GEOFENCES_ANDROID, MAX_GEOFENCES_IOS } from '../constants/config';
import { Reminder } from '../types';
import { getActiveReminders } from '../db/database';
import { getDistanceMeters } from '../utils/distance';
import { useLocationStore } from '../stores/locationStore';

/**
 * Get the maximum number of geofences the current platform supports.
 */
function getMaxGeofences(): number {
  return Platform.OS === 'ios' ? MAX_GEOFENCES_IOS : MAX_GEOFENCES_ANDROID;
}

/**
 * Register geofences for active reminders.
 * If there are more reminders than the OS limit, prioritize by proximity.
 */
export async function syncGeofences(): Promise<void> {
  const reminders = await getActiveReminders();

  if (reminders.length === 0) {
    await stopGeofencing();
    return;
  }

  const maxFences = getMaxGeofences();
  let selectedReminders = reminders;

  // If we exceed OS limits, prioritize by proximity to current location
  if (reminders.length > maxFences) {
    const currentLocation = useLocationStore.getState().currentLocation;
    if (currentLocation) {
      selectedReminders = reminders
        .map((r) => ({
          ...r,
          distance: getDistanceMeters(
            currentLocation.latitude,
            currentLocation.longitude,
            r.latitude,
            r.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxFences);
    } else {
      // No location available, just take the most recent ones
      selectedReminders = reminders.slice(0, maxFences);
    }
  }

  const regions: Location.LocationRegion[] = selectedReminders.map((r) => ({
    identifier: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    radius: r.radiusMeters,
    notifyOnEnter: r.triggerOn === 'enter' || r.triggerOn === 'both',
    notifyOnExit: r.triggerOn === 'exit' || r.triggerOn === 'both',
  }));

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    useLocationStore.getState().setIsTracking(true);
  } catch (error) {
    console.error('[Geofence] Failed to start geofencing:', error);
  }
}

/**
 * Stop all geofencing.
 */
export async function stopGeofencing(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  }
  useLocationStore.getState().setIsTracking(false);
}

/**
 * Check if geofencing is currently active.
 */
export async function isGeofencingActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
}
