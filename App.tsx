import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { Header } from './src/components/Header';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { Toast } from './src/components/Toast';
import { ClockOutModal } from './src/components/ClockOutModal';
import { AdjustmentModal } from './src/components/AdjustmentModal';
import { INITIAL_USER } from './src/data/mockData';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const MainApp = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isClockedIn, setIsClockedIn] = useState(true);

  // Modals state
  const [clockOutModalVisible, setClockOutModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState('Oct 3, 2026');

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

  const handleClockOutPress = () => {
    if (isClockedIn) {
      setClockOutModalVisible(true);
    } else {
      setIsClockedIn(true);
      showToast('Welcome back! Clocked in at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'success');
    }
  };

  const confirmClockOut = () => {
    setClockOutModalVisible(false);
    setIsClockedIn(false);
    showToast('Successfully clocked out! Great work today Sarah.', 'success');
  };

  const handleOpenAdjustment = (dateStr: string) => {
    setAdjustmentDate(dateStr);
    setAdjustmentModalVisible(true);
  };

  const handleAdjustmentSubmit = (data: {
    date: string;
    inTime: string;
    outTime: string;
    reason: string;
    note: string;
  }) => {
    showToast(`Adjustment for ${data.date} submitted for manager review`, 'success');
  };

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
            onClockOutPress={handleClockOutPress}
            onNavigateHistory={() => setActiveTab('history')}
            showToast={showToast}
            isClockedIn={isClockedIn}
            onTakeBreak={() => showToast('Break logged: 15m rest activated', 'info')}
            onLunchPress={() => showToast('Lunch already factored into daily deduction (1h)', 'info')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            onOpenAdjustment={handleOpenAdjustment}
            showToast={showToast}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarScreen
            onOpenAdjustment={handleOpenAdjustment}
            showToast={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen showToast={showToast} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen showToast={showToast} />
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
        currentTimeStr="4:32 PM"
        productiveTimeStr="6h 24m"
      />

      {/* Adjustment Sheet Modal */}
      <AdjustmentModal
        visible={adjustmentModalVisible}
        onClose={() => setAdjustmentModalVisible(false)}
        onSubmit={handleAdjustmentSubmit}
        initialDate={adjustmentDate}
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
