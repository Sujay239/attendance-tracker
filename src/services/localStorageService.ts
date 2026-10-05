import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, User, AttendanceRecord, BalanceState } from './types';
import { recalculateCumulativeBalances } from './attendanceCalculator';

const SETTINGS_KEY = '@att_tracker_settings_v1';
const USER_KEY = '@att_tracker_user_v1';
const ATTENDANCE_KEY = '@att_tracker_records_v1';
const BALANCE_KEY = '@att_tracker_balance_v1';
const BACKUPS_KEY = '@att_tracker_backups_v1';

export const DEFAULT_SETTINGS: Settings = {
  workStartTime: '10:00',
  workEndTime: '19:00',
  lunchMinutes: 60,
  bufferMinutes: 15,
  requiredProductiveMinutes: 465, // 540 - 60 - 15 = 465 min (7h 45m)
  workingDays: [1, 2, 3, 4, 5],
  timezone: 'Asia/Kolkata',
};

// Seed baseline attendance records from project specification (Sep & Oct 2026)
const SEED_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: '2026-09-26',
    date: '2026-09-26',
    clockIn: '2026-09-26T10:12:00+05:30',
    clockOut: null,
    officialStart: '10:00',
    officialEnd: '19:00',
    lunchMinutes: 60,
    bufferMinutes: 15,
    officeMinutes: 0,
    productiveMinutes: 0,
    requiredProductiveMinutes: 465,
    dailyBalanceMinutes: 0,
    earlyMinutes: 0,
    lateMinutes: 12,
    status: 'MISSING_CLOCK_OUT',
    notes: 'Clock-out was not registered on Friday.',
    createdAt: '2026-09-26T10:12:00+05:30',
    updatedAt: '2026-09-26T10:12:00+05:30',
  },
  {
    id: '2026-09-29',
    date: '2026-09-29',
    clockIn: '2026-09-29T09:45:00+05:30',
    clockOut: '2026-09-29T19:30:00+05:30',
    officialStart: '10:00',
    officialEnd: '19:00',
    lunchMinutes: 60,
    bufferMinutes: 15,
    officeMinutes: 585,
    productiveMinutes: 510,
    requiredProductiveMinutes: 465,
    dailyBalanceMinutes: 45,
    earlyMinutes: 15,
    lateMinutes: 0,
    status: 'COMPLETED',
    notes: 'Sprint planning and deployment wrap-up.',
    createdAt: '2026-09-29T09:45:00+05:30',
    updatedAt: '2026-09-29T19:30:00+05:30',
  },
  {
    id: '2026-09-30',
    date: '2026-09-30',
    clockIn: '2026-09-30T10:00:00+05:30',
    clockOut: '2026-09-30T19:00:00+05:30',
    officialStart: '10:00',
    officialEnd: '19:00',
    lunchMinutes: 60,
    bufferMinutes: 15,
    officeMinutes: 540,
    productiveMinutes: 465,
    requiredProductiveMinutes: 465,
    dailyBalanceMinutes: 0,
    earlyMinutes: 0,
    lateMinutes: 0,
    status: 'COMPLETED',
    notes: 'Standard shift.',
    createdAt: '2026-09-30T10:00:00+05:30',
    updatedAt: '2026-09-30T19:00:00+05:30',
  },
  {
    id: '2026-10-01',
    date: '2026-10-01',
    clockIn: '2026-10-01T10:20:00+05:30',
    clockOut: '2026-10-01T19:00:00+05:30',
    officialStart: '10:00',
    officialEnd: '19:00',
    lunchMinutes: 60,
    bufferMinutes: 15,
    officeMinutes: 520,
    productiveMinutes: 445,
    requiredProductiveMinutes: 465,
    dailyBalanceMinutes: -20,
    earlyMinutes: 0,
    lateMinutes: 20,
    status: 'COMPLETED',
    notes: 'Transit delay.',
    createdAt: '2026-10-01T10:20:00+05:30',
    updatedAt: '2026-10-01T19:00:00+05:30',
  },
  {
    id: '2026-10-02',
    date: '2026-10-02',
    clockIn: '2026-10-02T09:50:00+05:30',
    clockOut: '2026-10-02T19:00:00+05:30',
    officialStart: '10:00',
    officialEnd: '19:00',
    lunchMinutes: 60,
    bufferMinutes: 15,
    officeMinutes: 550,
    productiveMinutes: 475,
    requiredProductiveMinutes: 465,
    dailyBalanceMinutes: 10,
    earlyMinutes: 10,
    lateMinutes: 0,
    status: 'COMPLETED',
    notes: 'Early arrival +10m credit.',
    createdAt: '2026-10-02T09:50:00+05:30',
    updatedAt: '2026-10-02T19:00:00+05:30',
  },
];

export class LocalStorageService {
  private inMemoryCache: {
    settings?: Settings;
    records?: AttendanceRecord[];
    balance?: BalanceState;
    user?: User | null;
  } = {};

  // --- Helper JSON Storage in Mobile Internal Memory ---
  private async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[LocalStorage] Failed to read ${key}:`, err);
      return null;
    }
  }

  private async setJson<T>(key: string, data: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonString);
    } catch (err) {
      console.warn(`[LocalStorage] Failed to save ${key}:`, err);
      throw err;
    }
  }

  // --- Settings ---
  public async getSettings(): Promise<Settings> {
    if (this.inMemoryCache.settings) {
      return this.inMemoryCache.settings;
    }
    let settings = await this.getJson<Settings>(SETTINGS_KEY);
    if (!settings) {
      settings = DEFAULT_SETTINGS;
      await this.setJson(SETTINGS_KEY, settings);
    }
    this.inMemoryCache.settings = settings;
    return settings;
  }

  public async saveSettings(newSettings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated: Settings = { ...current, ...newSettings };
    await this.setJson(SETTINGS_KEY, updated);
    this.inMemoryCache.settings = updated;
    return updated;
  }

  // --- User Profile & Auth ---
  public async getUser(): Promise<User | null> {
    if (this.inMemoryCache.user !== undefined) {
      return this.inMemoryCache.user;
    }
    const user = await this.getJson<User | null>(USER_KEY);
    this.inMemoryCache.user = user;
    return user;
  }

  public async saveUser(user: User | null): Promise<User | null> {
    if (user === null) {
      await AsyncStorage.removeItem(USER_KEY);
      this.inMemoryCache.user = null;
      return null;
    }
    await this.setJson(USER_KEY, user);
    this.inMemoryCache.user = user;
    return user;
  }

  // --- Attendance Records ---
  public async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (this.inMemoryCache.records) {
      return this.inMemoryCache.records;
    }
    let records = await this.getJson<AttendanceRecord[]>(ATTENDANCE_KEY);
    if (!records) {
      // First install initialization with seed data
      const recalculated = recalculateCumulativeBalances(SEED_ATTENDANCE_RECORDS);
      records = recalculated.records;
      await this.setJson(ATTENDANCE_KEY, records);
      await this.setJson<BalanceState>(BALANCE_KEY, {
        cumulativeBalanceMinutes: recalculated.finalCumulativeBalance,
        lastCalculatedAt: new Date().toISOString(),
        totalCompletedDays: records.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED').length,
      });
    }
    this.inMemoryCache.records = records;
    return records;
  }

  public async saveAttendanceRecords(records: AttendanceRecord[]): Promise<{
    records: AttendanceRecord[];
    balanceState: BalanceState;
  }> {
    const { records: recalculated, finalCumulativeBalance } = recalculateCumulativeBalances(records);
    await this.setJson(ATTENDANCE_KEY, recalculated);

    const balanceState: BalanceState = {
      cumulativeBalanceMinutes: finalCumulativeBalance,
      lastCalculatedAt: new Date().toISOString(),
      totalCompletedDays: recalculated.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED').length,
    };
    await this.setJson(BALANCE_KEY, balanceState);

    this.inMemoryCache.records = recalculated;
    this.inMemoryCache.balance = balanceState;

    return { records: recalculated, balanceState };
  }

  public async deleteAttendanceRecord(idOrDate: string): Promise<{
    records: AttendanceRecord[];
    balanceState: BalanceState;
  }> {
    const records = await this.getAttendanceRecords();
    const filtered = records.filter((r) => r.id !== idOrDate && r.date !== idOrDate);
    return this.saveAttendanceRecords(filtered);
  }

  // --- Balance State ---
  public async getBalanceState(): Promise<BalanceState> {
    if (this.inMemoryCache.balance) {
      return this.inMemoryCache.balance;
    }
    let balance = await this.getJson<BalanceState>(BALANCE_KEY);
    if (!balance) {
      const records = await this.getAttendanceRecords();
      const { finalCumulativeBalance } = recalculateCumulativeBalances(records);
      balance = {
        cumulativeBalanceMinutes: finalCumulativeBalance,
        lastCalculatedAt: new Date().toISOString(),
        totalCompletedDays: records.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED').length,
      };
      await this.setJson(BALANCE_KEY, balance);
    }
    this.inMemoryCache.balance = balance;
    return balance;
  }

  // --- Backups & Snapshots ---
  public async createBackup(label: string = 'manual'): Promise<{ backupId: string; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const backupId = `${label}_${timestamp.replace(/[:.]/g, '-')}`;

    const [settings, user, records, balance] = await Promise.all([
      this.getSettings(),
      this.getUser(),
      this.getAttendanceRecords(),
      this.getBalanceState(),
    ]);

    const backupSnapshot = {
      backupId,
      timestamp,
      data: {
        settings,
        user,
        records,
        balance,
      },
    };

    const existingBackups = (await this.getJson<any[]>(BACKUPS_KEY)) || [];
    existingBackups.unshift(backupSnapshot);
    // keep latest 10 backups
    if (existingBackups.length > 10) existingBackups.length = 10;
    await this.setJson(BACKUPS_KEY, existingBackups);

    return { backupId, timestamp };
  }

  public async getBackups(): Promise<any[]> {
    return (await this.getJson<any[]>(BACKUPS_KEY)) || [];
  }

  // --- Clear / Reset All Data ---
  public async clearAllData(): Promise<void> {
    this.inMemoryCache = {};
    await AsyncStorage.multiRemove([
      SETTINGS_KEY,
      USER_KEY,
      ATTENDANCE_KEY,
      BALANCE_KEY,
      BACKUPS_KEY,
    ]);
  }
}

export const localStorage = new LocalStorageService();
