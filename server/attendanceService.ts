import { storage } from './storageService';
import { AttendanceRecord, DashboardResponse, CalendarDaySummary } from './types';
import {
  getLocalDateString,
  getLocalTimeString,
  combineDateAndTime,
  isWorkingDay,
  diffMinutes,
  formatMinutesToHours,
  formatBalance,
} from './timeUtils';
import { calculateAttendance, recalculateCumulativeBalances } from './attendanceCalculator';

export class AttendanceService {
  /**
   * Check and flag any unclosed shifts from prior days as MISSING_CLOCK_OUT.
   */
  public checkAndFlagMissingClockOuts(): AttendanceRecord[] {
    const settings = storage.getSettings();
    const todayStr = getLocalDateString(new Date(), settings.timezone);
    const records = storage.getAttendanceRecords();

    let modified = false;
    for (const r of records) {
      if (r.date < todayStr && r.status === 'WORKING') {
        r.status = 'MISSING_CLOCK_OUT';
        r.updatedAt = new Date().toISOString();
        modified = true;
      }
    }

    if (modified) {
      storage.saveAttendanceRecords(records);
    }

    return records.filter((r) => r.status === 'MISSING_CLOCK_OUT');
  }

  /**
   * Clock-in handler (POST /api/attendance/clock-in).
   * Implements Sections 10, 11, 12 of specification.
   */
  public clockIn(notes: string = ''): { attendance: AttendanceRecord; lateMinutes: number; earlyMinutes: number } {
    this.checkAndFlagMissingClockOuts();

    const settings = storage.getSettings();
    const now = new Date();
    const todayStr = getLocalDateString(now, settings.timezone);
    const records = storage.getAttendanceRecords();

    // Check if an attendance record already exists for today
    const existing = records.find((r) => r.date === todayStr);

    if (existing) {
      if (existing.status === 'WORKING') {
        throw new Error('You have already clocked in today.');
      }
      if (existing.status === 'COMPLETED' || existing.status === 'CORRECTED') {
        throw new Error("Today's attendance has already been completed.");
      }
    }

    const calc = calculateAttendance(now, null, todayStr, settings);

    const newRecord: AttendanceRecord = {
      id: todayStr,
      date: todayStr,
      clockIn: now.toISOString(),
      clockOut: null,
      officialStart: settings.workStartTime,
      officialEnd: settings.workEndTime,
      lunchMinutes: settings.lunchMinutes,
      bufferMinutes: settings.bufferMinutes,
      officeMinutes: 0,
      productiveMinutes: 0,
      requiredProductiveMinutes: settings.requiredProductiveMinutes,
      dailyBalanceMinutes: 0 - settings.requiredProductiveMinutes,
      earlyMinutes: calc.earlyMinutes,
      lateMinutes: calc.lateMinutes,
      status: 'WORKING',
      notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    records.push(newRecord);
    storage.saveAttendanceRecords(records);

    return {
      attendance: newRecord,
      lateMinutes: calc.lateMinutes,
      earlyMinutes: calc.earlyMinutes,
    };
  }

  /**
   * Clock-out handler (POST /api/attendance/clock-out).
   * Implements Sections 13, 14, 15, 17 of specification.
   */
  public clockOut(notes?: string): AttendanceRecord {
    const settings = storage.getSettings();
    const now = new Date();
    const records = storage.getAttendanceRecords();

    // Find active working record
    const active = records.find((r) => r.status === 'WORKING');
    if (!active) {
      throw new Error('No active working session found. You must clock in first.');
    }

    const clockInDate = new Date(active.clockIn);
    if (now.getTime() <= clockInDate.getTime()) {
      throw new Error('Clock-out timestamp cannot be before clock-in timestamp.');
    }

    // Use canonical calculator
    const calc = calculateAttendance(clockInDate, now, active.date, settings);

    active.clockOut = now.toISOString();
    active.officeMinutes = calc.officeMinutes;
    active.productiveMinutes = calc.productiveMinutes;
    active.dailyBalanceMinutes = calc.dailyBalanceMinutes;
    active.status = 'COMPLETED';
    active.updatedAt = now.toISOString();
    if (notes) active.notes = notes;

    // Persist and recalculate cumulative balances chain
    const { records: updatedRecords } = storage.saveAttendanceRecords(records);
    return updatedRecords.find((r) => r.id === active.id) || active;
  }

  /**
   * Historical record correction / missing clock-out correction.
   * Implements Sections 20, 37 of specification.
   */
  public correctRecord(
    dateStr: string,
    clockInTimeStr: string,
    clockOutTimeStr: string,
    reason: string = 'Manual Adjustment',
    notes: string = ''
  ): AttendanceRecord {
    const settings = storage.getSettings();
    const records = storage.getAttendanceRecords();

    // Combine date + time
    const clockIn = combineDateAndTime(dateStr, clockInTimeStr, settings.timezone);
    const clockOut = combineDateAndTime(dateStr, clockOutTimeStr, settings.timezone);

    if (clockOut.getTime() <= clockIn.getTime()) {
      throw new Error('Clock-out time must be after clock-in time.');
    }

    const calc = calculateAttendance(clockIn, clockOut, dateStr, settings);

    let existing = records.find((r) => r.date === dateStr);
    if (!existing) {
      existing = {
        id: dateStr,
        date: dateStr,
        clockIn: clockIn.toISOString(),
        clockOut: clockOut.toISOString(),
        officialStart: settings.workStartTime,
        officialEnd: settings.workEndTime,
        lunchMinutes: settings.lunchMinutes,
        bufferMinutes: settings.bufferMinutes,
        officeMinutes: calc.officeMinutes,
        productiveMinutes: calc.productiveMinutes,
        requiredProductiveMinutes: settings.requiredProductiveMinutes,
        dailyBalanceMinutes: calc.dailyBalanceMinutes,
        earlyMinutes: calc.earlyMinutes,
        lateMinutes: calc.lateMinutes,
        status: 'CORRECTED',
        reasonCode: reason,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      records.push(existing);
    } else {
      existing.clockIn = clockIn.toISOString();
      existing.clockOut = clockOut.toISOString();
      existing.officeMinutes = calc.officeMinutes;
      existing.productiveMinutes = calc.productiveMinutes;
      existing.dailyBalanceMinutes = calc.dailyBalanceMinutes;
      existing.earlyMinutes = calc.earlyMinutes;
      existing.lateMinutes = calc.lateMinutes;
      existing.status = 'CORRECTED';
      existing.reasonCode = reason;
      if (notes) existing.notes = notes;
      existing.updatedAt = new Date().toISOString();
    }

    // Save and recalculate entire cumulative chain forward
    storage.saveAttendanceRecords(records);
    return existing;
  }

  /**
   * Get Dashboard unified state (GET /api/dashboard).
   * Implements Sections 21, 22, 23, 49 of specification.
   */
  public getDashboardData(): DashboardResponse {
    const settings = storage.getSettings();
    const now = new Date();
    const todayStr = getLocalDateString(now, settings.timezone);
    const currentTime = getLocalTimeString(now, settings.timezone);

    const missingClockOuts = this.checkAndFlagMissingClockOuts();
    const records = storage.getAttendanceRecords();
    const balanceState = storage.getBalanceState();

    const todayRecord = records.find((r) => r.date === todayStr) || null;
    const isClockedIn = todayRecord?.status === 'WORKING';

    let officeMinutes = 0;
    let productiveMinutes = 0;
    let remainingMinutes = settings.requiredProductiveMinutes;
    let lateMinutes = 0;
    let earlyMinutes = 0;
    let dailyBalanceMinutes: number | null = null;
    let suggestedCompletionTime = '07:00 PM';
    let progressPercent = 0;

    if (todayRecord) {
      const clockInDate = new Date(todayRecord.clockIn);
      const clockOutDate = todayRecord.clockOut ? new Date(todayRecord.clockOut) : null;
      const calc = calculateAttendance(clockInDate, clockOutDate, todayStr, settings);

      officeMinutes = calc.officeMinutes;
      productiveMinutes = calc.productiveMinutes;
      lateMinutes = calc.lateMinutes;
      earlyMinutes = calc.earlyMinutes;
      suggestedCompletionTime = calc.suggestedCompletionTime;

      if (isClockedIn) {
        remainingMinutes = Math.max(0, settings.requiredProductiveMinutes - productiveMinutes);
        progressPercent = Math.min(100, Math.round((productiveMinutes / settings.requiredProductiveMinutes) * 100));
        dailyBalanceMinutes = productiveMinutes - settings.requiredProductiveMinutes;
      } else {
        remainingMinutes = 0;
        progressPercent = Math.min(100, Math.round((productiveMinutes / settings.requiredProductiveMinutes) * 100));
        dailyBalanceMinutes = todayRecord.dailyBalanceMinutes;
      }
    }

    // Sorted recent 5 records
    const recentRecords = [...records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      date: todayStr,
      currentTime,
      attendanceStatus: todayRecord ? todayRecord.status : 'NOT_STARTED',
      isClockedIn,
      clockIn: todayRecord ? getLocalTimeString(new Date(todayRecord.clockIn), settings.timezone) : null,
      clockOut: todayRecord?.clockOut ? getLocalTimeString(new Date(todayRecord.clockOut), settings.timezone) : null,
      officeMinutes,
      productiveMinutes,
      requiredMinutes: settings.requiredProductiveMinutes,
      remainingMinutes,
      lateMinutes,
      earlyMinutes,
      dailyBalanceMinutes,
      cumulativeBalanceMinutes: balanceState.cumulativeBalanceMinutes,
      expectedEnd: '07:00 PM',
      suggestedCompletionTime,
      progressPercent,
      todayRecord,
      recentRecords,
      missingClockOuts,
    };
  }

  /**
   * Calendar Data summary for a month (GET /api/attendance/calendar?month=YYYY-MM).
   * Implements Section 30 of specification.
   */
  public getCalendarData(monthQuery?: string): CalendarDaySummary[] {
    const settings = storage.getSettings();
    const targetMonth = monthQuery || getLocalDateString(new Date(), settings.timezone).slice(0, 7);
    const [year, month] = targetMonth.split('-').map((v) => parseInt(v, 10));

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const records = storage.getAttendanceRecords();
    const todayStr = getLocalDateString(new Date(), settings.timezone);

    const summaries: CalendarDaySummary[] = [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayDate = combineDateAndTime(dateStr, '12:00', settings.timezone);
      const weekday = new Intl.DateTimeFormat('en-US', { timeZone: settings.timezone, weekday: 'short' }).format(dayDate);
      const isWorkDay = isWorkingDay(dayDate, settings.workingDays, settings.timezone);

      const record = records.find((r) => r.date === dateStr);

      if (!record) {
        if (!isWorkDay) {
          summaries.push({
            date: dateStr,
            day,
            weekday,
            status: 'WEEKEND',
            balanceMinutes: 0,
            deltaStr: 'Off',
            inTime: null,
            outTime: null,
            productiveTime: null,
            progressPercent: 0,
          });
        } else if (dateStr > todayStr) {
          summaries.push({
            date: dateStr,
            day,
            weekday,
            status: 'FUTURE',
            balanceMinutes: 0,
            deltaStr: 'Sched',
            inTime: null,
            outTime: null,
            productiveTime: null,
            progressPercent: 0,
          });
        } else {
          summaries.push({
            date: dateStr,
            day,
            weekday,
            status: 'BALANCED',
            balanceMinutes: 0,
            deltaStr: '0m',
            inTime: null,
            outTime: null,
            productiveTime: null,
            progressPercent: 0,
          });
        }
        continue;
      }

      // Record exists
      const inTime = getLocalTimeString(new Date(record.clockIn), settings.timezone);
      const outTime = record.clockOut ? getLocalTimeString(new Date(record.clockOut), settings.timezone) : '--:--';
      const productiveTime = formatMinutesToHours(record.productiveMinutes);
      const progressPercent = Math.min(100, Math.round((record.productiveMinutes / record.requiredProductiveMinutes) * 100));

      let status: CalendarDaySummary['status'] = 'BALANCED';
      let deltaStr = '0m';

      if (record.status === 'WORKING') {
        status = 'WORKING';
        deltaStr = 'Live';
      } else if (record.status === 'MISSING_CLOCK_OUT') {
        status = 'MISSING';
        deltaStr = '⚠️ Incomplete';
      } else if (record.dailyBalanceMinutes > 0) {
        status = 'EXTRA';
        deltaStr = `+${record.dailyBalanceMinutes}m`;
      } else if (record.dailyBalanceMinutes < 0) {
        status = 'DEFICIT';
        deltaStr = `${record.dailyBalanceMinutes}m`;
      }

      summaries.push({
        date: dateStr,
        day,
        weekday,
        status,
        balanceMinutes: record.dailyBalanceMinutes,
        deltaStr,
        inTime,
        outTime,
        productiveTime,
        progressPercent,
      });
    }

    return summaries;
  }

  /**
   * Export CSV representation of attendance history (GET /api/export/csv).
   * Implements Section 35 of specification.
   */
  public exportCsv(): string {
    const records = storage.getAttendanceRecords();
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

    const headers = [
      'Date',
      'Clock In',
      'Clock Out',
      'Office Minutes',
      'Lunch Minutes',
      'Buffer Minutes',
      'Productive Minutes',
      'Required Minutes',
      'Daily Balance',
      'Cumulative Balance',
      'Status',
      'Notes',
    ];

    const rows = sorted.map((r) => [
      r.date,
      r.clockIn,
      r.clockOut || 'IN_PROGRESS',
      r.officeMinutes,
      r.lunchMinutes,
      r.bufferMinutes,
      r.productiveMinutes,
      r.requiredProductiveMinutes,
      r.dailyBalanceMinutes,
      r.cumulativeBalanceMinutes ?? 0,
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

export const attendanceService = new AttendanceService();
