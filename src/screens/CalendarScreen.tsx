import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { api } from '../services/apiClient';

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

interface CalendarScreenProps {
  onOpenAdjustment: (date: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onOpenAdjustment,
  showToast,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const yearNum = currentDate.getFullYear();
  const monthNum = currentDate.getMonth() + 1;
  const monthKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const currentMonthLabel = `${monthName} ${yearNum}`;

  React.useEffect(() => {
    let isMounted = true;
    api.getCalendar(monthKey)
      .then((data) => {
        if (!isMounted) return;

        // Generate Monday-first offset days
        const firstDay = new Date(yearNum, currentDate.getMonth(), 1);
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
        const prevMonthLastDate = new Date(yearNum, currentDate.getMonth(), 0).getDate();
        const offsets: CalendarDay[] = [];
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
          offsets.push({
            day: prevMonthLastDate - i,
            weekday: '',
            dateStr: '',
            status: 'offset',
          });
        }

        const mapped: CalendarDay[] = (data || []).map((d: any) => ({
          day: d.day,
          weekday: d.weekday,
          dateStr: d.date,
          status: d.status.toLowerCase() as any,
          delta: d.deltaStr,
          inTime: d.inTime || undefined,
          outTime: d.outTime || undefined,
          worked: d.productiveTime || undefined,
          progressPercent: d.progressPercent,
        }));

        const fullDays = [...offsets, ...mapped];
        setCalendarDays(fullDays);

        // Find today if in this month, or first real day
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayMatch = fullDays.find((d) => d.dateStr === todayStr);
        const firstRealDay = fullDays.find((d) => d.status !== 'offset');
        setSelectedDay((prev) => {
          if (prev && fullDays.some((d) => d.dateStr === prev.dateStr)) {
            return fullDays.find((d) => d.dateStr === prev.dateStr) || prev;
          }
          return todayMatch || firstRealDay || null;
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [monthKey, yearNum, currentDate]);

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
    showToast(`Navigated to ${prev.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
    showToast(`Navigated to ${next.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`);
  };

  const handleDaySelect = (day: CalendarDay) => {
    if (day.status === 'offset') return;
    setSelectedDay(day);
  };

  // Dynamic Bento Grid Metrics from loaded calendar days
  const realDays = calendarDays.filter((d) => d.status !== 'offset' && d.status !== 'weekend');
  const loggedDays = calendarDays.filter(
    (d) => d.status === 'extra' || d.status === 'deficit' || d.status === 'active' || (d.status === 'balanced' && d.inTime)
  );
  const totalWorkdays = realDays.length || 22;
  const loggedCount = loggedDays.length;
  const progressPercentVal = Math.min(100, Math.round((loggedCount / totalWorkdays) * 100));

  let netBalanceMins = 0;
  let onTimePunches = 0;
  for (const ld of loggedDays) {
    if (ld.delta) {
      const match = ld.delta.match(/([+−-]?\d+)m/);
      if (match) {
        const val = parseInt(match[1].replace('−', '-'), 10);
        if (!isNaN(val)) netBalanceMins += val;
      }
    }
    if (ld.status !== 'deficit') onTimePunches++;
  }

  const activeSelected = selectedDay || {
    day: 1,
    weekday: 'Workday',
    dateStr: `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`,
    status: 'balanced' as const,
    delta: '0m',
  };

  const isTodaySelected = activeSelected.dateStr === new Date().toISOString().slice(0, 10);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Controls: Month Selector & View Toggle */}
      <View style={styles.headerControls}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.navChevronBtn}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.monthLabelRow}>
            <Text style={styles.monthLabelText}>{currentMonthLabel}</Text>
            <View style={styles.monthDot} />
          </View>

          <TouchableOpacity
            style={styles.navChevronBtn}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-right" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === 'month' && styles.segmentBtnActive,
            ]}
            onPress={() => setViewMode('month')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                viewMode === 'month' && styles.segmentTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              viewMode === 'week' && styles.segmentBtnActive,
            ]}
            onPress={() => setViewMode('week')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                viewMode === 'week' && styles.segmentTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Monthly High-Level Stats Strip (2x2 Grid Bento) */}
      <View style={styles.bentoGrid}>
        {/* Stat 1: Days Logged */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>DAYS LOGGED</Text>
            <MaterialIcons name="event-available" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={styles.bentoStatMain}>{loggedCount}</Text>
            <Text style={styles.bentoStatSub}>/ {totalWorkdays} days</Text>
          </View>
          <View style={styles.bentoProgressTrack}>
            <View style={[styles.bentoProgressFill, { width: `${progressPercentVal}%` }]} />
          </View>
        </View>

        {/* Stat 2: Daily Avg */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>DAILY AVG</Text>
            <MaterialIcons name="timelapse" size={16} color={theme.colors.secondaryBright} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={styles.bentoStatMain}>
              {loggedCount > 0 ? (loggedDays[0]?.worked || '7h 45m') : '0h 00m'}
            </Text>
            <Text style={styles.bentoStatPercentGreen}>
              {loggedCount > 0 ? `${progressPercentVal}%` : '0%'}
            </Text>
          </View>
          <Text style={styles.bentoTargetText}>Target: 7h 45m</Text>
        </View>

        {/* Stat 3: Net Balance */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>NET BALANCE</Text>
            <View
              style={[
                styles.bentoGreenDot,
                netBalanceMins < 0 && { backgroundColor: theme.colors.tertiaryBright },
              ]}
            />
          </View>
          <View style={styles.bentoStatRow}>
            <Text
              style={[
                styles.bentoStatMain,
                {
                  color:
                    netBalanceMins >= 0
                      ? theme.colors.secondaryBright
                      : theme.colors.tertiaryBright,
                },
              ]}
            >
              {netBalanceMins >= 0 ? `+${netBalanceMins}m` : `${netBalanceMins}m`}
            </Text>
          </View>
          <View
            style={[
              styles.bentoBadgeSurplus,
              netBalanceMins < 0 && { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text
              style={[
                styles.bentoBadgeSurplusText,
                netBalanceMins < 0 && { color: theme.colors.tertiaryBright },
              ]}
            >
              {netBalanceMins > 0 ? 'Surplus Banked' : netBalanceMins < 0 ? 'Deficit Time' : 'Balanced'}
            </Text>
          </View>
        </View>

        {/* Stat 4: On-Time */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>ON-TIME</Text>
            <MaterialIcons name="verified" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={styles.bentoStatMain}>
              {loggedCount > 0 ? `${Math.round((onTimePunches / loggedCount) * 100)}%` : '0%'}
            </Text>
            <Text style={styles.bentoStatSub}>
              ({onTimePunches}/{loggedCount})
            </Text>
          </View>
          <Text style={styles.bentoTargetText}>
            {loggedCount - onTimePunches > 0
              ? `${loggedCount - onTimePunches} delayed punches`
              : 'Zero tardiness recorded'}
          </Text>
        </View>
      </View>

      {/* 3. Interactive Monthly Calendar Grid Card */}
      <View style={styles.calendarCard}>
        {/* Day Name Header Row */}
        <View style={styles.weekHeaderRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, index) => (
            <Text
              key={index}
              style={[
                styles.weekHeaderDay,
                index >= 5 && { color: theme.colors.outline },
              ]}
            >
              {dayChar}
            </Text>
          ))}
        </View>

        {/* 7-Column Day Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((d, index) => {
            const isSelected = activeSelected.day === d.day && activeSelected.status === d.status;

            if (d.status === 'offset') {
              return (
                <View key={`offset-${index}`} style={styles.offsetCell}>
                  <Text style={styles.offsetCellText}>{d.day}</Text>
                </View>
              );
            }

            if (d.status === 'weekend') {
              return (
                <TouchableOpacity
                  key={`weekend-${d.day}`}
                  activeOpacity={0.7}
                  onPress={() => handleDaySelect(d)}
                  style={[styles.weekendCell, isSelected && styles.cellSelected]}
                >
                  <Text style={styles.weekendCellText}>{d.day}</Text>
                </TouchableOpacity>
              );
            }

            if (d.status === 'future') {
              return (
                <TouchableOpacity
                  key={`future-${d.day}`}
                  activeOpacity={0.7}
                  onPress={() => handleDaySelect(d)}
                  style={[styles.futureCell, isSelected && styles.cellSelected]}
                >
                  <Text style={styles.futureCellText}>{d.day}</Text>
                  <Text style={styles.futureSchedText}>Sched</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={`day-${d.day}`}
                activeOpacity={0.75}
                onPress={() => handleDaySelect(d)}
                style={[
                  styles.dayCell,
                  d.status === 'active' && styles.activeLiveCell,
                  isSelected && styles.cellSelected,
                ]}
              >
                {d.status === 'active' && <View style={styles.livePulseCorner} />}
                <Text
                  style={[
                    styles.dayCellNumber,
                    d.status === 'active' && { color: theme.colors.primary, fontWeight: '800' },
                  ]}
                >
                  {d.day}
                </Text>

                {d.status === 'extra' && (
                  <View style={styles.extraPill}>
                    <Text style={styles.extraPillText}>{d.delta}</Text>
                  </View>
                )}

                {d.status === 'deficit' && (
                  <View style={styles.deficitPill}>
                    <Text style={styles.deficitPillText}>{d.delta}</Text>
                  </View>
                )}

                {d.status === 'balanced' && d.inTime && <View style={styles.balancedDot} />}

                {d.status === 'active' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>LIVE</Text>
                  </View>
                )}

                {d.status === 'warning' && <View style={styles.warningDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Selected Day Detail Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailTopAccent} />

        <View style={styles.detailHeader}>
          <View>
            <View style={styles.detailTitleRow}>
              <Text style={styles.detailDateText}>
                {activeSelected.weekday || 'Day'}, {monthName} {activeSelected.day}
              </Text>
              <View
                style={[
                  styles.detailDayTag,
                  isTodaySelected
                    ? { backgroundColor: theme.colors.primaryFixed }
                    : { backgroundColor: theme.colors.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[
                    styles.detailDayTagText,
                    isTodaySelected
                      ? { color: theme.colors.primary }
                      : { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {isTodaySelected ? 'Today' : `Day ${activeSelected.day}`}
                </Text>
              </View>
            </View>
            <Text style={styles.detailShiftText}>Shift Window: Standard Schedule</Text>
          </View>

          {/* Status Pill */}
          <View
            style={[
              styles.detailStatusPill,
              activeSelected.status === 'extra' || activeSelected.status === 'active'
                ? { backgroundColor: '#85F8C460' }
                : activeSelected.status === 'deficit'
                ? { backgroundColor: theme.colors.errorContainer }
                : activeSelected.status === 'warning'
                ? { backgroundColor: '#FFECE2' }
                : { backgroundColor: theme.colors.surfaceContainer },
            ]}
          >
            <View
              style={[
                styles.detailStatusDot,
                activeSelected.status === 'extra' || activeSelected.status === 'active'
                  ? { backgroundColor: theme.colors.secondaryBright }
                  : activeSelected.status === 'deficit'
                  ? { backgroundColor: theme.colors.tertiaryBright }
                  : activeSelected.status === 'warning'
                  ? { backgroundColor: theme.colors.warning }
                  : { backgroundColor: theme.colors.outline },
              ]}
            />
            <Text
              style={[
                styles.detailStatusLabel,
                activeSelected.status === 'extra' || activeSelected.status === 'active'
                  ? { color: theme.colors.onSecondaryContainer }
                  : activeSelected.status === 'deficit'
                  ? { color: theme.colors.tertiaryBright }
                  : activeSelected.status === 'warning'
                  ? { color: theme.colors.warning }
                  : { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {activeSelected.status === 'extra'
                ? `${activeSelected.delta} Banked`
                : activeSelected.status === 'deficit'
                ? `${activeSelected.delta} Deficit`
                : activeSelected.status === 'active'
                ? 'Working Live'
                : activeSelected.status === 'warning'
                ? 'Missing Clock-Out'
                : activeSelected.status === 'weekend'
                ? 'Weekend Off'
                : activeSelected.inTime
                ? 'Balanced (0m)'
                : 'Not Recorded'}
            </Text>
          </View>
        </View>

        {/* Productive Progress Bar */}
        <View style={styles.detailProgressBox}>
          <View style={styles.detailProgressRow}>
            <Text style={styles.detailProgressLabel}>Productive Logged</Text>
            <Text style={styles.detailProgressValue}>
              {activeSelected.worked || '0h 00m'}{' '}
              <Text style={{ fontWeight: '400', color: theme.colors.onSurfaceVariant }}>
                / 7h 45m
              </Text>
            </Text>
          </View>
          <View style={styles.detailTrack}>
            <View
              style={[
                styles.detailFill,
                {
                  width: `${activeSelected.progressPercent || 0}%`,
                  backgroundColor:
                    activeSelected.status === 'deficit'
                      ? theme.colors.tertiaryBright
                      : activeSelected.status === 'warning'
                      ? theme.colors.tertiaryContainer
                      : theme.colors.primaryContainer,
                },
              ]}
            />
          </View>
        </View>

        {/* Punches Grid */}
        <View style={styles.detailPunchesGrid}>
          <View style={styles.detailPunchBox}>
            <View style={styles.detailPunchIcon}>
              <MaterialIcons name="login" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.detailPunchCaption}>PUNCHED IN</Text>
              <Text style={styles.detailPunchTime}>
                {activeSelected.inTime || 'Unrecorded'}
              </Text>
            </View>
          </View>

          <View style={styles.detailPunchBox}>
            <View style={styles.detailPunchIcon}>
              <MaterialIcons name="logout" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
            <View>
              <Text style={styles.detailPunchCaption}>CLOCK OUT</Text>
              <Text
                style={[
                  styles.detailPunchTime,
                  activeSelected.status === 'active' && { color: theme.colors.primary },
                ]}
              >
                {activeSelected.outTime || 'Unrecorded'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.detailActionsRow}>
          <TouchableOpacity
            style={styles.detailTimelineBtn}
            onPress={() =>
              showToast(
                `Punch details: In ${activeSelected.inTime || 'Unrecorded'} → Out ${activeSelected.outTime || 'Unrecorded'}`
              )
            }
            activeOpacity={0.7}
          >
            <MaterialIcons name="timeline" size={18} color={theme.colors.onSurface} />
            <Text style={styles.detailTimelineBtnText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailAdjustBtn}
            onPress={() => onOpenAdjustment(activeSelected.dateStr || `${yearNum}-${monthNum.toString().padStart(2, '0')}-${activeSelected.day.toString().padStart(2, '0')}`)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="edit-calendar" size={18} color="#FFFFFF" />
            <Text style={styles.detailAdjustBtnText}>Log Adjustment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Calendar Visual Legend Strip */}
      <View style={styles.legendCard}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>ATTENDANCE COLOR CODES</Text>
          <MaterialIcons name="info-outline" size={16} color={theme.colors.onSurfaceVariant} />
        </View>

        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.secondaryBright }]} />
            <Text style={styles.legendText}>Extra Time (≥ +5m)</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.tertiaryBright }]} />
            <Text style={styles.legendText}>Time Deficit (&lt; 0m)</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text style={styles.legendText}>Balanced (0m)</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary, borderWidth: 1.5, borderColor: theme.colors.primaryFixed },
              ]}
            />
            <Text style={[styles.legendText, { color: theme.colors.primary, fontWeight: '600' }]}>
              Currently Working
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.tertiaryContainer }]} />
            <Text style={styles.legendText}>Missing Out Punch</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: theme.colors.surfaceContainerHigh }]} />
            <Text style={styles.legendText}>Weekend / Holiday</Text>
          </View>
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
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navChevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  monthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerHigh,
    padding: 3,
    borderRadius: theme.radius.full,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoCard: {
    width: '48.5%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xl,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 88,
    ...Platform.select({
      ios: {
        shadowColor: '#131B2E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bentoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoCardCaption: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  bentoStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  bentoStatMain: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  bentoStatSub: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  bentoStatPercentGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  bentoProgressTrack: {
    height: 5,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  bentoProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  bentoTargetText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  bentoGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondaryBright,
  },
  bentoBadgeSurplus: {
    backgroundColor: '#85F8C460',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bentoBadgeSurplusText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.onSecondaryContainer,
  },
  calendarCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: 14,
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
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 4,
  },
  weekHeaderDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  offsetCell: {
    width: '13%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  offsetCellText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  weekendCell: {
    width: '13%',
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(234, 237, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekendCellText: {
    fontSize: 12,
    color: theme.colors.outline,
    fontWeight: '600',
  },
  futureCell: {
    width: '13%',
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  futureCellText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  futureSchedText: {
    fontSize: 7.5,
    color: theme.colors.outline,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayCell: {
    width: '13%',
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeLiveCell: {
    backgroundColor: theme.colors.primaryFixed,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  livePulseCorner: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  dayCellNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  extraPill: {
    backgroundColor: '#85F8C480',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
    marginTop: 2,
  },
  extraPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.onSecondaryContainer,
  },
  deficitPill: {
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
    marginTop: 2,
  },
  deficitPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.tertiaryBright,
  },
  balancedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.outlineVariant,
    marginTop: 4,
  },
  activeTagPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
    marginTop: 2,
  },
  activeTagPillText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.tertiaryContainer,
    marginTop: 3,
  },
  detailCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
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
  detailTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.colors.primaryContainer,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDateText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  detailDayTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  detailDayTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailShiftText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  detailStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 5,
  },
  detailStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailProgressBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.lg,
    padding: 10,
    gap: 6,
  },
  detailProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailProgressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  detailProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  detailTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailPunchesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  detailPunchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  detailPunchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPunchCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  detailPunchTime: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 1,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  detailTimelineBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailTimelineBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  detailAdjustBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailAdjustBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legendCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.xl,
    padding: 12,
    gap: 8,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 12,
  },
  legendItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: theme.colors.onSurface,
  },
});
