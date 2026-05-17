// ============================================================
// RemindMeHere — Root Layout
// ============================================================
import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Colors } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useReminderStore } from '../stores/reminderStore';
import { checkPermissions } from '../services/permissions';
import { setupNotificationCategories } from '../services/notifications';
import { syncGeofences } from '../services/geofence';
import { cleanupOldHistory } from '../db/database';

// Import the geofence task so it's registered at module level
import '../tasks/geofenceTask';

import AppLock from '../components/AppLock';

export { ErrorBoundary } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadReminders = useReminderStore((s) => s.loadReminders);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadSettings();
        await loadReminders();
        await checkPermissions();
        await setupNotificationCategories();
        await syncGeofences();
        await cleanupOldHistory();
      } catch (e) {
        console.error('[Bootstrap]', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { reminderId } = response.notification.request.content.data as any;
      const actionId = response.actionIdentifier;

      if (!reminderId) return;

      const store = useReminderStore.getState();

      if (actionId === 'COMPLETE') {
        await store.completeReminder(reminderId);
        await syncGeofences();
      } else if (actionId === 'SNOOZE') {
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + 1);
        await store.snoozeReminder(reminderId, snoozeUntil.toISOString());
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppLock>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="create" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="reminder/[id]" />
          <Stack.Screen name="settings" />
        </Stack>
      </AppLock>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
