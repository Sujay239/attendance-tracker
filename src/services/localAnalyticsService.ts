import { localStorage } from './localStorageService';
import { AnalyticsSummary } from './types';
import { formatMinutesToHours, formatBalance, getLocalDateString } from './timeUtils';

export class LocalAnalyticsService {
  public async getAnalyticsSummary(period: string = 'month'): Promise<AnalyticsSummary> {
    const records = await localStorage.getAttendanceRecords();
    const balanceState = await localStorage.getBalanceState();
    const settings = await localStorage.getSettings();

    // Completed & corrected records
    const completed = records.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED');

    const totalWorkingDays = completed.length;
    let totalProductiveMinutes = 0;
    let totalRequiredMinutes = 0;
    let totalExtraMinutes = 0;
    let totalDeficitMinutes = 0;
    let onTimeDays = 0;
    let earlyDays = 0;
    let lateDays = 0;

    for (const r of completed) {
      totalProductiveMinutes += r.productiveMinutes;
      totalRequiredMinutes += r.requiredProductiveMinutes;

      if (r.dailyBalanceMinutes > 0) {
        totalExtraMinutes += r.dailyBalanceMinutes;
      } else if (r.dailyBalanceMinutes < 0) {
        totalDeficitMinutes += Math.abs(r.dailyBalanceMinutes);
      }

      if (r.earlyMinutes > 0) {
        earlyDays++;
        onTimeDays++;
      } else if (r.lateMinutes === 0) {
        onTimeDays++;
      } else {
        lateDays++;
      }
    }

    const missingClockOuts = records.filter((r) => r.status === 'MISSING_CLOCK_OUT').length;
    const averageProductiveMinutes = totalWorkingDays > 0 ? Math.round(totalProductiveMinutes / totalWorkingDays) : 0;
    const attendanceRatePercent = totalWorkingDays > 0 ? Math.round((onTimeDays / totalWorkingDays) * 100) : 0;

    // Build Current Week (Mon - Fri) Bars dynamically
    const now = new Date();
    // Find Monday of current week
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const weeklyBars = dayLabels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = getLocalDateString(d, settings.timezone);
      const rec = records.find((r) => r.date === dateStr);

      if (rec && rec.status !== 'MISSING_CLOCK_OUT') {
        const h = Math.floor(rec.productiveMinutes / 60);
        const m = rec.productiveMinutes % 60;
        const delta = rec.dailyBalanceMinutes >= 0 ? `+${rec.dailyBalanceMinutes}m` : `${rec.dailyBalanceMinutes}m`;
        const heightPercent = Math.min(100, Math.round((rec.productiveMinutes / (rec.requiredProductiveMinutes || 465)) * 100));
        const status = rec.dailyBalanceMinutes > 0 ? ('EXTRA' as const) : rec.dailyBalanceMinutes < 0 ? ('DEFICIT' as const) : ('BALANCED' as const);

        return {
          day: label,
          date: dateStr,
          hours: `${h}h ${m}m`,
          minutes: rec.productiveMinutes,
          delta,
          deltaMinutes: rec.dailyBalanceMinutes,
          heightPercent,
          status,
        };
      }

      return {
        day: label,
        date: dateStr,
        hours: '0h 0m',
        minutes: 0,
        delta: '0m',
        deltaMinutes: 0,
        heightPercent: 0,
        status: 'BALANCED' as const,
      };
    });

    // Progressive cumulative trend line points from actual completed records
    const sorted = [...completed].sort((a, b) => a.date.localeCompare(b.date));
    const trendPoints = sorted.map((r) => ({
      date: r.date,
      dailyBalance: r.dailyBalanceMinutes,
      cumulativeBalance: r.cumulativeBalanceMinutes ?? 0,
    }));

    const netBalanceFormatted = formatBalance(balanceState.cumulativeBalanceMinutes);
    const totalHoursFormatted = formatMinutesToHours(totalProductiveMinutes);

    const totalDaysCount = totalWorkingDays || 1;
    const earlyPercent = totalWorkingDays > 0 ? Math.round((earlyDays / totalDaysCount) * 100) : 0;
    const latePercent = totalWorkingDays > 0 ? Math.round((lateDays / totalDaysCount) * 100) : 0;
    const pendingPercent = totalWorkingDays > 0 ? Math.round((missingClockOuts / totalDaysCount) * 100) : 0;

    const managerSnippet = totalWorkingDays > 0
      ? `Audit Summary: ${totalHoursFormatted} logged across ${totalWorkingDays} shifts (${(
          (totalProductiveMinutes / (totalRequiredMinutes || 1)) * 100
        ).toFixed(1)}% adherence). Cumulative Time Bank: ${netBalanceFormatted.text}. Punctuality rate ${attendanceRatePercent}%. Stored securely in internal device storage. Ready for payroll sign-off.`
      : `Audit Summary: 0h logged across 0 shifts. Cumulative Time Bank: ${netBalanceFormatted.text}. Stored securely in internal device storage.`;

    return {
      totalWorkingDays,
      totalProductiveMinutes,
      totalRequiredMinutes,
      totalExtraMinutes,
      totalDeficitMinutes,
      netBalanceMinutes: balanceState.cumulativeBalanceMinutes,
      averageProductiveMinutes,
      onTimeDays,
      earlyDays,
      lateDays,
      missingClockOuts,
      attendanceRatePercent,
      weeklyBars,
      trendPoints,
      cadence: {
        earlyOnTime: { days: earlyDays, percent: earlyPercent },
        lateRecovered: { days: lateDays, percent: latePercent },
        pendingAdjustment: { days: missingClockOuts, percent: pendingPercent },
      },
      managerSnippet,
    };
  }
}

export const localAnalytics = new LocalAnalyticsService();
