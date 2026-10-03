import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { Header } from './src/components/Header';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { Toast } from './src/components/Toast';
import { ClockOutModal } from './src/components/ClockOutModal';
import { AdjustmentModal } from './src/components/AdjustmentModal';
import { AuthModal } from './src/components/AuthModal';
import { INITIAL_USER } from './src/data/mockData';
import { api } from './src/services/apiClient';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const MainApp = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isAuthSetup, setIsAuthSetup] = useState(false);

  // Modals state
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState('2026-10-03');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const showToast = (
    msg: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    setToastType(type);
    setToastMessage(msg);
  };

  const fetchDashboardState = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      if (data) {
        setDashboardData(data);
        setIsClockedIn(data.attendanceStatus === 'WORKING');
      }
    } catch {
      // Offline or server booting
    }
  }, []);

  // Check auth session on startup
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const session = await api.checkSession();
        if (session && session.authenticated) {
          if (isMounted) {
            setIsAuthenticated(true);
            setAuthModalVisible(false);
            fetchDashboardState();
          }
        } else {
          const authStatus = await api.getAuthStatus().catch(() => ({ initialized: false, user: null }));
          if (isMounted) {
            setIsAuthSetup(!authStatus?.initialized);
            setAuthModalVisible(true);
          }
        }
      } catch {
        if (isMounted) {
          setAuthModalVisible(true);
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [fetchDashboardState]);

  const handleClockOutPress = async () => {
    if (isClockedIn) {
      setClockOutModalVisible(true);
    } else {
      try {
        const res = await api.clockIn('Mobile daily check-in');
        showToast(
          `Clocked in at ${res.attendance?.clockInTime || '10:00 AM'}. Status: ${res.status}`,
          'success'
        );
        setIsClockedIn(true);
        await fetchDashboardState();
        setRefreshKey((k) => k + 1);
      } catch (err: any) {
        showToast(err.message || 'Unable to clock in today', 'error');
      }
    }
  };

  const confirmClockOut = async () => {
    try {
      const res = await api.clockOut('Mobile shift conclusion');
      setClockOutModalVisible(false);
      setIsClockedIn(false);
      const earned = res.attendance?.dailyBalanceMinutes ?? 0;
      const balanceNotice = earned >= 0 ? `+${earned}m extra earned` : `${earned}m adjustment`;
      showToast(`Clocked out successfully! ${balanceNotice}.`, 'success');
      await fetchDashboardState();
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err.message || 'Clock out encountered an error', 'error');
      setClockOutModalVisible(false);
    }
  };

  const handleOpenAdjustment = (dateStr: string) => {
    setAdjustmentDate(dateStr);
    setAdjustmentModalVisible(true);
  };

  const handleAdjustmentSubmit = async (data: {
    date: string;
    inTime: string;
    outTime: string;
    reason: string;
    note: string;
  }) => {
    try {
      await api.submitAdjustment(data.date, data.inTime, data.outTime, data.reason, data.note);
      showToast(`Adjustment for ${data.date} applied and balance recalculated!`, 'success');
      await fetchDashboardState();
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err.message || 'Adjustment could not be saved', 'error');
    }
  };

  const handleLogin = async (passcode: string) => {
    await api.login(passcode);
    setIsAuthenticated(true);
    setAuthModalVisible(false);
    showToast('Logged in successfully. Welcome!', 'success');
    await fetchDashboardState();
    setRefreshKey((k) => k + 1);
  };

  const handleSetup = async (name: string, email: string, passcode: string) => {
    await api.setupAccount(name, email, passcode);
    setIsAuthenticated(true);
    setAuthModalVisible(false);
    showToast(`Account configured for ${name}! Welcome.`, 'success');
    await fetchDashboardState();
    setRefreshKey((k) => k + 1);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAuthSetup(false);
    setAuthModalVisible(true);
  };

  // Compute live values for modal
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const currentFormattedTime = `${h}:${m} ${ampm}`;

  const currentProductiveMins = dashboardData?.productiveMinutes ?? 384;
  const prodHours = Math.floor(currentProductiveMins / 60);
  const prodMins = Math.abs(currentProductiveMins % 60);
  const currentFormattedProductive = `${prodHours}h ${prodMins.toString().padStart(2, '0')}m`;

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />

      {/* Global Header */}
      <Header
        currentTab={activeTab}
        isClockedIn={isClockedIn}
        userAvatar={INITIAL_USER.avatar}
        onProfilePress={() => setActiveTab('settings')}
        onClockStatusPress={handleClockOutPress}
      />

      {/* Main Screen Content */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            key={`dashboard-${refreshKey}`}
            dashboardData={dashboardData}
            onClockOutPress={handleClockOutPress}
            onNavigateHistory={() => setActiveTab('history')}
            onOpenAdjustment={handleOpenAdjustment}
            showToast={showToast}
            isClockedIn={isClockedIn}
            onTakeBreak={() => showToast('Break logged: 15m buffer active', 'info')}
            onLunchPress={() => showToast('Lunch pause (60m) is factored automatically', 'info')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            key={`history-${refreshKey}`}
            onOpenAdjustment={handleOpenAdjustment}
            showToast={showToast}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarScreen
            key={`calendar-${refreshKey}`}
            onOpenAdjustment={handleOpenAdjustment}
            showToast={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen
            key={`analytics-${refreshKey}`}
            showToast={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            key={`settings-${refreshKey}`}
            showToast={showToast}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Docked Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        bottomInset={insets.bottom}
      />

      {/* Clock Out Bottom Sheet Modal */}
      <ClockOutModal
        visible={clockOutModalVisible}
        onClose={() => setClockOutModalVisible(false)}
        onConfirm={confirmClockOut}
        currentTimeStr={currentFormattedTime}
        productiveTimeStr={currentFormattedProductive}
      />

      {/* Adjustment Sheet Modal */}
      <AdjustmentModal
        visible={adjustmentModalVisible}
        onClose={() => setAdjustmentModalVisible(false)}
        onSubmit={handleAdjustmentSubmit}
        initialDate={adjustmentDate}
      />

      {/* Local Passcode Authentication & Setup Modal */}
      <AuthModal
        visible={authModalVisible}
        isInitialSetup={isAuthSetup}
        onLogin={handleLogin}
        onSetup={handleSetup}
      />

      {/* Toast Notification Banner */}
      <Toast
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  screenContainer: {
    flex: 1,
  },
});
