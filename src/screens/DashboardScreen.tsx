import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';
import { INITIAL_USER, INITIAL_RECORDS } from '../data/mockData';

interface DashboardScreenProps {
  onClockOutPress: () => void;
  onNavigateHistory: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  isClockedIn: boolean;
  onTakeBreak: () => void;
  onLunchPress: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onClockOutPress,
  onNavigateHistory,
  showToast,
  isClockedIn,
  onTakeBreak,
  onLunchPress,
}) => {
  // Live seconds timer for wall clock and productive timer
  const [seconds, setSeconds] = useState(12);
  const [minutes, setMinutes] = useState(24);
  const [hours, setHours] = useState(6);
  const [currentTimeStr, setCurrentTimeStr] = useState('4:32 PM');

  useEffect(() => {
    const timer = setInterval(() => {
      // update live wall clock
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setCurrentTimeStr(`${h}:${m}:${s} ${ampm}`);

      if (isClockedIn) {
        setSeconds((prev) => {
          if (prev >= 59) {
            setMinutes((mPrev) => {
              if (mPrev >= 59) {
                setHours((hPrev) => hPrev + 1);
                return 0;
              }
              return mPrev + 1;
            });
            return 0;
          }
          return prev + 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockedIn]);

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMins = minutes.toString().padStart(2, '0');
  const formattedSecs = seconds.toString().padStart(2, '0');

  // SVG Gauge calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius; // ~150.8
  const targetPercent = 0.82;
  const strokeDashoffset = circumference * (1 - targetPercent);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Contextual Greeting & Glanceable Header */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingLeft}>
          <View style={styles.dateBadge}>
            <MaterialIcons name="wb-sunny" size={14} color={theme.colors.primary} />
            <Text style={styles.dateBadgeText}>Friday, Oct 3, 2026</Text>
          </View>
          <Text style={styles.greetingTitle}>Good afternoon, Sarah</Text>
        </View>

        <View style={styles.wallClockBox}>
          <Text style={styles.wallClockTime}>{currentTimeStr}</Text>
          <Text style={styles.wallClockLabel}>Live Office Time</Text>
        </View>
      </View>

      {/* 2. Smart Status / Late Clock-In Pill Banner */}
      <View style={styles.lateBanner}>
        <View style={styles.lateBannerLeft}>
          <View style={styles.latePulseDot} />
          <Text style={styles.lateStatusText}>
            {isClockedIn ? 'Currently Working' : 'Shift Completed'}
          </Text>
          <Text style={styles.lateSeparator}>•</Text>
          <Text style={styles.lateInfoText}>8m Late (10:08 vs 10:00)</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            showToast('Clock-in occurred at 10:08 AM. Standard window began at 10:00 AM.')
          }
          style={styles.infoBtn}
        >
          <MaterialIcons name="info-outline" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* 3. Main Hero Card: Productive Time Worked & Live Readout */}
      <View style={styles.heroCard}>
        {/* Glow circle */}
        <View style={styles.heroGlow} />

        <View style={styles.heroHeader}>
          <View>
            <View style={styles.heroSubRow}>
              <MaterialIcons name="timelapse" size={15} color={theme.colors.secondaryBright} />
              <Text style={styles.heroSubText}>PRODUCTIVE TIME WORKED</Text>
            </View>
            <View style={styles.heroTimerRow}>
              <Text style={styles.heroTimerMain}>
                {formattedHours}h {formattedMins}m
              </Text>
              <Text style={styles.heroTimerSecs}>{formattedSecs}s</Text>
            </View>
          </View>

          {/* Circular Mini Goal Gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={60} height={60} viewBox="0 0 60 60">
              <Circle
                cx="30"
                cy="30"
                r={radius}
                stroke={theme.colors.surfaceContainerHigh}
                strokeWidth={5}
                fill="transparent"
              />
              <Circle
                cx="30"
                cy="30"
                r={radius}
                stroke={theme.colors.primaryContainer}
                strokeWidth={5}
                fill="transparent"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </Svg>
            <View style={styles.gaugeCenterText}>
              <Text style={styles.gaugePercent}>82%</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar & Projections */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '82%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>
              Goal: <Text style={styles.progressLabelBold}>7h 45m</Text>
            </Text>
            <Text style={styles.progressLabelText}>
              Remaining:{' '}
              <Text style={styles.progressLabelGreen}>1h 21m (est. 5:53 PM)</Text>
            </Text>
          </View>
        </View>

        {/* Compact Stat Grid inside Card */}
        <View style={styles.heroStatGrid}>
          <View style={styles.heroStatCol}>
            <Text style={styles.heroStatCaption}>GROSS OFFICE DURATION</Text>
            <Text style={styles.heroStatValue}>6h 24m elapsed</Text>
          </View>
          <View style={styles.heroStatCol}>
            <Text style={styles.heroStatCaption}>DEDUCTIONS</Text>
            <Text style={styles.heroStatValue}>Lunch (1h) + Buffer (15m)</Text>
          </View>
        </View>
      </View>

      {/* 4. Primary & Secondary Action Triggers */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onClockOutPress}
          style={styles.heroButtonWrapper}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroClockOutButton}
          >
            <View style={styles.heroButtonLeft}>
              <MaterialIcons name="timer-off" size={24} color="#FFFFFF" />
              <Text style={styles.heroButtonText}>
                {isClockedIn ? 'Clock Out' : 'Clock In Now'}
              </Text>
            </View>
            <View style={styles.heroButtonPill}>
              <Text style={styles.heroButtonPillText}>Now ({currentTimeStr.slice(0, 7)})</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.7}
            onPress={onTakeBreak}
          >
            <MaterialIcons name="coffee" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.quickActionText}>Take Coffee Break</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.7}
            onPress={onLunchPress}
          >
            <MaterialIcons name="restaurant" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.quickActionText}>Lunch (1h logged)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Single Net Cumulative Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceTitleRow}>
            <View style={styles.balanceGreenDot} />
            <Text style={styles.balanceTitle}>SINGLE NET BALANCE</Text>
          </View>
          <View style={styles.surplusBadge}>
            <Text style={styles.surplusBadgeText}>Surplus Stored</Text>
          </View>
        </View>

        <View style={styles.balanceStatRow}>
          <View>
            <Text style={styles.balanceStatValue}>+39 min</Text>
            <Text style={styles.balanceStatDesc}>
              Extra time banked across rolling cycle
            </Text>
          </View>
          <View style={styles.balanceProjectedCol}>
            <Text style={styles.balanceProjectedValue}>+14 min</Text>
            <Text style={styles.balanceProjectedLabel}>Projected today</Text>
          </View>
        </View>

        <View style={styles.balanceBreakdownBar}>
          <View style={styles.breakdownItem}>
            <MaterialIcons name="history" size={16} color={theme.colors.secondaryBright} />
            <Text style={styles.breakdownText}>
              Carried Over: <Text style={styles.breakdownBold}>+25m</Text>
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <MaterialIcons name="schedule" size={16} color={theme.colors.primary} />
            <Text style={styles.breakdownText}>
              Est. EOD: <Text style={styles.breakdownBoldGreen}>+39m net</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 6. Today's Time Breakdown Details Grid */}
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Today's Ledger</Text>
          <Text style={styles.ledgerSubtitle}>Oct 3, 2026</Text>
        </View>

        <View style={styles.ledgerGrid}>
          <View style={styles.ledgerBox}>
            <Text style={styles.ledgerBoxLabel}>Actual Clock In</Text>
            <Text style={styles.ledgerBoxValue}>10:08 AM</Text>
            <Text style={styles.ledgerBoxAlert}>8 min late vs 10:00</Text>
          </View>

          <View style={styles.ledgerBox}>
            <Text style={styles.ledgerBoxLabel}>Target Clock Out</Text>
            <Text style={styles.ledgerBoxValue}>5:53 PM</Text>
            <Text style={styles.ledgerBoxGreen}>Standard window 7:00</Text>
          </View>

          <View style={styles.ledgerBox}>
            <Text style={styles.ledgerBoxLabel}>Deductions Applied</Text>
            <Text style={styles.ledgerBoxValue}>1h 15m Total</Text>
            <Text style={styles.ledgerBoxMuted}>60m Lunch + 15m Buffer</Text>
          </View>

          <View style={styles.ledgerBox}>
            <Text style={styles.ledgerBoxLabel}>Current Productive</Text>
            <Text style={[styles.ledgerBoxValue, { color: theme.colors.primary }]}>
              {formattedHours}h {formattedMins}m
            </Text>
            <Text style={styles.ledgerBoxMuted}>Target: 7h 45m</Text>
          </View>
        </View>
      </View>

      {/* 7. Weekly Insights Card */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <MaterialIcons name="insights" size={20} color={theme.colors.primary} />
          <Text style={styles.insightTitle}>Weekly Rhythm</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightEmoji}>💡</Text>
          <Text style={styles.insightText}>
            You're averaging{' '}
            <Text style={styles.insightBoldPrimary}>8h 02m</Text> productive
            time this week.
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightEmoji}>⭐</Text>
          <Text style={styles.insightText}>
            On time <Text style={styles.insightBold}>4 of last 5 days</Text>. You
            have 39 minutes of extra buffer stored.
          </Text>
        </View>
      </View>

      {/* 8. Recent Attendance Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Attendance</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onNavigateHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          {INITIAL_RECORDS.slice(0, 5).map((rec) => {
            return (
              <View key={rec.id} style={styles.recentItem}>
                <View style={styles.recentItemLeft}>
                  <View
                    style={[
                      styles.recentIconBox,
                      rec.isToday
                        ? { backgroundColor: theme.colors.primaryFixed }
                        : { backgroundColor: theme.colors.surfaceContainerHigh },
                    ]}
                  >
                    <MaterialIcons
                      name={
                        rec.isToday
                          ? 'today'
                          : rec.status === 'extra'
                          ? 'check-circle'
                          : rec.status === 'deficit'
                          ? 'warning'
                          : 'schedule'
                      }
                      size={20}
                      color={rec.isToday ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.recentItemTexts}>
                    <View style={styles.recentItemDayRow}>
                      <Text style={styles.recentItemTitle}>{rec.dayLabel}</Text>
                      {rec.isToday && <View style={styles.recentPulse} />}
                    </View>
                    <Text style={styles.recentItemTimes}>
                      {rec.inTime} → {rec.outTime}
                    </Text>
                  </View>
                </View>

                <View style={styles.recentItemRight}>
                  <Text
                    style={[
                      styles.recentItemHours,
                      rec.isToday && { color: theme.colors.primary },
                    ]}
                  >
                    {rec.productiveDuration}
                  </Text>
                  <Text
                    style={[
                      styles.recentItemTag,
                      rec.status === 'extra'
                        ? { color: theme.colors.secondaryBright }
                        : rec.status === 'deficit'
                        ? { color: theme.colors.tertiaryBright }
                        : { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {rec.deltaStr}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingLeft: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  wallClockBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    alignItems: 'flex-end',
  },
  wallClockTime: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  wallClockLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  lateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
  },
  lateBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  latePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  lateStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  lateSeparator: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  lateInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.tertiaryBright,
    flexShrink: 1,
  },
  infoBtn: {
    padding: 4,
  },
  heroCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#131B2E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroSubText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: theme.colors.onSurfaceVariant,
  },
  heroTimerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  heroTimerMain: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  heroTimerSecs: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(67, 70, 85, 0.7)',
  },
  gaugeContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenterText: {
    position: 'absolute',
  },
  gaugePercent: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  progressSection: {
    marginTop: theme.spacing.md,
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  progressLabelBold: {
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  progressLabelGreen: {
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  heroStatGrid: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatCaption: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  actionSection: {
    gap: 10,
  },
  heroButtonWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  heroClockOutButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  heroButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  heroButtonPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  balanceCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondaryBright,
  },
  balanceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSurface,
    letterSpacing: 0.6,
  },
  surplusBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  surplusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.onSecondaryContainer,
  },
  balanceStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
  },
  balanceStatValue: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.secondaryBright,
    letterSpacing: -0.5,
  },
  balanceStatDesc: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  balanceProjectedCol: {
    alignItems: 'flex-end',
  },
  balanceProjectedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  balanceProjectedLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  balanceBreakdownBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
    marginTop: 6,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breakdownText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownBold: {
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  breakdownBoldGreen: {
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  ledgerCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ledgerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  ledgerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  ledgerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ledgerBox: {
    width: '48.5%',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.lg,
  },
  ledgerBoxLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  ledgerBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  ledgerBoxAlert: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.tertiaryBright,
    marginTop: 2,
  },
  ledgerBoxGreen: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondaryBright,
    marginTop: 2,
  },
  ledgerBoxMuted: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  insightCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  insightEmoji: {
    fontSize: 16,
  },
  insightText: {
    fontSize: 13,
    color: theme.colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  insightBoldPrimary: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  insightBold: {
    fontWeight: '700',
  },
  recentSection: {
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 12,
    borderRadius: theme.radius.lg,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentIconBox: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemTexts: {
    flex: 1,
  },
  recentItemDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  recentPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  recentItemTimes: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  recentItemRight: {
    alignItems: 'flex-end',
  },
  recentItemHours: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  recentItemTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
