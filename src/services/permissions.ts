// ============================================================
// RemindMeHere — Permission Service
// ============================================================
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useLocationStore } from '../stores/locationStore';
import { PermissionStatus } from '../types';

function mapStatus(status: Location.PermissionStatus | Notifications.PermissionStatus): PermissionStatus {
  switch (status) {
    case 'granted': return 'granted';
    case 'denied': return 'denied';
    case 'undetermined': return 'undetermined';
    default: return 'denied';
  }
}

/**
 * Check current permission statuses without requesting anything.
 */
export async function checkPermissions(): Promise<void> {
  const store = useLocationStore.getState();

  const fg = await Location.getForegroundPermissionsAsync();
  store.setPermissionState({ foregroundLocation: mapStatus(fg.status) });

  const bg = await Location.getBackgroundPermissionsAsync();
  store.setPermissionState({ backgroundLocation: mapStatus(bg.status) });

  const notif = await Notifications.getPermissionsAsync();
  store.setPermissionState({ notifications: mapStatus(notif.status) });
}

/**
 * Request foreground location permission.
 */
export async function requestForegroundLocation(): Promise<PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  const mapped = mapStatus(status);
  useLocationStore.getState().setPermissionState({ foregroundLocation: mapped });
  return mapped;
}

/**
 * Request background location permission.
 * Must be called AFTER foreground is granted.
 */
export async function requestBackgroundLocation(): Promise<PermissionStatus> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  const mapped = mapStatus(status);
  useLocationStore.getState().setPermissionState({ backgroundLocation: mapped });
  return mapped;
}

/**
 * Request notification permission.
 */
export async function requestNotifications(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('remindmehere-alerts', {
      name: 'Location Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F8CFF',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const mapped = mapStatus(status);
  useLocationStore.getState().setPermissionState({ notifications: mapped });
  return mapped;
}

/**
 * Request all permissions in sequence with clear progression.
 */
export async function requestAllPermissions(): Promise<{
  foreground: PermissionStatus;
  background: PermissionStatus;
  notifications: PermissionStatus;
}> {
  const foreground = await requestForegroundLocation();
  let background: PermissionStatus = 'denied';
  if (foreground === 'granted') {
    background = await requestBackgroundLocation();
  }
  const notifications = await requestNotifications();

  return { foreground, background, notifications };
}

/**
 * Check if all critical permissions are granted.
 */
export function hasRequiredPermissions(): boolean {
  const { permissionState } = useLocationStore.getState();
  return (
    permissionState.foregroundLocation === 'granted' &&
    permissionState.backgroundLocation === 'granted' &&
    permissionState.notifications === 'granted'
  );
}
