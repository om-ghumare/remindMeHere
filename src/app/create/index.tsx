// ============================================================
// RemindMeHere — Create Reminder (Location Picker + Details)
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows, RadiusOptions, CategoryColors } from '../../constants/theme';
import { DEFAULT_MAP_DELTA, DEFAULT_MAP_REGION } from '../../constants/config';
import { CATEGORIES } from '../../constants/categories';
import { useReminderStore } from '../../stores/reminderStore';
import { useLocationStore } from '../../stores/locationStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { syncGeofences } from '../../services/geofence';
import { validateReminderTitle } from '../../utils/validators';
import { CreateReminderInput, TriggerType, CategoryId, ReminderPriority } from '../../types';
import * as Haptics from 'expo-haptics';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

export default function CreateReminderScreen() {
  const addReminder = useReminderStore((s) => s.addReminder);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const defaultRadius = useSettingsStore((s) => s.defaultRadius);
  const mapRef = useRef<MapView>(null);

  // Step management
  const [step, setStep] = useState<'location' | 'details'>('location');

  // Location step
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    currentLocation || null
  );
  const [locationName, setLocationName] = useState('');

  // Details step
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [radius, setRadius] = useState(defaultRadius);
  const [triggerOn, setTriggerOn] = useState<TriggerType>('enter');
  const [category, setCategory] = useState<CategoryId>('general');
  const [isRecurring, setIsRecurring] = useState(false);
  const [priority, setPriority] = useState<ReminderPriority>('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentLocation && !pin) {
      setPin(currentLocation);
    }
  }, [currentLocation]);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const useCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(coords);
      mapRef.current?.animateToRegion({ ...coords, ...DEFAULT_MAP_DELTA }, 500);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
  };

  const handleConfirmLocation = () => {
    if (!pin) {
      Alert.alert('No location', 'Tap the map to place a pin or use your current location.');
      return;
    }
    setStep('details');
  };

  const handleSave = async () => {
    const titleErr = validateReminderTitle(title);
    if (titleErr) { Alert.alert('Oops', titleErr); return; }
    if (!pin) { Alert.alert('Oops', 'Please select a location.'); return; }

    setSaving(true);
    try {
      const input: CreateReminderInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        latitude: pin.latitude,
        longitude: pin.longitude,
        locationName: locationName.trim() || undefined,
        radiusMeters: radius,
        triggerOn,
        isRecurring,
        category,
        priority,
      };

      await addReminder(input);
      await syncGeofences();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'location') {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          initialRegion={pin ? { ...pin, ...DEFAULT_MAP_DELTA } : DEFAULT_MAP_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {pin && (
            <>
              <Circle
                center={pin}
                radius={radius}
                fillColor={Colors.primaryGlow}
                strokeColor={Colors.primary + '60'}
                strokeWidth={1.5}
              />
              <Marker coordinate={pin} draggable onDragEnd={handleMapPress}>
                <View style={styles.pinMarker}>
                  <Ionicons name="location" size={28} color={Colors.primary} />
                </View>
              </Marker>
            </>
          )}
        </MapView>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Pick a location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Location name input */}
        <View style={styles.locationInput}>
          <TextInput
            style={styles.locationNameInput}
            placeholder="Location name (optional)"
            placeholderTextColor={Colors.textMuted}
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.currentLocBtn} onPress={useCurrentLocation}>
            <Ionicons name="navigate" size={18} color={Colors.primary} />
            <Text style={styles.currentLocText}>Use current location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, !pin && styles.confirmBtnDisabled]}
            onPress={handleConfirmLocation}
            disabled={!pin}
          >
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Details step
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top bar */}
      <View style={styles.detailsTopBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('location')}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reminder Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
        {/* Title */}
        <Text style={styles.label}>What do you need to do?</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="e.g., Buy Feviquick"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          autoFocus
          maxLength={200}
        />

        {/* Description */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.titleInput, styles.descInput]}
          placeholder="Any extra details..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, category === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
              onPress={() => { setCategory(cat.id); Haptics.selectionAsync(); }}
            >
              <Ionicons name={cat.icon as any} size={14} color={category === cat.id ? cat.color : Colors.textMuted} />
              <Text style={[styles.chipText, category === cat.id && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Radius */}
        <Text style={styles.label}>Alert radius</Text>
        <View style={styles.radiusRow}>
          {RadiusOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.radiusChip, radius === opt.value && styles.radiusChipActive]}
              onPress={() => { setRadius(opt.value); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.radiusChipText, radius === opt.value && styles.radiusChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trigger type */}
        <Text style={styles.label}>Trigger when I...</Text>
        <View style={styles.triggerRow}>
          {[
            { value: 'enter' as TriggerType, label: 'Arrive', icon: 'enter-outline' },
            { value: 'exit' as TriggerType, label: 'Leave', icon: 'exit-outline' },
            { value: 'both' as TriggerType, label: 'Both', icon: 'swap-horizontal-outline' },
          ].map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.triggerChip, triggerOn === t.value && styles.triggerChipActive]}
              onPress={() => { setTriggerOn(t.value); Haptics.selectionAsync(); }}
            >
              <Ionicons name={t.icon as any} size={16} color={triggerOn === t.value ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.triggerText, triggerOn === t.value && styles.triggerTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recurring toggle */}
        <TouchableOpacity
          style={[styles.toggleRow, isRecurring && styles.toggleRowActive]}
          onPress={() => { setIsRecurring(!isRecurring); Haptics.selectionAsync(); }}
        >
          <View style={styles.toggleLeft}>
            <Ionicons name="repeat" size={18} color={isRecurring ? Colors.primary : Colors.textMuted} />
            <View>
              <Text style={[styles.toggleLabel, isRecurring && { color: Colors.primary }]}>Recurring</Text>
              <Text style={styles.toggleDesc}>Remind every time, not just once</Text>
            </View>
          </View>
          <View style={[styles.toggleSwitch, isRecurring && styles.toggleSwitchOn]}>
            <View style={[styles.toggleKnob, isRecurring && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Save button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={22} color={Colors.textInverse} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Reminder'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  topBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface + 'E0',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  topTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  pinMarker: { alignItems: 'center' },
  locationInput: {
    position: 'absolute', top: Platform.OS === 'ios' ? 108 : 88, left: 16, right: 16,
  },
  locationNameInput: {
    backgroundColor: Colors.surface + 'F0', color: Colors.textPrimary, fontSize: FontSize.md,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  bottomActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1, borderColor: Colors.border, gap: 12,
  },
  currentLocBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  currentLocText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  detailsTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, paddingBottom: 12,
  },
  detailsScroll: { flex: 1 },
  detailsContent: { padding: 20, paddingBottom: 120 },
  label: {
    color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    marginBottom: 8, marginTop: 20,
  },
  titleInput: {
    backgroundColor: Colors.surface, color: Colors.textPrimary, fontSize: FontSize.lg,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  descInput: { minHeight: 80, textAlignVertical: 'top', fontSize: FontSize.md },
  chipScroll: { flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  radiusRow: { flexDirection: 'row', gap: 8 },
  radiusChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  radiusChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  radiusChipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  radiusChipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  triggerRow: { flexDirection: 'row', gap: 8 },
  triggerChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  triggerChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  triggerText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  triggerTextActive: { color: Colors.primary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    marginTop: 20, borderWidth: 1, borderColor: Colors.border,
  },
  toggleRowActive: { borderColor: Colors.primary + '50' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  toggleDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  toggleSwitch: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleSwitchOn: { backgroundColor: Colors.primary },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textMuted,
  },
  toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: Colors.textPrimary },
  saveContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: BorderRadius.xl, backgroundColor: Colors.primary,
    ...Shadows.glow,
  },
  saveBtnText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
