import { Settings, AttendanceRecord } from './types';
import { diffMinutes, combineDateAndTime, getLocalTimeString } from './timeUtils';

export interface CalculationResult {
  officeMinutes: number;
  lunchMinutes: number;
  bufferMinutes: number;
  productiveMinutes: number;
  requiredProductiveMinutes: number;
  dailyBalanceMinutes: number;
  earlyMinutes: number;
  lateMinutes: number;
  suggestedCompletionTime: string;
}

/**
 * Authoritative Canonical Calculation Engine.
 */
export function calculateAttendance(
  clockInDate: Date,
  clockOutDate: Date | null,
  dateStr: string,
  settings: Settings
): CalculationResult {
  const officialStartStr = settings.workStartTime || '10:00';
  const lunchMinutes = settings.lunchMinutes ?? 60;
  const bufferMinutes = settings.bufferMinutes ?? 15;
  const requiredProductiveMinutes = settings.requiredProductiveMinutes ?? 465;

  // 1. Calculate Early / Late Arrival from officialStart (e.g. 10:00)
  const officialStartDate = combineDateAndTime(dateStr, officialStartStr, settings.timezone);
  const diffStart = diffMinutes(officialStartDate, clockInDate);

  let earlyMinutes = 0;
  let lateMinutes = 0;

  if (diffStart < 0) {
    earlyMinutes = Math.abs(diffStart);
  } else if (diffStart > 0) {
    lateMinutes = diffStart;
  }

  // 2. Suggested recovery completion time = clockIn + lunch + buffer + requiredProductiveMinutes (9 hours total)
  const totalShiftNeededMs = (lunchMinutes + bufferMinutes + requiredProductiveMinutes) * 60000;
  const suggestedEndDate = new Date(clockInDate.getTime() + totalShiftNeededMs);
  const suggestedCompletionTime = getLocalTimeString(suggestedEndDate, settings.timezone);

  // 3. Office & Productive Calculations
  if (!clockOutDate) {
    // If not clocked out yet, calculate elapsed
    const now = new Date();
    const officeMinutes = Math.max(0, diffMinutes(clockInDate, now));
    const productiveMinutes = Math.max(0, officeMinutes - lunchMinutes - bufferMinutes);
    const dailyBalanceMinutes = productiveMinutes - requiredProductiveMinutes;

    return {
      officeMinutes,
      lunchMinutes,
      bufferMinutes,
      productiveMinutes,
      requiredProductiveMinutes,
      dailyBalanceMinutes,
      earlyMinutes,
      lateMinutes,
      suggestedCompletionTime,
    };
  }

  // Complete attendance calculation
  const officeMinutes = Math.max(0, diffMinutes(clockInDate, clockOutDate));
  const productiveMinutes = officeMinutes - lunchMinutes - bufferMinutes;
  const dailyBalanceMinutes = productiveMinutes - requiredProductiveMinutes;

  return {
    officeMinutes,
    lunchMinutes,
    bufferMinutes,
    productiveMinutes,
    requiredProductiveMinutes,
    dailyBalanceMinutes,
    earlyMinutes,
    lateMinutes,
    suggestedCompletionTime,
  };
}

/**
 * Rebuild cumulative balance chain for all attendance records.
 */
export function recalculateCumulativeBalances(records: AttendanceRecord[]): {
  records: AttendanceRecord[];
  finalCumulativeBalance: number;
} {
  // Sort chronologically by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  let runningCumulative = 0;

  for (const record of sorted) {
    if (record.status === 'COMPLETED' || record.status === 'CORRECTED') {
      runningCumulative += record.dailyBalanceMinutes;
      record.cumulativeBalanceMinutes = runningCumulative;
    } else {
      record.cumulativeBalanceMinutes = runningCumulative;
    }
  }

  return {
    records: sorted,
    finalCumulativeBalance: runningCumulative,
  };
}
