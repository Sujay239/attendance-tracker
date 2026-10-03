import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'timetrack_session_token';

// Use local host 3001 or configured network URL for the Express API
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // 192.168.0.156 allows physical phones on the same Wi-Fi network to reach the API server
    return 'http://192.168.0.156:3001/api';
  }
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getBaseUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken(): Promise<string | null> {
    try {
      this.token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      return this.token;
    } catch {
      return null;
    }
  }

  public async setSessionToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  public async getSessionToken(): Promise<string | null> {
    if (!this.token) {
      await this.loadToken();
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getSessionToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-token'] = token;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        const errorMsg = json?.error?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }
      return json.data as T;
    } catch (err: any) {
      // If network error, throw useful error
      if (err.message && err.message.includes('Network request failed')) {
        throw new Error('Local API server is not running at http://localhost:3001. Please run `npm run server`.');
      }
      throw err;
    }
  }

  // --- Auth ---
  public async getAuthStatus(): Promise<{ initialized: boolean; user: any }> {
    return this.request('/auth/status');
  }

  public async setupAccount(name: string, email: string, password: string): Promise<any> {
    const data = await this.request<{ sessionToken: string; user: any }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.sessionToken) {
      await this.setSessionToken(data.sessionToken);
    }
    return data;
  }

  public async login(password: string): Promise<any> {
    const data = await this.request<{ sessionToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (data.sessionToken) {
      await this.setSessionToken(data.sessionToken);
    }
    return data;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {}
    await this.setSessionToken(null);
  }

  public async checkSession(): Promise<{ authenticated: boolean; user: any }> {
    return this.request('/auth/session');
  }

  // --- Dashboard ---
  public async getDashboard(): Promise<any> {
    return this.request('/dashboard');
  }

  // --- Attendance ---
  public async clockIn(notes: string = ''): Promise<any> {
    return this.request('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async clockOut(notes: string = ''): Promise<any> {
    return this.request('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async submitAdjustment(date: string, inTime: string, outTime: string, reason: string, notes: string): Promise<any> {
    return this.request('/attendance/adjust', {
      method: 'POST',
      body: JSON.stringify({ date, inTime, outTime, reason, notes }),
    });
  }

  public async getAttendance(params?: { month?: string; status?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.request(`/attendance${qs ? `?${qs}` : ''}`);
  }

  public async getCalendar(month?: string): Promise<any[]> {
    const qs = month ? `?month=${month}` : '';
    return this.request(`/attendance/calendar${qs}`);
  }

  // --- Analytics ---
  public async getAnalytics(period: string = 'month'): Promise<any> {
    return this.request(`/analytics/summary?period=${encodeURIComponent(period)}`);
  }

  // --- Settings ---
  public async getSettings(): Promise<any> {
    return this.request('/settings');
  }

  public async updateSettings(settings: any): Promise<any> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // --- Export ---
  public async exportCsv(): Promise<string> {
    const token = await this.getSessionToken();
    const response = await fetch(`${API_BASE_URL}/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Failed to generate CSV export.');
    return response.text();
  }

  public async createBackup(label?: string): Promise<any> {
    return this.request('/backups', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }
}

export const api = new ApiClient();
