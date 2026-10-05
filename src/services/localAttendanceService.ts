import { localStorage } from './localStorageService';
import { AttendanceRecord, DashboardResponse, CalendarDaySummary } from './types';
import {
  getLocalDateString,
  getLocalTimeString,
  combineDateAndTime,
  isWorkingDay,
  formatMinutesToHours,
} from './timeUtils';
import { calculateAttendance } from './attendanceCalculator';

export class LocalAttendanceService {
  /**
   * Check and flag any unclosed shifts from prior days as MISSING_CLOCK_OUT.
   */
  public async checkAndFlagMissingClockOuts(): Promise<AttendanceRecord[]> {
    const settings = await localStorage.getSettings();
    const todayStr = getLocalDateString(new Date(), settings.timezone);
    const records = await localStorage.getAttendanceRecords();

    let modified = false;
    for (const r of records) {
      if (r.date < todayStr && r.status === 'WORKING') {
        r.status = 'MISSING_CLOCK_OUT';
        r.updatedAt = new Date().toISOString();
        modified = true;
      }
    }

    if (modified) {
      await localStorage.saveAttendanceRecords(records);
    }

    return records.filter((r) => r.status === 'MISSING_CLOCK_OUT');
  }

  /**
   * Clock-in handler (stores in mobile internal memory).
   */
  public async clockIn(notes: string = ''): Promise<{
    attendance: AttendanceRecord;
    lateMinutes: number;
    earlyMinutes: number;
    status: string;
  }> {
    await this.checkAndFlagMissingClockOuts();

    const settings = await localStorage.getSettings();
    const now = new Date();
    const todayStr = getLocalDateString(now, settings.timezone);
    const records = await localStorage.getAttendanceRecords();

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
    await localStorage.saveAttendanceRecords(records);

    return {
      attendance: {
        ...newRecord,
        clockInTime: getLocalTimeString(now, settings.timezone),
      },
      lateMinutes: calc.lateMinutes,
      earlyMinutes: calc.earlyMinutes,
      status: 'WORKING',
    };
  }

  /**
   * Clock-out handler (calculates and updates internal storage).
   */
  public async clockOut(notes?: string): Promise<any> {
    const settings = await localStorage.getSettings();
    const now = new Date();
    const records = await localStorage.getAttendanceRecords();

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
    const { records: updatedRecords } = await localStorage.saveAttendanceRecords(records);
    const saved = updatedRecords.find((r) => r.id === active.id) || active;

    const returnRecord = {
      ...saved,
      clockOutTime: getLocalTimeString(now, settings.timezone),
    };

    return {
      ...returnRecord,
      attendance: returnRecord,
      status: 'COMPLETED',
    };
  }

  /**
   * Historical record correction / missing clock-out correction.
   */
  public async correctRecord(
    dateStr: string,
    clockInTimeStr: string,
    clockOutTimeStr: string,
    reason: string = 'Manual Adjustment',
    notes: string = ''
  ): Promise<AttendanceRecord> {
    const settings = await localStorage.getSettings();
    const records = await localStorage.getAttendanceRecords();

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
    await localStorage.saveAttendanceRecords(records);
    return existing;
  }

  /**
   * Delete record from mobile internal storage and recalculate balance chain.
   */
  public async deleteRecord(idOrDate: string): Promise<void> {
    await localStorage.deleteAttendanceRecord(idOrDate);
  }

  /**
   * Get unified Dashboard state.
   */
  public async getDashboardData(): Promise<DashboardResponse> {
    const settings = await localStorage.getSettings();
    const now = new Date();
    const todayStr = getLocalDateString(now, settings.timezone);
    const currentTime = getLocalTimeString(now, settings.timezone);

    const missingClockOuts = await this.checkAndFlagMissingClockOuts();
    const records = await localStorage.getAttendanceRecords();
    const balanceState = await localStorage.getBalanceState();

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
   * Calendar Data summary for a month.
   */
  public async getCalendarData(monthQuery?: string): Promise<CalendarDaySummary[]> {
    const settings = await localStorage.getSettings();
    const targetMonth = monthQuery || getLocalDateString(new Date(), settings.timezone).slice(0, 7);
    const [year, month] = targetMonth.split('-').map((v) => parseInt(v, 10));

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const records = await localStorage.getAttendanceRecords();
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
   * Filtered attendance list.
   */
  public async getAttendance(params?: { month?: string; status?: string }): Promise<AttendanceRecord[]> {
    let records = await localStorage.getAttendanceRecords();

    if (params?.month && typeof params.month === 'string') {
      records = records.filter((r) => r.date.startsWith(params.month!));
    }

    if (params?.status && typeof params.status === 'string' && params.status !== 'all') {
      records = records.filter((r) => r.status.toLowerCase() === params.status!.toLowerCase());
    }

    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Export CSV representation of attendance history.
   */
  public async exportCsv(): Promise<string> {
    const records = await localStorage.getAttendanceRecords();
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

export const localAttendance = new LocalAttendanceService();
