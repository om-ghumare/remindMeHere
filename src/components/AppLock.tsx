import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';

export default function AppLock({ children }: { children: React.ReactNode }) {
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const [unlocked, setUnlocked] = useState(!appLockEnabled);

  useEffect(() => {
    if (appLockEnabled) {
      authenticate();
    } else {
      setUnlocked(true);
    }
  }, [appLockEnabled]);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback if no biometrics setup
        setUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock RemindMeHere',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setUnlocked(true);
      }
    } catch (e) {
      console.warn('Authentication error:', e);
    }
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.title}>App Locked</Text>
      <Text style={styles.subtitle}>Please authenticate to view your reminders</Text>

      <TouchableOpacity style={styles.button} onPress={authenticate}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadows.glow,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
