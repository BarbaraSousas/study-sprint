/**
 * Get today's date in YYYY-MM-DD format using the user's timezone.
 * This fixes the bug where UTC date doesn't match the user's local date.
 */
export function getUserToday(userTimezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
}

/**
 * Get the previous date in YYYY-MM-DD format.
 */
export function getPreviousDate(date: string): string {
  const d = new Date(date + 'T12:00:00'); // Use noon to avoid timezone edge cases
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate days between two YYYY-MM-DD dates.
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
