// MySQL TIME columns come back as Date objects (1970-01-01 + time). Extract HH:MM.
export function dbTimeToString(t: Date | string | null | undefined): string {
  if (t instanceof Date) {
    return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
  }
  return String(t ?? '').slice(0, 5);
}

// Convert "HH:MM" string to a Date for writing to a MySQL TIME column.
export function timeStringToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(0);
  d.setUTCHours(h, m, 0, 0);
  return d;
}
