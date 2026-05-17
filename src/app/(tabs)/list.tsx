// ============================================================
// RemindMeHere — List View (Secondary Home Screen)
// ============================================================
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '../../constants/theme';
import { useReminderStore } from '../../stores/reminderStore';
import { useLocationStore } from '../../stores/locationStore';
import { getCategoryById } from '../../constants/categories';
import { formatDistance, getDistanceMeters } from '../../utils/distance';
import { timeAgo } from '../../utils/formatters';
import { syncGeofences } from '../../services/geofence';
import { Reminder } from '../../types';

export default function ListScreen() {
  const reminders = useReminderStore((s) => s.reminders);
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const { active, snoozed, completed } = useMemo(() => {
    const now = new Date();
    const act: Reminder[] = [];
    const sno: Reminder[] = [];
    const com: Reminder[] = [];
    for (const r of reminders) {
      if (r.completedAt) { com.push(r); }
      else if (r.snoozedUntil && new Date(r.snoozedUntil) > now) { sno.push(r); }
      else if (r.isActive) { act.push(r); }
      else { com.push(r); }
    }
    return { active: act, snoozed: sno, completed: com };
  }, [reminders]);

  const sections = [
    { title: 'Active', data: active, color: Colors.primary },
    ...(snoozed.length ? [{ title: 'Snoozed', data: snoozed, color: Colors.warning }] : []),
    ...(completed.length ? [{ title: 'Completed', data: completed, color: Colors.success }] : []),
  ];

  const renderCard = (reminder: Reminder) => {
    const cat = getCategoryById(reminder.category);
    let dist = '';
    if (currentLocation) {
      const m = getDistanceMeters(currentLocation.latitude, currentLocation.longitude, reminder.latitude, reminder.longitude);
      dist = formatDistance(m);
    }

    return (
      <Animated.View
        key={reminder.id}
        entering={FadeInDown.duration(300).delay(50)}
        layout={Layout.springify().damping(16).stiffness(120)}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push(`/reminder/${reminder.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Reminder for ${reminder.title} at ${reminder.locationName || 'pinned location'}`}
          accessibilityHint="Double tap to view reminder details"
        >
          <View style={[styles.cardDot, { backgroundColor: cat.color }]} />
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, reminder.completedAt && styles.cardTitleDone]} numberOfLines={1}>
              {reminder.title}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {reminder.locationName || 'Pinned location'}
              {dist ? ` · ${dist}` : ''}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon as any} size={14} color={cat.color} />
            </View>
            {reminder.isRecurring && (
              <Ionicons name="repeat" size={12} color={Colors.textMuted} style={{ marginTop: 4 }} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Reminders</Text>
        <TouchableOpacity 
          style={styles.settingsBtn} 
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityHint="Double tap to open settings"
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.title}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
            {section.data.map(renderCard)}
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/create')} 
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create New Reminder"
        accessibilityHint="Double tap to create a new location-based reminder"
      >
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No reminders yet</Text>
      <Text style={styles.emptyDesc}>
        Tap the + button to create your first{'\n'}location-based reminder
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  settingsBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1 },
  sectionCount: {
    color: Colors.textMuted, fontSize: FontSize.xs, backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardDot: { width: 10, height: 10, borderRadius: 5 },
  cardContent: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  cardSub: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  cardRight: { alignItems: 'center' },
  catBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute', right: 16, bottom: Platform.OS === 'ios' ? 100 : 76,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', ...Shadows.glow,
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.semibold, marginBottom: 8 },
  emptyDesc: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
});
