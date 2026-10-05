import { BalanceStatus } from './types';

/**
 * Format a Date object to YYYY-MM-DD in the specified timezone (default Asia/Kolkata).
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Format a Date object to "10:08 AM" style time string in the target timezone.
 */
export function getLocalTimeString(date: Date = new Date(), timezone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(date);
  } catch {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
  }
}

/**
 * Parse an "HH:mm" (24h) or "hh:mm AM/PM" (12h) string on a given date into a Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string, timezone: string = 'Asia/Kolkata'): Date {
  let cleanTime = timeStr.trim().toUpperCase();
  const isPM = cleanTime.includes('PM');
  const isAM = cleanTime.includes('AM');
  cleanTime = cleanTime.replace('AM', '').replace('PM', '').trim();

  const parts = cleanTime.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  // Parse dateStr (can be YYYY-MM-DD or standard parseable string)
  let year = 2026;
  let month = 10;
  let day = 1;

  if (dateStr.includes('-')) {
    const dParts = dateStr.split('-').map((v) => parseInt(v, 10));
    year = dParts[0];
    month = dParts[1];
    day = dParts[2];
  } else {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth() + 1;
      day = parsedDate.getDate();
    }
  }

  // Format as ISO string with Asia/Kolkata offset (+05:30) if timezone is Kolkata
  let offset = '+05:30';
  if (timezone === 'UTC') offset = 'Z';

  const yyyy = year.toString().padStart(4, '0');
  const mm = month.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  const hh = hours.toString().padStart(2, '0');
  const min = minutes.toString().padStart(2, '0');
  const isoWithOffset = `${yyyy}-${mm}-${dd}T${hh}:${min}:00${offset}`;
  return new Date(isoWithOffset);
}

/**
 * Calculate difference in minutes between two Dates (b - a).
 */
export function diffMinutes(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 60000);
}

/**
 * Format total minutes to "7h 45m" or "45m" or "0m"
 */
export function formatMinutesToHours(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/**
 * Format signed balance: e.g. +42 -> "+42 min", -18 -> "−18 min", 0 -> "0 min"
 */
export function formatBalance(balanceMinutes: number): {
  text: string;
  status: BalanceStatus;
  message: string;
} {
  if (balanceMinutes > 0) {
    return {
      text: `+${balanceMinutes} min`,
      status: 'POSITIVE',
      message: `You have ${balanceMinutes} minutes of extra time remaining.`,
    };
  } else if (balanceMinutes < 0) {
    const abs = Math.abs(balanceMinutes);
    return {
      text: `−${abs} min`,
      status: 'NEGATIVE',
      message: `You need to adjust ${abs} minutes.`,
    };
  } else {
    return {
      text: `0 min`,
      status: 'BALANCED',
      message: `Your time balance is currently balanced.`,
    };
  }
}

/**
 * Returns whether a given date is a configured working day (1=Mon ... 5=Fri).
 */
export function isWorkingDay(date: Date, workingDays: number[] = [1, 2, 3, 4, 5], timezone: string = 'Asia/Kolkata'): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayShort = formatter.format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const dayNum = map[weekdayShort] || 1;
  return workingDays.includes(dayNum);
}
