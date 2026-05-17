// ============================================================
// RemindMeHere — Settings Screen
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Share, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, RadiusOptions } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLocationStore } from '../../stores/locationStore';
import { useReminderStore } from '../../stores/reminderStore';
import { exportAllData, importData } from '../../db/database';
import { APP_VERSION } from '../../constants/config';

export default function SettingsScreen() {
  const defaultRadius = useSettingsStore((s) => s.defaultRadius);
  const setDefaultRadius = useSettingsStore((s) => s.setDefaultRadius);
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const setAppLockEnabled = useSettingsStore((s) => s.setAppLockEnabled);
  const permissionState = useLocationStore((s) => s.permissionState);
  const isTracking = useLocationStore((s) => s.isTracking);
  const reminders = useReminderStore((s) => s.reminders);
  const loadReminders = useReminderStore((s) => s.loadReminders);
  const [exporting, setExporting] = useState(false);

  const activeCount = reminders.filter((r) => r.isActive && !r.completedAt).length;
  const completedCount = reminders.filter((r) => r.completedAt).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportAllData();
      const file = new File(Paths.cache, 'remindmehere_backup.json');
      file.create();
      file.write(json);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Reminders' });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    }
    setExporting(false);
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Reminders',
      'This will add reminders from a backup file. Existing reminders will not be overwritten.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File', onPress: async () => {
            try {
              // For now, show guidance since document picker needs separate install
              Alert.alert(
                'Import',
                'Place your backup file in your Downloads folder and share it with RemindMeHere via your file manager.'
              );
            } catch (e: any) {
              Alert.alert('Import Failed', e.message);
            }
          },
        },
      ]
    );
  };

  const PermIcon = ({ granted }: { granted: boolean }) => (
    <View style={[styles.permDot, { backgroundColor: granted ? Colors.success : Colors.danger }]} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{activeCount}</Text>
            <Text style={styles.statLbl}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{completedCount}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.trackingDot, { backgroundColor: isTracking ? Colors.success : Colors.danger }]} />
            <Text style={styles.statLbl}>{isTracking ? 'Tracking' : 'Inactive'}</Text>
          </View>
        </View>

        {/* Default Radius */}
        <Text style={styles.sectionTitle}>Default Radius</Text>
        <View style={styles.radiusRow}>
          {RadiusOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radiusChip, defaultRadius === opt.value && styles.radiusChipActive]}
              onPress={() => { setDefaultRadius(opt.value); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.radiusText, defaultRadius === opt.value && styles.radiusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Permissions */}
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.permCard}>
          <View style={styles.permRow}>
            <PermIcon granted={permissionState.foregroundLocation === 'granted'} />
            <Text style={styles.permLabel}>Foreground Location</Text>
            <Text style={styles.permStatus}>{permissionState.foregroundLocation}</Text>
          </View>
          <View style={styles.permRow}>
            <PermIcon granted={permissionState.backgroundLocation === 'granted'} />
            <Text style={styles.permLabel}>Background Location</Text>
            <Text style={styles.permStatus}>{permissionState.backgroundLocation}</Text>
          </View>
          <View style={styles.permRow}>
            <PermIcon granted={permissionState.notifications === 'granted'} />
            <Text style={styles.permLabel}>Notifications</Text>
            <Text style={styles.permStatus}>{permissionState.notifications}</Text>
          </View>
        </View>

        {/* Data */}
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleExport} disabled={exporting}>
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>{exporting ? 'Exporting...' : 'Export Reminders'}</Text>
            <Text style={styles.menuDesc}>Save to file for phone migration</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleImport}>
          <Ionicons name="push-outline" size={20} color={Colors.primary} />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Import Reminders</Text>
            <Text style={styles.menuDesc}>Restore from backup file</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>App Lock (Biometrics/PIN)</Text>
            <Text style={styles.toggleDesc}>Require authentication to open the app</Text>
          </View>
          <Switch
            value={appLockEnabled}
            onValueChange={setAppLockEnabled}
            trackColor={{ false: Colors.surfaceElevated, true: Colors.primary }}
            thumbColor={Platform.OS === 'ios' ? '#ffffff' : appLockEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.privacyCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Your data stays on your phone</Text>
            <Text style={styles.privacyDesc}>
              Your location is NEVER stored, tracked, or sent anywhere. It is ONLY used locally on your device for geofencing and showing the map. We literally cannot see where you are.
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutApp}>RemindMeHere v{APP_VERSION}</Text>
          <Text style={styles.aboutDesc}>Alarms for places, not times.</Text>
          <Text style={styles.aboutDesc}>Made with ❤️ for people who forget things at places.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  content: { padding: 20, paddingBottom: 60 },
  statsCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: Colors.textPrimary, fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  statLbl: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  trackingDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  sectionTitle: {
    color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    marginBottom: 12, marginTop: 8,
  },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  radiusChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  radiusChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  radiusText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  radiusTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  permCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  permDot: { width: 8, height: 8, borderRadius: 4 },
  permLabel: { color: Colors.textPrimary, fontSize: FontSize.md, flex: 1 },
  permStatus: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'capitalize' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  menuContent: { flex: 1 },
  menuLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  menuDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  privacyCard: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.md, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.success + '30',
  },
  privacyContent: { flex: 1 },
  privacyTitle: { color: Colors.success, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: 6 },
  privacyDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  toggleContent: { flex: 1, paddingRight: 16 },
  toggleLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  toggleDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  about: { alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  aboutApp: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  aboutDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
});
