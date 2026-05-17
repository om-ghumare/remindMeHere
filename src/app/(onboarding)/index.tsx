// ============================================================
// RemindMeHere — Onboarding Screen
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { requestAllPermissions } from '../../services/permissions';
import { syncGeofences } from '../../services/geofence';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'location-outline',
    title: 'Never Forget\nAt The Right Place',
    subtitle: '🛵 Petrol pump, 🛒 Grocery store, 💊 Pharmacy',
    description: 'You tell yourself "I\'ll do it next time" — but then forget again. Three days later, your bike runs out of fuel on the highway.',
    color: '#FF6B9D',
  },
  {
    id: '2',
    icon: 'pin-outline',
    title: 'Drop a Pin.\nWrite a Reminder.',
    subtitle: 'As simple as setting an alarm',
    description: 'Pick any place on the map, type what you need to do there, and forget about it. We\'ll remember for you.',
    color: '#4F8CFF',
  },
  {
    id: '3',
    icon: 'notifications-outline',
    title: 'Get Notified\nWhen You Arrive',
    subtitle: 'Like an alarm, but for places',
    description: 'When you\'re near your saved location — whether driving, walking, or commuting — you\'ll get a notification. No more forgetting.',
    color: '#00D68F',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide — request permissions and go to app
      await requestAllPermissions();
      await syncGeofences();
      setOnboardingComplete();
      router.replace('/(tabs)/map');
    }
  };

  const handleSkip = async () => {
    await requestAllPermissions();
    await syncGeofences();
    setOnboardingComplete();
    router.replace('/(tabs)/map');
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      {/* Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
        <View style={[styles.iconInner, { backgroundColor: item.color + '30' }]}>
          <Ionicons name={item.icon} size={64} color={item.color} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        const dotColor = scrollX.interpolate({
          inputRange,
          outputRange: [Colors.textMuted, SLIDES[index].color, Colors.textMuted],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: dotColor,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom area */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: SLIDES[currentIndex].color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={Colors.textInverse}
          />
        </TouchableOpacity>

        {/* Privacy note on last slide */}
        {currentIndex === SLIDES.length - 1 && (
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.success} />
            <Text style={styles.privacyText}>
              Your location is NEVER stored or sent anywhere. Only used for geofencing on your device.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.xl,
    width: '100%',
    gap: 8,
  },
  nextButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
    paddingHorizontal: 16,
  },
  privacyText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 15,
  },
});
