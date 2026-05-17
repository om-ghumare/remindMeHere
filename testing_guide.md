# RemindMeHere — Manual Testing Guide

Because this app relies heavily on native OS features (Background Location and Task Manager), you must test it on a physical device using a Custom Dev Client, not Expo Go.

To build the client to your phone (via USB):
- **Android**: run `npx expo run:android`
- **iOS**: run `npx expo run:ios` (requires Mac and Xcode)

---

## 1. Core Geofencing & Notifications (The "Walkabout" Test)

This is the most critical test to ensure the background task manager successfully wakes the app up when you enter a zone.

**Setup:**
1. Open the app and grant all permissions (Foreground Location, Background Location, Notifications).
2. Create a reminder for a location about 1-2 blocks away from your current location (e.g., a nearby coffee shop or intersection). Set the radius to 100 meters.
3. Force close the app completely (swipe it away from your recent apps list). This proves the background task survives app termination.

**Execution:**
1. Put your phone in your pocket and physically walk/drive toward the location.
2. Wait for the push notification to arrive. Note: OS geofencing can sometimes take up to 2-3 minutes to trigger after you cross the boundary to preserve battery.

**Verification:**
- [ ] Did the notification arrive?
- [ ] Does the notification text accurately show the reminder title?
- [ ] Expand the notification: Do you see the **Done** and **Snooze** action buttons?
- [ ] Tap **Done**. Open the app. Is the reminder moved to the "Completed" section?

---

## 2. Snooze Logic Verification

**Setup:**
1. Create a reminder for your *current* location (radius 100m). 
2. The geofence enter event should trigger almost immediately.

**Execution:**
1. When the notification pops up, pull it down and tap **Snooze**.
2. Walk away from the location (outside the 100m radius), then walk back into it.

**Verification:**
- [ ] The app should **not** send a second notification, because the reminder is currently snoozed.
- [ ] Open the app. The reminder should be in the "Snoozed" section of the List View.

---

## 3. Permission Denial Paths

It is crucial that the app doesn't crash if a user denies permissions.

**Execution:**
1. Uninstall the app completely from your phone, then reinstall it via `npx expo run:android`.
2. Launch the app and proceed through onboarding.
3. When prompted for Foreground Location, tap **Deny**.
4. Go to the Settings screen in the app.

**Verification:**
- [ ] The app should not crash during onboarding.
- [ ] The Settings screen should show red indicators for location permissions.
- [ ] Try creating a reminder. The app should gracefully prompt you to enable permissions in your phone's OS settings.

---

## 4. Edge Cases & Resilience

### A. Location Disabled (OS Level)
1. Turn off your phone's Master Location toggle (GPS off).
2. Open the app. 
- [ ] The Map tab should show a fallback (e.g., world view or last known location) without crashing.
- [ ] Creating a new reminder should fail gracefully, prompting you to turn on location services.

### B. Airplane Mode / Offline
Since this is a local-first SQLite app, it should work perfectly offline (with the exception of loading new Google Maps tiles).
1. Turn on Airplane mode.
2. Create a new reminder by long-pressing on a cached area of the map.
3. Mark an existing active reminder as complete.
- [ ] Data should save instantly.
- [ ] Restart the app. The new reminder and the completed status should persist.

### C. App Lock (Biometrics)
1. Go to Settings and enable "App Lock".
2. Force close the app and reopen it.
- [ ] You should be intercepted by the Lock Screen.
- [ ] Failing the fingerprint/Face ID scan should keep the app locked.
- [ ] Passing the scan should reveal your data.

---

## 5. Google Maps API Validation
1. Ensure you have replaced `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` with a real key.
2. Open the Map tab.
- [ ] Does the map render? (If it shows a blank grid with a Google logo, the API key is missing or invalid).
- [ ] Does the custom dark theme apply to the map tiles?
