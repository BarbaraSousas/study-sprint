// ============================================
// Date Utilities
// ============================================

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}
