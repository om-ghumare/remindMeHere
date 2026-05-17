// ============================================================
// RemindMeHere — Reminder Detail Screen
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { useReminderStore } from '../../stores/reminderStore';
import { getCategoryById } from '../../constants/categories';
import { syncGeofences } from '../../services/geofence';
import { getTriggerHistory } from '../../db/database';
import { formatDateTime, timeAgo } from '../../utils/formatters';
import { TriggerHistoryEntry } from '../../types';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminders = useReminderStore((s) => s.reminders);
  const completeReminder = useReminderStore((s) => s.completeReminder);
  const deleteReminder = useReminderStore((s) => s.deleteReminder);
  const snoozeReminder = useReminderStore((s) => s.snoozeReminder);
  const toggleActive = useReminderStore((s) => s.toggleActive);
  const [history, setHistory] = useState<TriggerHistoryEntry[]>([]);

  const reminder = reminders.find((r) => r.id === id);

  useEffect(() => {
    if (id) {
      getTriggerHistory(id).then(setHistory).catch(() => {});
    }
  }, [id]);

  if (!reminder) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Reminder not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cat = getCategoryById(reminder.category);
  const isCompleted = !!reminder.completedAt;

  const handleComplete = async () => {
    await completeReminder(reminder.id);
    await syncGeofences();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleSnooze = async () => {
    const until = new Date();
    until.setHours(until.getHours() + 1);
    await snoozeReminder(reminder.id, until.toISOString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDelete = () => {
    Alert.alert('Delete Reminder', `Are you sure you want to delete "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteReminder(reminder.id);
          await syncGeofences();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  const handleToggle = async () => {
    await toggleActive(reminder.id, !reminder.isActive);
    await syncGeofences();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      {/* Mini map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          initialRegion={{
            latitude: reminder.latitude,
            longitude: reminder.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Circle
            center={{ latitude: reminder.latitude, longitude: reminder.longitude }}
            radius={reminder.radiusMeters}
            fillColor={cat.color + '20'}
            strokeColor={cat.color + '50'}
            strokeWidth={1.5}
          />
          <Marker coordinate={{ latitude: reminder.latitude, longitude: reminder.longitude }}>
            <View style={[styles.marker, { borderColor: cat.color }]}>
              <Ionicons name={cat.icon as any} size={16} color={cat.color} />
            </View>
          </Marker>
        </MapView>

        {/* Overlay header */}
        <TouchableOpacity style={styles.backOverlay} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Title + status */}
        <View style={styles.titleRow}>
          <View style={[styles.statusDot, { backgroundColor: isCompleted ? Colors.success : cat.color }]} />
          <Text style={[styles.title, isCompleted && styles.titleDone]}>{reminder.title}</Text>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {reminder.locationName || 'Pinned location'}
            {reminder.locationAddress ? ` · ${reminder.locationAddress}` : ''}
          </Text>
        </View>

        {/* Meta info chips */}
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: cat.color + '15' }]}>
            <Ionicons name={cat.icon as any} size={12} color={cat.color} />
            <Text style={[styles.metaText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="radio-button-on-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{reminder.radiusMeters}m radius</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons
              name={reminder.triggerOn === 'enter' ? 'enter-outline' : reminder.triggerOn === 'exit' ? 'exit-outline' : 'swap-horizontal-outline'}
              size={12} color={Colors.textMuted}
            />
            <Text style={styles.metaText}>
              {reminder.triggerOn === 'enter' ? 'On arrive' : reminder.triggerOn === 'exit' ? 'On leave' : 'Both'}
            </Text>
          </View>
          {reminder.isRecurring && (
            <View style={styles.metaChip}>
              <Ionicons name="repeat" size={12} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary }]}>Recurring</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {reminder.description && (
          <View style={styles.descBox}>
            <Text style={styles.descText}>{reminder.description}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{reminder.triggerCount}</Text>
            <Text style={styles.statLabel}>Triggers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{timeAgo(reminder.createdAt)}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
          {reminder.lastTriggered && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{timeAgo(reminder.lastTriggered)}</Text>
                <Text style={styles.statLabel}>Last alert</Text>
              </View>
            </>
          )}
        </View>

        {/* Trigger history */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Trigger History</Text>
            {history.slice(0, 5).map((h) => (
              <View key={h.id} style={styles.historyItem}>
                <View style={styles.historyDot} />
                <Text style={styles.historyText}>{formatDateTime(h.triggeredAt)}</Text>
                {h.actionTaken && (
                  <Text style={[styles.historyAction, {
                    color: h.actionTaken === 'completed' ? Colors.success : Colors.warning
                  }]}>
                    {h.actionTaken}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {!isCompleted && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSnooze}>
            <Ionicons name="time-outline" size={20} color={Colors.warning} />
            <Text style={[styles.actionText, { color: Colors.warning }]}>Snooze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleToggle}>
            <Ionicons name={reminder.isActive ? 'pause-outline' : 'play-outline'} size={20} color={Colors.textSecondary} />
            <Text style={styles.actionText}>{reminder.isActive ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
            <Text style={[styles.actionText, { color: Colors.textInverse }]}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { color: Colors.textPrimary, fontSize: FontSize.lg, textAlign: 'center', marginTop: 100 },
  mapContainer: { height: 220 },
  map: { flex: 1 },
  marker: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  backOverlay: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16,
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface + 'E0',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  title: { color: Colors.textPrimary, fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, flex: 1 },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoText: { color: Colors.textSecondary, fontSize: FontSize.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  metaText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  descBox: {
    backgroundColor: Colors.surface, padding: 14, borderRadius: BorderRadius.md,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  descText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  historySection: { marginTop: 4 },
  historyTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 12 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  historyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  historyText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  historyAction: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textTransform: 'capitalize' },
  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
  },
  actionText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  completeBtn: { backgroundColor: Colors.success },
  deleteBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.danger + '15',
    justifyContent: 'center', alignItems: 'center',
  },
});
