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
      // Fresh install: start with clean empty array (no hardcoded demo data)
      records = [];
      await this.setJson(ATTENDANCE_KEY, records);
      await this.setJson<BalanceState>(BALANCE_KEY, {
        cumulativeBalanceMinutes: 0,
        lastCalculatedAt: new Date().toISOString(),
        totalCompletedDays: 0,
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
