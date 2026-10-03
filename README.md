# Attendance & Time Balance Tracker

**Attendance & Time Balance Tracker** is a React Native & Expo mobile application built with TypeScript, SVG visualization, and Modern Tactile Minimalism. The application is faithfully implemented from the Google Stitch project: [https://stitch.withgoogle.com/projects/1921746099640358119](https://stitch.withgoogle.com/projects/1921746099640358119).

**Author:** `sujay kumar kotal`  
**Application Name:** `Attendance & Time Balance Tracker`  
**Platform Support:** iOS, Android, and Web

---

## 📱 Implemented Screens & Features

### 1. TimeTrack Dashboard (`src/screens/DashboardScreen.tsx`)
- **Live Telemetry & Greeting:** Live office wall clock updating each second, contextual weather/time greeting (*"Good afternoon, Sarah"*), and current date.
- **Smart Late Clock-In Pill Banner:** Real-time pulse indicator showing status (*"Currently Working • 8m Late (10:08 vs 10:00)"*) with interactive details info trigger.
- **Hero Productive Time Worked Module:**
  - Live ticking timer (`06h 24m 12s`) with tabular numerals.
  - Circular SVG Goal Gauge (82% Goal Target) with smooth progress indicators.
  - Linear progress bar comparing against the daily goal (`7h 45m`) with estimated departure wrap (`5:53 PM`).
  - Stat grid displaying gross office duration and factored deductions (Lunch 1h + Comfort Buffer 15m).
- **Tactile Clock Out Hero Trigger:** Vibrant sapphire linear gradient button (`#004AC6` to `#2563EB`) with active tactile compression.
- **Quick Shift Triggers:** One-tap Coffee Break (15m rest) and Lunch break logger with interactive toast confirmations.
- **Single Net Cumulative Balance Card:** Prominently highlights banked surplus (`+39 min`), projected daily delta (`+14 min`), carried-over credit (`+25m`), and estimated EOD position.
- **Today's Ledger Grid:** 4-box breakdown of In-Time, Out-Time, Deductions, and Productive net.
- **Weekly Rhythm Insights:** Micro-insight cards highlighting average productive cadence (`8h 02m`) and consistency.
- **Recent Attendance List:** Last 5 punch ledger records with color-coded status chips and timestamps.

### 2. Attendance Calendar (`src/screens/CalendarScreen.tsx`)
- **Month Navigation & View Toggle:** Month switch controls for October 2026 and segmented control (`Month` vs `Week`).
- **2x2 Bento Stat Strip:**
  - *Days Logged:* 22 / 23 days (with visual progress bar)
  - *Daily Average:* 7h 48m (98% adherence)
  - *Net Balance:* +50m (Surplus Banked badge)
  - *On-Time Rate:* 91% (20/22 shifts)
- **Interactive 7-Column Calendar Grid:**
  - Full calendar layout (Monday to Sunday) covering Oct 1–31.
  - Color-coded badges for *Surplus* (`+15m`, `+45m`, etc.), *Deficit* (`-20m`, `-15m`), *Balanced* (`0m` dot), *Live Today* (`Oct 23` pulsing pill), and *Warning* (`Oct 24` missing clock-out).
  - Tapping any day dynamically highlights the date and updates the detailed preview card below.
- **Selected Day Detail Card:**
  - Displays selected shift window, live status pill, productive progress gauge, and punch timestamps.
  - Action buttons: *View Timeline* and *Log Adjustment*.
- **Color Legend Guide:** Explains color codes for Surplus, Deficit, Balanced, Currently Working, Missing Out Punch, and Weekend/Holidays.

### 3. Attendance History & Detail (`src/screens/HistoryScreen.tsx`)
- **Overview Strip:** Month overview showing 22 workdays, logged average (`8h 02m`), and surplus status.
- **Search & Filter Bar:** Instant search across punch logs, notes, and dates, with tune filter button.
- **Horizontal Filter Chips:** Real-time filtering by `All (22)`, `Extra Time (🟢)`, `Adjustments (🔴)`, `Balanced (⚪)`, and `Missing (⚠️)`.
- **Expandable Detailed Punch Ledger:**
  - *Today (Oct 3):* In-progress active shift details.
  - *Oct 2 (Highlighted Detailed Card):* Full interactive visual timeline showing Early Arrival (`9:50 AM`), Shift Window Start (`10:00 AM`), Mandatory Lunch (`1:00 PM - 2:00 PM`), Buffer Allowance (`-15m`), and Standard Departure (`7:00 PM`).
  - *Calculation Breakdown Table:* Gross office time (`9h 10m`), deductions (`-1h 15m`), net productive work (`7h 55m`), target (`7h 45m`), day balance (`+10 min`), and cumulative month position (`+25 min`).
  - *Oct 1:* Deficit and late arrival record (`-20 min`).
  - *Sep 26:* Missing punch alert with direct *"Tap to correct clock-out"* trigger.

### 4. Analytics & Reports (`src/screens/AnalyticsScreen.tsx`)
- **Period Filter:** Switch between *This Week*, *This Month (October)*, *Last 3 Months*, and *Year*.
- **Core KPI Hero Banner:** Vibrant gradient card with Net Cumulative Balance (`+50 min`), Hourglass icon, and month-over-month comparison (`+12% vs Sep`).
- **Secondary Metrics Triple Grid:** Total Hours (`171h 20m`), Daily Productivity (`7h 47m`), and On-Time Punctuality (`91%`).
- **Daily Hours vs Goal Bar Chart:** Interactive 5-day column visualization with a dashed target line (`7h 45m`) and tap-to-inspect tooltips.
- **Cumulative Trend SVG Area Chart:** Smooth vector curve showing progressive surplus growth from Oct 1 to Oct 31 (`+50m`).
- **Punctuality & Cadence Ratio:** Segmented visual gauge (73% Early/On-Time, 23% Late Recovered, 4% Pending HR Adjustment).
- **Manager Compliance Dispatch:** Ready-to-copy executive summary snippet with *"Copy text"* button, and export triggers for PDF and CSV.

### 5. Settings & Profile (`src/screens/SettingsScreen.tsx`)
- **User Profile Header:** Sarah Jenkins (Senior Product Engineer), Department, Employee ID, and Campus Location.
- **Project & Author Verification:** Prominently lists `sujay kumar kotal` as the author and displays Stitch Project ID `1921746099640358119`.
- **Shift & Schedule Parameters:** Configurable Daily Goal (`7h 45m`), Shift Window (`10:00 AM - 7:00 PM`), Lunch Deduction (`1h`), and Buffer (`15m`).
- **Automated Engine Rules:** Interactive switches for auto-deducting lunch, comfort buffers, surplus alerts, and late grace periods.
- **Data Export & HR Sync:** Options to download complete time records, export CSVs, and sync with HR payroll.

---

## 🎨 Design System & Color Tokens

| Token | Hex Code | Role |
| :--- | :--- | :--- |
| **Primary** | `#004AC6` / `#2563EB` | Active Sapphire: Running shifts, primary buttons, active tabs |
| **Secondary** | `#006C4A` / `#059669` | Emerald Surplus: Overtime banked, surplus metrics, punctuality |
| **Secondary Container** | `#82F5C1` / `#85F8C4` | Soft mint backgrounds for surplus chips |
| **Tertiary / Error** | `#AE0010` / `#DC2626` | Crimson Deficit: Late arrivals, missing punches, deficits |
| **Surface** | `#FAF8FF` | Lavender-tinted base canvas |
| **Surface Container Low** | `#F2F3FF` | Secondary card tiers & input backgrounds |
| **Surface Container Lowest**| `#FFFFFF` | Primary white card elevation |
| **On Surface** | `#131B2E` | Deep charcoal for high-contrast typography |
| **On Surface Variant** | `#434655` | Muted slate for supportive labels |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Running the App Locally

1. **Run Full Stack (API + Web Frontend concurrently):**
   ```bash
   npm run dev
   ```
   *Launches the Express backend on `http://localhost:3001` and Expo Web on `http://localhost:8081`.*

2. **Run Individual Services:**
   - **Backend API only:**
     ```bash
     npm run server
     ```
   - **Expo Web client only:**
     ```bash
     npm run web
     ```
   - **Android Emulator / Device:**
     ```bash
     npm run android
     ```
   - **iOS Simulator (macOS only):**
     ```bash
     npm run ios
     ```

3. **Run Automated Test Suite:**
   ```bash
   npm test
   ```
   *Executes all canonical calculation tests (Tests 1–5 from specification + cumulative balance propagation chain).*

---

## 🗄️ Persistence Layer & Local Architecture

The application strictly persists all data into local JSON files in the `/data` directory without requiring any external databases or cloud services:

```text
/data
├── settings.json       # Configured shift window, lunch (60m), buffer (15m), goal (465m), timezone
├── user.json           # Single-user credentials with secure PBKDF2 password hashing & salt
├── attendance.json     # Chronological punch sessions with exact timestamps & metrics
├── balance.json        # Running cumulative net balance & canonical state
└── backups/            # Timestamped JSON backups created on corrections & exports
```

### Core Business Logic Rules
- **Office Duration:** `clockOut - clockIn`
- **Deductions:** `60 min` Lunch + `15 min` Comfort Buffer = `75 min` total deductions
- **Productive Duration:** `officeMinutes - 75`
- **Target Duration:** `465 minutes` (7 hours 45 minutes)
- **Daily Balance:** `productiveMinutes - 465`
- **Cumulative Chain:** Recalculates dynamically from chronological order; historical adjustment propagates to all subsequent days.
- **One Punch Per Day:** Strict guard prevents duplicate clock-ins once a session is completed.

---

## 📡 REST API Endpoints (`http://localhost:3001/api`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/status` | Check if initial user setup is needed |
| `POST` | `/api/auth/setup` | Register the initial single user |
| `POST` | `/api/auth/login` | Authenticate using password |
| `GET` | `/api/auth/session` | Validate session token persistence |
| `GET` | `/api/dashboard` | Aggregated payload for instant dashboard telemetry |
| `POST` | `/api/attendance/clock-in` | Punch-in with early/late calculation |
| `POST` | `/api/attendance/clock-out` | Punch-out with core time & balance calculations |
| `POST` | `/api/attendance/adjust` | Submit historical adjustment & recalculate chain |
| `GET` | `/api/attendance` | Full attendance history with optional filters |
| `GET` | `/api/attendance/calendar` | 31-day status matrix for month |
| `GET` | `/api/analytics` | 5-day weekly bars, trend curves, cadence, manager summary |
| `GET` | `/api/settings` | Retrieve active work parameters |
| `PUT` | `/api/settings` | Update settings without corrupting historical records |
| `GET` | `/api/export/csv` | Download RFC-4180 compliant CSV timesheet |
| `POST` | `/api/backups` | Generate timestamped snapshot of JSON database |

---

## 📂 Project Directory Structure

```
├── App.tsx                     # Main App component with navigation, tabs, modals, auth, and state
├── app.json                    # Expo metadata (Name: Attendance & Time Balance Tracker)
├── package.json                # Dependencies and author: sujay kumar kotal
├── tsconfig.json               # TypeScript configuration
├── data/                       # Local JSON database & backups
├── server/                     # Lightweight Express API backend
│   ├── types.ts                # TypeScript data models and API response types
│   ├── timeUtils.ts            # Asia/Kolkata timezone handling, 12h/24h parsing, formatting
│   ├── attendanceCalculator.ts # Canonical calculation engine & cumulative chain builder
│   ├── storageService.ts       # Atomic JSON file writes (.tmp -> rename), defaults & backups
│   ├── authService.ts          # Single-user PBKDF2 hashing, session tokens, setup/login
│   ├── attendanceService.ts    # Clock-in, clock-out, adjustment, dashboard & calendar aggregation
│   ├── analyticsService.ts     # Weekly bars, progressive trend points, cadence metrics
│   ├── routes.ts               # Express REST router
│   ├── index.ts                # Server entry point (port 3001)
│   └── __tests__/              # Automated test suite (all 6 tests passing)
├── src/
│   ├── components/             # Reusable UI components & modals
│   │   ├── AdjustmentModal.tsx # Slide-up sheet to submit time adjustments
│   │   ├── AuthModal.tsx       # Passcode unlock and initial setup modal
│   │   ├── BottomNav.tsx       # Docked 5-tab navigation bar
│   │   ├── ClockOutModal.tsx   # Slide-up sheet to confirm clock-out
│   │   ├── Header.tsx          # Top branding header with live status & avatar
│   │   ├── Logo.tsx            # SVG TimeTrack logo
│   │   └── Toast.tsx           # Floating notification toast
│   ├── data/                   # Initial reference datasets
│   ├── screens/                # The 5 primary screens matching Stitch
│   │   ├── AnalyticsScreen.tsx # KPI hero, SVG trend curve, bar chart, and snippet
│   │   ├── CalendarScreen.tsx  # 7-column grid, day detail card, and bento stats
│   │   ├── DashboardScreen.tsx # Live telemetry, circular gauge, balance card
│   │   ├── HistoryScreen.tsx   # Filterable punch cards & expandable timeline
│   │   └── SettingsScreen.tsx  # Author info (sujay kumar kotal), rules, & exports
│   ├── services/
│   │   └── apiClient.ts        # Unified HTTP client with session token persistence
│   └── theme/
│       └── theme.ts            # Stitch color palette, spacing, and typography tokens
```

---

## 👨‍💻 Author

**sujay kumar kotal**  
*Attendance & Time Balance Tracker* — Implemented from Google Stitch Project `1921746099640358119`.
