import fs from 'fs';
import path from 'path';
import { Settings, User, AttendanceRecord, BalanceState } from './types';
import { recalculateCumulativeBalances } from './attendanceCalculator';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USER_FILE = path.join(DATA_DIR, 'user.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const BALANCE_FILE = path.join(DATA_DIR, 'balance.json');

export const DEFAULT_SETTINGS: Settings = {
  workStartTime: '10:00',
  workEndTime: '19:00',
  lunchMinutes: 60,
  bufferMinutes: 15,
  requiredProductiveMinutes: 465, // 540 - 60 - 15 = 465 min (7h 45m)
  workingDays: [1, 2, 3, 4, 5],
  timezone: 'Asia/Kolkata',
};

// Seed baseline attendance records from Stitch project (Sep & Oct 2026)
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

export class StorageService {
  constructor() {
    this.ensureDirectories();
    this.initializeDefaults();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  /**
   * Safe Atomic File Write: writes to `.tmp` file first, then atomically renames.
   */
  private atomicWriteJson<T>(filePath: string, data: T): void {
    const tmpPath = `${filePath}.tmp.${Date.now()}`;
    const jsonString = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(tmpPath, jsonString, 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (fs.existsSync(tmpPath)) {
        try {
          fs.unlinkSync(tmpPath);
        } catch {}
      }
      throw err;
    }
  }

  private readJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        this.atomicWriteJson(filePath, fallback);
        return fallback;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Error reading ${filePath}, falling back to defaults`, err);
      return fallback;
    }
  }

  public createBackup(label: string = 'manual'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(BACKUPS_DIR, `${label}-${timestamp}`);
    fs.mkdirSync(backupFolder, { recursive: true });

    if (fs.existsSync(SETTINGS_FILE)) fs.copyFileSync(SETTINGS_FILE, path.join(backupFolder, 'settings.json'));
    if (fs.existsSync(USER_FILE)) fs.copyFileSync(USER_FILE, path.join(backupFolder, 'user.json'));
    if (fs.existsSync(ATTENDANCE_FILE)) fs.copyFileSync(ATTENDANCE_FILE, path.join(backupFolder, 'attendance.json'));
    if (fs.existsSync(BALANCE_FILE)) fs.copyFileSync(BALANCE_FILE, path.join(backupFolder, 'balance.json'));

    return backupFolder;
  }

  public initializeDefaults() {
    if (!fs.existsSync(SETTINGS_FILE)) {
      this.atomicWriteJson(SETTINGS_FILE, DEFAULT_SETTINGS);
    }
    if (!fs.existsSync(ATTENDANCE_FILE)) {
      const { records, finalCumulativeBalance } = recalculateCumulativeBalances(SEED_ATTENDANCE_RECORDS);
      this.atomicWriteJson(ATTENDANCE_FILE, records);
      this.atomicWriteJson<BalanceState>(BALANCE_FILE, {
        cumulativeBalanceMinutes: finalCumulativeBalance,
        lastCalculatedAt: new Date().toISOString(),
        totalCompletedDays: records.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED').length,
      });
    }
  }

  // --- Settings ---
  public getSettings(): Settings {
    return this.readJson<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  }

  public saveSettings(newSettings: Partial<Settings>): Settings {
    this.createBackup('before-settings-update');
    const current = this.getSettings();
    const updated: Settings = { ...current, ...newSettings };
    this.atomicWriteJson(SETTINGS_FILE, updated);
    return updated;
  }

  // --- User ---
  public getUser(): User | null {
    if (!fs.existsSync(USER_FILE)) return null;
    return this.readJson<User | null>(USER_FILE, null);
  }

  public saveUser(user: User): User {
    this.atomicWriteJson(USER_FILE, user);
    return user;
  }

  // --- Attendance ---
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.readJson<AttendanceRecord[]>(ATTENDANCE_FILE, []);
  }

  public saveAttendanceRecords(records: AttendanceRecord[]): {
    records: AttendanceRecord[];
    balanceState: BalanceState;
  } {
    const { records: recalculated, finalCumulativeBalance } = recalculateCumulativeBalances(records);
    this.atomicWriteJson(ATTENDANCE_FILE, recalculated);

    const balanceState: BalanceState = {
      cumulativeBalanceMinutes: finalCumulativeBalance,
      lastCalculatedAt: new Date().toISOString(),
      totalCompletedDays: recalculated.filter((r) => r.status === 'COMPLETED' || r.status === 'CORRECTED').length,
    };
    this.atomicWriteJson(BALANCE_FILE, balanceState);

    return { records: recalculated, balanceState };
  }

  // --- Balance ---
  public getBalanceState(): BalanceState {
    return this.readJson<BalanceState>(BALANCE_FILE, {
      cumulativeBalanceMinutes: 0,
      lastCalculatedAt: new Date().toISOString(),
      totalCompletedDays: 0,
    });
  }
}

export const storage = new StorageService();
