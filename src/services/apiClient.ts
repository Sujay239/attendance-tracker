import { localAuth } from './localAuthService';
import { localAttendance } from './localAttendanceService';
import { localAnalytics } from './localAnalyticsService';
import { localStorage } from './localStorageService';
import { Settings, DashboardResponse, AttendanceRecord, CalendarDaySummary, AnalyticsSummary } from './types';

/**
 * Local Offline-First Storage API Client.
 * Replaces external HTTP server with 100% device internal memory storage (AsyncStorage JSON).
 * All data is stored in the device's private sandbox memory and wiped if the app is uninstalled.
 */
class ApiClient {
  // --- Auth & Profile ---
  public async getAuthStatus(): Promise<{ initialized: boolean; user: any }> {
    const initialized = await localAuth.isInitialized();
    const user = await localAuth.getCurrentUser();
    return { initialized, user };
  }

  public async setupAccount(
    name: string,
    email: string,
    password: string,
    avatar?: string,
    shiftSettings?: Partial<Settings>
  ): Promise<any> {
    return localAuth.setupAccount(name, email, password, avatar, shiftSettings);
  }

  public async login(password: string): Promise<any> {
    return localAuth.login(password);
  }

  public async logout(): Promise<void> {
    await localAuth.logout();
  }

  public async checkSession(): Promise<{ authenticated: boolean; user: any }> {
    const authenticated = await localAuth.validateSession();
    const user = authenticated ? await localAuth.getCurrentUser() : null;
    return { authenticated, user };
  }

  // --- Dashboard ---
  public async getDashboard(): Promise<DashboardResponse> {
    return localAttendance.getDashboardData();
  }

  // --- Attendance ---
  public async clockIn(notes: string = ''): Promise<{
    attendance: AttendanceRecord;
    lateMinutes: number;
    earlyMinutes: number;
    status: string;
  }> {
    return localAttendance.clockIn(notes);
  }

  public async clockOut(notes: string = ''): Promise<any> {
    return localAttendance.clockOut(notes);
  }

  public async submitAdjustment(
    date: string,
    inTime: string,
    outTime: string,
    reason: string = 'Manual Adjustment',
    notes: string = ''
  ): Promise<AttendanceRecord> {
    if (!date || !inTime || !outTime) {
      throw new Error('Date, in-time, and out-time are required.');
    }
    return localAttendance.correctRecord(date, inTime, outTime, reason, notes);
  }

  public async getAttendance(params?: { month?: string; status?: string }): Promise<AttendanceRecord[]> {
    return localAttendance.getAttendance(params);
  }

  public async getCalendar(month?: string): Promise<CalendarDaySummary[]> {
    return localAttendance.getCalendarData(month);
  }

  public async deleteAttendance(idOrDate: string): Promise<void> {
    return localAttendance.deleteRecord(idOrDate);
  }

  // --- Analytics ---
  public async getAnalytics(period: string = 'month'): Promise<AnalyticsSummary> {
    return localAnalytics.getAnalyticsSummary(period);
  }

  // --- Settings ---
  public async getSettings(): Promise<Settings> {
    return localStorage.getSettings();
  }

  public async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return localStorage.saveSettings(settings);
  }

  // --- Export & Backups ---
  public async exportCsv(): Promise<string> {
    return localAttendance.exportCsv();
  }

  public async createBackup(label: string = 'manual'): Promise<{ backupId: string; timestamp: string }> {
    return localStorage.createBackup(label);
  }

  public async clearAllData(): Promise<void> {
    return localStorage.clearAllData();
  }
}

export const api = new ApiClient();
