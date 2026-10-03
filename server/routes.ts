import { Router, Request, Response } from 'express';
import { authService } from './authService';
import { storage } from './storageService';
import { attendanceService } from './attendanceService';
import { analyticsService } from './analyticsService';

export const apiRouter = Router();

// Helper for standardized API responses
function sendSuccess<T>(res: Response, data: T) {
  return res.json({ success: true, data });
}

function sendError(res: Response, message: string, code: string = 'ERROR', statusCode: number = 400) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// Session validation middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);

  // If no user initialized yet, allow setup
  if (!authService.isInitialized()) {
    return next();
  }

  if (!authService.validateSession(token)) {
    return sendError(res, 'Unauthorized. Please log in.', 'UNAUTHORIZED', 401);
  }

  next();
}

// ================= AUTH ROUTES =================

apiRouter.get('/auth/status', (_req, res) => {
  return sendSuccess(res, {
    initialized: authService.isInitialized(),
    user: authService.getCurrentUser(),
  });
});

apiRouter.post('/auth/setup', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = authService.setupAccount(name, email, password);
    return sendSuccess(res, {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      sessionToken: result.sessionToken,
    });
  } catch (err: any) {
    return sendError(res, err.message, 'SETUP_FAILED');
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { password } = req.body;
    const result = authService.login(password);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message, 'LOGIN_FAILED', 401);
  }
});

apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);
  if (token) {
    authService.logout(token);
  }
  return sendSuccess(res, { loggedOut: true });
});

apiRouter.get('/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-session-token'] as string);
  const isValid = authService.validateSession(token);
  return sendSuccess(res, {
    authenticated: isValid,
    user: isValid ? authService.getCurrentUser() : null,
  });
});

// ================= DASHBOARD ROUTE =================

apiRouter.get('/dashboard', (_req, res) => {
  try {
    const data = attendanceService.getDashboardData();
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err.message, 'DASHBOARD_ERROR');
  }
});

// ================= ATTENDANCE ROUTES =================

apiRouter.post('/attendance/clock-in', (req, res) => {
  try {
    const { notes } = req.body;
    const result = attendanceService.clockIn(notes);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message, 'CLOCK_IN_FAILED');
  }
});

apiRouter.post('/attendance/clock-out', (req, res) => {
  try {
    const { notes } = req.body;
    const result = attendanceService.clockOut(notes);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message, 'CLOCK_OUT_FAILED');
  }
});

apiRouter.post('/attendance/adjust', (req, res) => {
  try {
    const { date, inTime, outTime, reason, notes } = req.body;
    if (!date || !inTime || !outTime) {
      return sendError(res, 'Date, inTime, and outTime are required.', 'VALIDATION_ERROR');
    }
    const updated = attendanceService.correctRecord(date, inTime, outTime, reason, notes);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 'ADJUSTMENT_FAILED');
  }
});

apiRouter.get('/attendance', (req, res) => {
  try {
    const { month, status } = req.query;
    let records = storage.getAttendanceRecords();

    if (month && typeof month === 'string') {
      records = records.filter((r) => r.date.startsWith(month));
    }

    if (status && typeof status === 'string' && status !== 'all') {
      records = records.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    // Sort descending by date
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    return sendSuccess(res, sorted);
  } catch (err: any) {
    return sendError(res, err.message, 'FETCH_ATTENDANCE_FAILED');
  }
});

apiRouter.get('/attendance/calendar', (req, res) => {
  try {
    const { month } = req.query;
    const data = attendanceService.getCalendarData(month as string | undefined);
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err.message, 'CALENDAR_ERROR');
  }
});

apiRouter.get('/attendance/:date', (req, res) => {
  try {
    const { date } = req.params;
    const records = storage.getAttendanceRecords();
    const record = records.find((r) => r.date === date);
    if (!record) {
      return sendError(res, `No attendance found for ${date}`, 'NOT_FOUND', 404);
    }
    return sendSuccess(res, record);
  } catch (err: any) {
    return sendError(res, err.message, 'DETAIL_ERROR');
  }
});

// ================= ANALYTICS ROUTES =================

apiRouter.get(['/analytics', '/analytics/summary'], (req, res) => {
  try {
    const { period } = req.query;
    const data = analyticsService.getAnalyticsSummary(period as string | undefined);
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err.message, 'ANALYTICS_ERROR');
  }
});

apiRouter.get('/analytics/weekly', (_req, res) => {
  try {
    const data = analyticsService.getAnalyticsSummary('week');
    return sendSuccess(res, { weeklyBars: data.weeklyBars, average: data.averageProductiveMinutes });
  } catch (err: any) {
    return sendError(res, err.message, 'ANALYTICS_ERROR');
  }
});

apiRouter.get('/analytics/monthly', (_req, res) => {
  try {
    const data = analyticsService.getAnalyticsSummary('month');
    return sendSuccess(res, data);
  } catch (err: any) {
    return sendError(res, err.message, 'ANALYTICS_ERROR');
  }
});

// ================= SETTINGS ROUTES =================

apiRouter.get('/settings', (_req, res) => {
  try {
    const settings = storage.getSettings();
    return sendSuccess(res, settings);
  } catch (err: any) {
    return sendError(res, err.message, 'SETTINGS_ERROR');
  }
});

apiRouter.put('/settings', (req, res) => {
  try {
    const updated = storage.saveSettings(req.body);
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 'SETTINGS_UPDATE_ERROR');
  }
});

// ================= EXPORT & BACKUPS =================

apiRouter.get('/export/csv', (_req, res) => {
  try {
    const csv = attendanceService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    return res.send(csv);
  } catch (err: any) {
    return sendError(res, err.message, 'EXPORT_FAILED');
  }
});

apiRouter.post('/backups', (req, res) => {
  try {
    const label = req.body?.label || 'manual';
    const backupDir = storage.createBackup(label);
    return sendSuccess(res, { backupDir, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return sendError(res, err.message, 'BACKUP_FAILED');
  }
});
