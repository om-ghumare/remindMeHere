// ============================================================
// RemindMeHere — Formatting Utilities
// ============================================================
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function timeAgo(isoDate: string): string {
  return dayjs(isoDate).fromNow();
}

/**
 * Format a date string to "May 17, 2026"
 */
export function formatDate(isoDate: string): string {
  return dayjs(isoDate).format('MMM D, YYYY');
}

/**
 * Format a date string to "May 17, 2026 at 12:30 PM"
 */
export function formatDateTime(isoDate: string): string {
  return dayjs(isoDate).format('MMM D, YYYY [at] h:mm A');
}

/**
 * Get current time as ISO 8601 string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}
