export interface CalendarDay {
  day: number;
  weekday: string;
  dateStr: string;
  status: 'extra' | 'deficit' | 'balanced' | 'active' | 'warning' | 'weekend' | 'future' | 'offset';
  delta?: string;
  inTime?: string;
  outTime?: string;
  worked?: string;
  progressPercent?: number;
}

export interface AttendanceRecord {
  id: string;
  dateStr: string;
  dayLabel: string;
  weekday: string;
  isToday?: boolean;
  status: 'active' | 'extra' | 'deficit' | 'balanced' | 'missing';
  statusLabel: string;
  statusBadgeColor: string;
  inTime: string;
  outTime: string;
  officeDuration: string;
  productiveDuration: string;
  deltaStr: string;
  notes?: string;
  isLate?: boolean;
  lateDelta?: string;
  timeline?: {
    time: string;
    title: string;
    desc: string;
    type: 'in' | 'window' | 'lunch' | 'buffer' | 'out';
    badge?: string;
  }[];
  breakdown?: {
    grossTime: string;
    deductions: string;
    netProductive: string;
    requiredTarget: string;
    dayBalance: string;
    cumulativeBalance: string;
  };
}

export const INITIAL_USER = {
  name: 'Sarah Jenkins',
  title: 'Senior Product Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  appName: 'Attendance & Time Balance Tracker',
  author: 'sujay kumar kotal',
  department: 'Core Infrastructure',
  employeeId: 'EMP-88421',
  officeLocation: 'San Francisco Campus, Building B',
  isClockedIn: true,
  clockInTime: '10:08 AM',
  standardWindowStart: '10:00 AM',
  standardWindowEnd: '07:00 PM',
  dailyGoalHours: 7.75, // 7h 45m
  dailyGoalStr: '7h 45m',
  targetWrapTime: '5:53 PM',
  lunchDuration: '1h 00m',
  bufferAllowance: '15m',
};

export const INITIAL_CALENDAR_DAYS: CalendarDay[] = [
  // Sept offsets (28, 29, 30)
  { day: 28, weekday: 'Mon', dateStr: 'Sep 28', status: 'offset' },
  { day: 29, weekday: 'Tue', dateStr: 'Sep 29', status: 'offset' },
  { day: 30, weekday: 'Wed', dateStr: 'Sep 30', status: 'offset' },

  // Oct 1 - 31
  { day: 1, weekday: 'Thu', dateStr: 'Oct 1', status: 'extra', delta: '+15m', inTime: '09:00 AM', outTime: '05:15 PM', worked: '8h 00m', progressPercent: 100 },
  { day: 2, weekday: 'Fri', dateStr: 'Oct 2', status: 'balanced', delta: '0m', inTime: '09:05 AM', outTime: '05:05 PM', worked: '7h 45m', progressPercent: 100 },
  { day: 3, weekday: 'Sat', dateStr: 'Oct 3', status: 'weekend' },
  { day: 4, weekday: 'Sun', dateStr: 'Oct 4', status: 'weekend' },
  { day: 5, weekday: 'Mon', dateStr: 'Oct 5', status: 'extra', delta: '+10m', inTime: '08:55 AM', outTime: '05:05 PM', worked: '7h 55m', progressPercent: 100 },
  { day: 6, weekday: 'Tue', dateStr: 'Oct 6', status: 'deficit', delta: '-20m', inTime: '09:20 AM', outTime: '05:00 PM', worked: '7h 25m', progressPercent: 75 },
  { day: 7, weekday: 'Wed', dateStr: 'Oct 7', status: 'extra', delta: '+45m', inTime: '08:45 AM', outTime: '05:30 PM', worked: '8h 30m', progressPercent: 100 },
  { day: 8, weekday: 'Thu', dateStr: 'Oct 8', status: 'balanced', delta: '0m', inTime: '09:00 AM', outTime: '05:00 PM', worked: '7h 45m', progressPercent: 100 },
  { day: 9, weekday: 'Fri', dateStr: 'Oct 9', status: 'deficit', delta: '-15m', inTime: '09:15 AM', outTime: '05:00 PM', worked: '7h 30m', progressPercent: 80 },
  { day: 10, weekday: 'Sat', dateStr: 'Oct 10', status: 'weekend' },
  { day: 11, weekday: 'Sun', dateStr: 'Oct 11', status: 'weekend' },
  { day: 12, weekday: 'Mon', dateStr: 'Oct 12', status: 'extra', delta: '+20m', inTime: '08:50 AM', outTime: '05:10 PM', worked: '8h 05m', progressPercent: 100 },
  { day: 13, weekday: 'Tue', dateStr: 'Oct 13', status: 'balanced', delta: '0m', inTime: '09:00 AM', outTime: '05:00 PM', worked: '7h 45m', progressPercent: 100 },
  { day: 14, weekday: 'Wed', dateStr: 'Oct 14', status: 'deficit', delta: '-10m', inTime: '09:10 AM', outTime: '05:00 PM', worked: '7h 35m', progressPercent: 85 },
  { day: 15, weekday: 'Thu', dateStr: 'Oct 15', status: 'extra', delta: '+30m', inTime: '08:45 AM', outTime: '05:15 PM', worked: '8h 15m', progressPercent: 100 },
  { day: 16, weekday: 'Fri', dateStr: 'Oct 16', status: 'balanced', delta: '0m', inTime: '09:00 AM', outTime: '05:00 PM', worked: '7h 45m', progressPercent: 100 },
  { day: 17, weekday: 'Sat', dateStr: 'Oct 17', status: 'weekend' },
  { day: 18, weekday: 'Sun', dateStr: 'Oct 18', status: 'weekend' },
  { day: 19, weekday: 'Mon', dateStr: 'Oct 19', status: 'extra', delta: '+15m', inTime: '08:50 AM', outTime: '05:05 PM', worked: '8h 00m', progressPercent: 100 },
  { day: 20, weekday: 'Tue', dateStr: 'Oct 20', status: 'extra', delta: '+25m', inTime: '08:40 AM', outTime: '05:05 PM', worked: '8h 10m', progressPercent: 100 },
  { day: 21, weekday: 'Wed', dateStr: 'Oct 21', status: 'deficit', delta: '-15m', inTime: '09:15 AM', outTime: '05:00 PM', worked: '7h 30m', progressPercent: 80 },
  { day: 22, weekday: 'Thu', dateStr: 'Oct 22', status: 'balanced', delta: '0m', inTime: '09:00 AM', outTime: '05:00 PM', worked: '7h 45m', progressPercent: 100 },
  { day: 23, weekday: 'Fri', dateStr: 'Oct 23', status: 'active', delta: '+14m', inTime: '10:08 AM', outTime: '--:--', worked: '6h 24m', progressPercent: 82.5 },
  { day: 24, weekday: 'Sat', dateStr: 'Oct 24', status: 'warning', delta: 'Missing', inTime: '09:30 AM', outTime: 'Missing', worked: 'Incomplete', progressPercent: 40 },
  { day: 25, weekday: 'Sun', dateStr: 'Oct 25', status: 'weekend' },
  { day: 26, weekday: 'Mon', dateStr: 'Oct 26', status: 'future' },
  { day: 27, weekday: 'Tue', dateStr: 'Oct 27', status: 'future' },
  { day: 28, weekday: 'Wed', dateStr: 'Oct 28', status: 'future' },
  { day: 29, weekday: 'Thu', dateStr: 'Oct 29', status: 'future' },
  { day: 30, weekday: 'Fri', dateStr: 'Oct 30', status: 'future' },
  { day: 31, weekday: 'Sat', dateStr: 'Oct 31', status: 'weekend' },

  // Nov offset (1)
  { day: 1, weekday: 'Sun', dateStr: 'Nov 1', status: 'offset' },
];

export const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec-1',
    dateStr: 'Oct 3',
    dayLabel: 'Today (Oct 3)',
    weekday: 'Friday',
    isToday: true,
    status: 'active',
    statusLabel: 'Currently Working',
    statusBadgeColor: '#004AC6',
    inTime: '10:08 AM',
    outTime: 'In Progress',
    officeDuration: '6h 24m',
    productiveDuration: '6h 24m',
    deltaStr: '+14m Projected',
    isLate: true,
    lateDelta: '8m Late (10:08 vs 10:00)',
    notes: 'In progress. Target wrap time: 5:53 PM.',
  },
  {
    id: 'rec-2',
    dateStr: 'Oct 2, 2026',
    dayLabel: 'Yesterday (Oct 2)',
    weekday: 'Thursday',
    status: 'extra',
    statusLabel: '+10 min Extra',
    statusBadgeColor: '#006C4A',
    inTime: '9:50 AM',
    outTime: '7:00 PM',
    officeDuration: '9h 10m',
    productiveDuration: '7h 55m',
    deltaStr: '+10 min',
    timeline: [
      { time: '9:50 AM', title: 'Clock In • Early Arrival', desc: '10m Early Start', type: 'in', badge: '+10m Credit' },
      { time: '10:00 AM', title: 'Official Shift Window Begins', desc: 'Scheduled standard opening', type: 'window', badge: 'Scheduled' },
      { time: '1:00 PM – 2:00 PM', title: 'Mandatory Lunch Pause', desc: '60 min automatic deduction', type: 'lunch', badge: '−1h 00m' },
      { time: 'Comfort Allowance', title: 'Daily Buffer Allowance', desc: 'Auto-applied comfort delta', type: 'buffer', badge: '−15m' },
      { time: '7:00 PM', title: 'Standard Departure Punch Out', desc: 'Completed standard full-day shift', type: 'out', badge: 'On Schedule' },
    ],
    breakdown: {
      grossTime: '9h 10m',
      deductions: '−1h 15m',
      netProductive: '7h 55m',
      requiredTarget: '7h 45m',
      dayBalance: '+10 min',
      cumulativeBalance: '+25 min',
    },
  },
  {
    id: 'rec-3',
    dateStr: 'Oct 1, 2026',
    dayLabel: 'Wednesday (Oct 1)',
    weekday: 'Wednesday',
    status: 'deficit',
    statusLabel: '−20 min Adjust',
    statusBadgeColor: '#AE0010',
    inTime: '10:20 AM',
    outTime: '7:00 PM',
    officeDuration: '8h 40m',
    productiveDuration: '7h 25m',
    deltaStr: '−20 min',
    isLate: true,
    lateDelta: 'Late arrival recorded (20 min)',
    notes: '20 min deficit due to transit delay. Deductions applied.',
  },
  {
    id: 'rec-4',
    dateStr: 'Sep 30, 2026',
    dayLabel: 'Tuesday (Sep 30)',
    weekday: 'Tuesday',
    status: 'balanced',
    statusLabel: 'Balanced (0m)',
    statusBadgeColor: '#737686',
    inTime: '10:00 AM',
    outTime: '7:00 PM',
    officeDuration: '9h 00m',
    productiveDuration: '7h 45m',
    deltaStr: '0m',
    notes: 'Exactly met required daily target of 7h 45m.',
  },
  {
    id: 'rec-5',
    dateStr: 'Sep 29, 2026',
    dayLabel: 'Monday (Sep 29)',
    weekday: 'Monday',
    status: 'extra',
    statusLabel: '+45 min Extra',
    statusBadgeColor: '#006C4A',
    inTime: '9:45 AM',
    outTime: '7:30 PM',
    officeDuration: '9h 45m',
    productiveDuration: '8h 30m',
    deltaStr: '+45 min',
    notes: 'Sprint planning and deployment wrap-up.',
  },
  {
    id: 'rec-6',
    dateStr: 'Sep 26, 2026',
    dayLabel: 'Friday (Sep 26)',
    weekday: 'Friday',
    status: 'missing',
    statusLabel: 'Missing Punch',
    statusBadgeColor: '#D52022',
    inTime: '10:12 AM',
    outTime: 'Unrecorded',
    officeDuration: '--',
    productiveDuration: 'Pending',
    deltaStr: 'Missing Out Punch',
    notes: 'Clock-out was not registered. Tap to correct.',
  },
];

export const ANALYTICS_DATA = {
  kpi: {
    statusBadge: 'Time Surplus Active',
    netCumulativeBalance: '+50',
    unit: 'min',
    cutoff: 'Cut-off: Oct 31',
    comparison: '+12% vs Sep',
    desc: 'Banked safely to compensatory ledger',
  },
  metrics: {
    totalHours: '171h 20m',
    totalHoursDelta: '+50m req.',
    dailyProd: '7h 47m',
    dailyTarget: 'Target: 7h 45m',
    onTimeRate: '91%',
    onTimeBadge: 'High Punctual',
  },
  weeklyBars: [
    { day: 'Mon', hours: '8h 30m', delta: '+45m', heightPercent: 100, isSurplus: true, color: '#006C4A', deltaColor: '#006C4A' },
    { day: 'Tue', hours: '7h 45m', delta: '0m', heightPercent: 82, isBalanced: true, color: '#C3C6D7', deltaColor: '#434655' },
    { day: 'Wed', hours: '7h 25m', delta: '−20m', heightPercent: 70, isDeficit: true, color: '#D52022', deltaColor: '#AE0010' },
    { day: 'Thu', hours: '7h 55m', delta: '+10m', heightPercent: 86, isSurplus: true, color: '#006C4A', deltaColor: '#006C4A' },
    { day: 'Fri', hours: '8h 05m', delta: '+20m', heightPercent: 92, isSurplus: true, color: '#006C4A', deltaColor: '#006C4A' },
  ],
  cadence: {
    earlyOnTime: { days: 16, percent: 73, label: 'Early / On-Time Shifts', color: '#006C4A' },
    lateRecovered: { days: 5, percent: 23, label: 'Late Arrival (Recovered)', sub: 'Zero deficit accrued', color: '#2563EB' },
    pendingAdjustment: { days: 1, percent: 4, label: 'Pending HR Adjustment', color: '#D52022' },
  },
  managerSnippet:
    'October 2026 Closeout: 171h 20m logged (100.5% adherence). Cumulative Time Bank: +50 mins extra. Punctuality rate 91%. Ready for payroll sign-off.',
};
