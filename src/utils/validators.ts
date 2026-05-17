// ============================================================
// RemindMeHere — Input Validators
// ============================================================

export function validateReminderTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return 'Title is required';
  if (trimmed.length > 200) return 'Title must be under 200 characters';
  return null; // valid
}

export function validateCoordinates(lat: number, lng: number): string | null {
  if (lat < -90 || lat > 90) return 'Invalid latitude';
  if (lng < -180 || lng > 180) return 'Invalid longitude';
  return null;
}

export function validateRadius(meters: number): string | null {
  if (meters < 50) return 'Radius must be at least 50 meters';
  if (meters > 5000) return 'Radius must be under 5 km';
  return null;
}
