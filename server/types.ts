export type AttendanceStatus =
  | 'NOT_STARTED'
  | 'WORKING'
  | 'COMPLETED'
  | 'MISSING_CLOCK_OUT'
  | 'CORRECTED';

export type BalanceStatus = 'POSITIVE' | 'NEGATIVE' | 'BALANCED';

export interface Settings {
  workStartTime: string; // e.g. "10:00"
  workEndTime: string;   // e.g. "19:00"
  lunchMinutes: number;  // default 60
  bufferMinutes: number; // default 15
  requiredProductiveMinutes: number; // default 465 (7h 45m)
  workingDays: number[]; // [1, 2, 3, 4, 5] (Mon=1 ... Sun=7 or 0=Sun, 1=Mon)
  timezone: string;      // default "Asia/Kolkata"
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AttendanceRecord {
  id: string;             // YYYY-MM-DD
  date: string;           // YYYY-MM-DD
  clockIn: string;        // ISO timestamp
  clockOut: string | null;// ISO timestamp or null if WORKING
  officialStart: string;  // e.g. "10:00"
  officialEnd: string;    // e.g. "19:00"
  lunchMinutes: number;   // from settings at time of shift
  bufferMinutes: number;  // from settings at time of shift
  officeMinutes: number;  // total office time
  productiveMinutes: number; // officeMinutes - lunch - buffer
  requiredProductiveMinutes: number; // default 465
  dailyBalanceMinutes: number; // productiveMinutes - requiredProductiveMinutes
  cumulativeBalanceMinutes?: number; // chain balance
  earlyMinutes: number;   // minutes early before officialStart
  lateMinutes: number;    // minutes late after officialStart
  status: AttendanceStatus;
  notes: string;
  reasonCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceState {
  cumulativeBalanceMinutes: number;
  lastCalculatedAt: string;
  totalCompletedDays: number;
}

export interface DashboardResponse {
  date: string;
  currentTime: string;
  attendanceStatus: AttendanceStatus;
  isClockedIn: boolean;
  clockIn: string | null;
  clockOut: string | null;
  officeMinutes: number;
  productiveMinutes: number;
  requiredMinutes: number;
  remainingMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  dailyBalanceMinutes: number | null;
  cumulativeBalanceMinutes: number;
  expectedEnd: string;
  suggestedCompletionTime: string;
  progressPercent: number;
  todayRecord: AttendanceRecord | null;
  recentRecords: AttendanceRecord[];
  missingClockOuts: AttendanceRecord[];
}

export interface CalendarDaySummary {
  date: string;
  day: number;
  weekday: string;
  status: 'EXTRA' | 'DEFICIT' | 'BALANCED' | 'WORKING' | 'MISSING' | 'WEEKEND' | 'FUTURE';
  balanceMinutes: number;
  deltaStr: string;
  inTime: string | null;
  outTime: string | null;
  productiveTime: string | null;
  progressPercent: number;
}

export interface AnalyticsSummary {
  totalWorkingDays: number;
  totalProductiveMinutes: number;
  totalRequiredMinutes: number;
  totalExtraMinutes: number;
  totalDeficitMinutes: number;
  netBalanceMinutes: number;
  averageProductiveMinutes: number;
  onTimeDays: number;
  earlyDays: number;
  lateDays: number;
  missingClockOuts: number;
  attendanceRatePercent: number;
  weeklyBars: {
    day: string;
    date: string;
    hours: string;
    minutes: number;
    delta: string;
    deltaMinutes: number;
    heightPercent: number;
    status: 'EXTRA' | 'DEFICIT' | 'BALANCED';
  }[];
  trendPoints: {
    date: string;
    dailyBalance: number;
    cumulativeBalance: number;
  }[];
  cadence: {
    earlyOnTime: { days: number; percent: number };
    lateRecovered: { days: number; percent: number };
    pendingAdjustment: { days: number; percent: number };
  };
  managerSnippet: string;
}
