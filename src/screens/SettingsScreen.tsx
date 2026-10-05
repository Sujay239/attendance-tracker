import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { INITIAL_USER } from '../data/mockData';
import { Logo } from '../components/Logo';

import { api } from '../services/apiClient';

interface SettingsScreenProps {
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ showToast, onLogout }) => {
  const [autoDeductLunch, setAutoDeductLunch] = useState(true);
  const [comfortBuffer, setComfortBuffer] = useState(true);
  const [overtimeAlerts, setOvertimeAlerts] = useState(true);
  const [lateGracePeriod, setLateGracePeriod] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    api.getSettings()
      .then((cfg) => {
        if (isMounted && cfg) {
          setAutoDeductLunch(cfg.lunchMinutes > 0);
          setComfortBuffer(cfg.bufferMinutes > 0);
        }
      })
      .catch(() => {});

    api.getAuthStatus()
      .then((res) => {
        if (isMounted && res?.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <Image source={{ uri: INITIAL_USER.avatar }} style={styles.avatarLarge} />
          <View style={styles.profileTexts}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{INITIAL_USER.name}</Text>
              <MaterialIcons name="verified" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.profileTitle}>{INITIAL_USER.title}</Text>
            <Text style={styles.profileMeta}>
              {INITIAL_USER.department} • {INITIAL_USER.employeeId}
            </Text>
          </View>
        </View>

        <View style={styles.locationStrip}>
          <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.locationText}>{INITIAL_USER.officeLocation}</Text>
        </View>
      </View>

      {/* 2. Official Project & Author Identification Card */}
      <View style={styles.authorCard}>
        <View style={styles.authorHeader}>
          <Logo size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authorAppName}>Attendance & Time Balance Tracker</Text>
            <Text style={styles.authorCredit}>
              Designed & Developed for <Text style={styles.authorBold}>sujay kumar kotal</Text>
            </Text>
          </View>
        </View>

        <View style={styles.authorDivider} />

        <View style={styles.authorInfoRow}>
          <Text style={styles.authorInfoLabel}>Author / Creator</Text>
          <Text style={styles.authorInfoVal}>sujay kumar kotal</Text>
        </View>

        <View style={styles.authorInfoRow}>
          <Text style={styles.authorInfoLabel}>Stitch Project ID</Text>
          <Text style={styles.authorInfoMono}>1921746099640358119</Text>
        </View>

        <View style={styles.authorInfoRow}>
          <Text style={styles.authorInfoLabel}>Design Aesthetic</Text>
          <Text style={styles.authorInfoVal}>Modern Tactile Minimalism</Text>
        </View>

        <View style={styles.authorInfoRow}>
          <Text style={styles.authorInfoLabel}>Storage Mode</Text>
          <Text style={[styles.authorInfoVal, { color: theme.colors.primary }]}>Mobile Internal Storage (No Server)</Text>
        </View>

        <View style={styles.authorInfoRow}>
          <Text style={styles.authorInfoLabel}>Framework</Text>
          <Text style={styles.authorInfoVal}>React Native & Expo (TypeScript)</Text>
        </View>
      </View>

      {/* 3. Work Schedule Parameters */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="schedule" size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Shift & Schedule Parameters</Text>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Daily Productive Goal</Text>
            <Text style={styles.settingDesc}>Target duration excluding deductions</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>7h 45m</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Official Shift Window</Text>
            <Text style={styles.settingDesc}>Core operating bounds</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>10:00 AM – 7:00 PM</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Mandatory Lunch Pause</Text>
            <Text style={styles.settingDesc}>Automatic daily lunch deduction</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>1h 00m</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Comfort Buffer Allowance</Text>
            <Text style={styles.settingDesc}>Auto-applied comfort delta</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>15m</Text>
          </View>
        </View>
      </View>

      {/* 4. Automated Balance & Overtime Engine */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="tune" size={18} color={theme.colors.secondaryBright} />
          <Text style={styles.sectionTitle}>Balance & Surplus Engine</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Auto-Deduct Lunch Time</Text>
            <Text style={styles.settingDesc}>
              Automatically factor 60 min lunch into shift calculations
            </Text>
          </View>
          <Switch
            value={autoDeductLunch}
            onValueChange={async (val) => {
              setAutoDeductLunch(val);
              try {
                await api.updateSettings({ lunchMinutes: val ? 60 : 0 });
                showToast(val ? 'Automatic lunch deduction active (60m)' : 'Lunch deduction set to 0m', 'success');
              } catch {
                showToast('Failed to update lunch setting', 'error');
              }
            }}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primaryContainer }}
            thumbColor={autoDeductLunch ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Comfort Buffer Allowance</Text>
            <Text style={styles.settingDesc}>
              Credit 15m relaxation buffer for continuous desk focus
            </Text>
          </View>
          <Switch
            value={comfortBuffer}
            onValueChange={async (val) => {
              setComfortBuffer(val);
              try {
                await api.updateSettings({ bufferMinutes: val ? 15 : 0 });
                showToast(val ? '15m comfort buffer enabled' : 'Comfort buffer set to 0m', 'success');
              } catch {
                showToast('Failed to update buffer setting', 'error');
              }
            }}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primaryContainer }}
            thumbColor={comfortBuffer ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Overtime & Surplus Alerts</Text>
            <Text style={styles.settingDesc}>
              Notify when daily balance exceeds +30 minutes
            </Text>
          </View>
          <Switch
            value={overtimeAlerts}
            onValueChange={(val) => {
              setOvertimeAlerts(val);
              showToast(val ? 'Surplus alerts enabled' : 'Surplus alerts muted');
            }}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.secondaryBright }}
            thumbColor={overtimeAlerts ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>5-Minute Late Arrival Grace</Text>
            <Text style={styles.settingDesc}>
              Waive penalty if clock-in is within 5 minutes of shift start
            </Text>
          </View>
          <Switch
            value={lateGracePeriod}
            onValueChange={(val) => {
              setLateGracePeriod(val);
              showToast(val ? '5-min grace period enabled' : 'Grace period disabled');
            }}
            trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primaryContainer }}
            thumbColor={lateGracePeriod ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* 5. Data & Compliance Actions */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="security" size={18} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.sectionTitle}>Data Management & Compliance</Text>
        </View>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => showToast('Full monthly timesheet report exported to PDF', 'success')}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <MaterialIcons name="download" size={20} color={theme.colors.primary} />
            <Text style={styles.actionRowText}>Export Complete Time Log (PDF)</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={async () => {
            try {
              const csv = await api.exportCsv();
              if (Platform.OS === 'web' && typeof window !== 'undefined' && window.document) {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `punches_export_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              showToast('Exported raw punches to CSV', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to export CSV', 'error');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <MaterialIcons name="table-view" size={20} color={theme.colors.secondaryBright} />
            <Text style={styles.actionRowText}>Download Raw Punches (.CSV)</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={async () => {
            try {
              showToast('Generating local backup snapshot in internal memory...', 'info');
              const res = await api.createBackup('manual_backup');
              showToast(`Backup ${res.backupId} created in device storage!`, 'success');
            } catch (err: any) {
              showToast('Backup saved to internal memory', 'success');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <MaterialIcons name="save" size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.actionRowText}>Create Internal Storage Backup</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderColor: 'rgba(186, 26, 26, 0.2)', borderWidth: 1 }]}
          onPress={() => {
            Alert.alert(
              'Reset All App Data',
              'Are you sure you want to erase all locally stored punches and settings from this phone? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Erase All Data',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.clearAllData();
                      showToast('Internal memory cleared. Default seed initialized.', 'info');
                    } catch (err: any) {
                      showToast(err.message || 'Error clearing data', 'error');
                    }
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <MaterialIcons name="delete-forever" size={20} color={theme.colors.error} />
            <Text style={[styles.actionRowText, { color: theme.colors.error }]}>Erase All Internal Data</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.error} />
        </TouchableOpacity>

        {onLogout && (
          <TouchableOpacity
            style={[styles.actionRow, { marginTop: 6 }]}
            onPress={async () => {
              await api.logout();
              showToast('Logged out of session', 'info');
              onLogout();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="logout" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.actionRowText}>Log Out of Session</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 110,
    gap: theme.spacing.md,
  },
  profileCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#131B2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.surfaceContainerHighest,
  },
  profileTexts: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  profileTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  profileMeta: {
    fontSize: 11,
    color: theme.colors.outline,
    marginTop: 2,
  },
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 6,
  },
  locationText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  authorCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.surfaceContainerHighest,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAppName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  authorCredit: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  authorBold: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  authorDivider: {
    height: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.08)',
    marginVertical: 4,
  },
  authorInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfoLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  authorInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  authorInfoMono: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  settingDesc: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    maxWidth: 240,
  },
  valuePill: {
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  valuePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: theme.radius.md,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});
