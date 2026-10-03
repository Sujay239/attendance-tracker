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
import { CalendarDay, INITIAL_CALENDAR_DAYS } from '../data/mockData';

interface CalendarScreenProps {
  onOpenAdjustment: (date: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onOpenAdjustment,
  showToast,
}) => {
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(INITIAL_CALENDAR_DAYS);

  // Selected Day state (defaults to Oct 23 / Today)
  const [selectedDay, setSelectedDay] = useState<CalendarDay>(
    calendarDays.find((d) => d.day === 23 && d.status === 'active') || calendarDays[25]
  );

  const handleDaySelect = (day: CalendarDay) => {
    if (day.status === 'offset') return;
    setSelectedDay(day);
  };

  const getDayName = (dayNumber: number) => {
    const dayNames = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    return dayNames[(dayNumber - 1) % 7] || 'Workday';
  };

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
            onPress={() => {
              setCurrentMonth('September 2026');
              showToast('Switched to September 2026 records');
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.monthLabelRow}>
            <Text style={styles.monthLabelText}>{currentMonth}</Text>
            <View style={styles.monthDot} />
          </View>

          <TouchableOpacity
            style={styles.navChevronBtn}
            onPress={() => {
              setCurrentMonth('November 2026');
              showToast('November schedule loaded');
            }}
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
            <Text style={styles.bentoStatMain}>22</Text>
            <Text style={styles.bentoStatSub}>/ 23 days</Text>
          </View>
          <View style={styles.bentoProgressTrack}>
            <View style={[styles.bentoProgressFill, { width: '95.6%' }]} />
          </View>
        </View>

        {/* Stat 2: Daily Avg */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>DAILY AVG</Text>
            <MaterialIcons name="timelapse" size={16} color={theme.colors.secondaryBright} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={styles.bentoStatMain}>7h 48m</Text>
            <Text style={styles.bentoStatPercentGreen}>98%</Text>
          </View>
          <Text style={styles.bentoTargetText}>Target: 7h 45m</Text>
        </View>

        {/* Stat 3: Net Balance */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>NET BALANCE</Text>
            <View style={styles.bentoGreenDot} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={[styles.bentoStatMain, { color: theme.colors.secondaryBright }]}>
              +50m
            </Text>
          </View>
          <View style={styles.bentoBadgeSurplus}>
            <Text style={styles.bentoBadgeSurplusText}>Surplus Banked</Text>
          </View>
        </View>

        {/* Stat 4: On-Time */}
        <View style={styles.bentoCard}>
          <View style={styles.bentoCardHeader}>
            <Text style={styles.bentoCardCaption}>ON-TIME</Text>
            <MaterialIcons name="verified" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.bentoStatRow}>
            <Text style={styles.bentoStatMain}>91%</Text>
            <Text style={styles.bentoStatSub}>(20/22)</Text>
          </View>
          <Text style={styles.bentoTargetText}>2 delayed punches</Text>
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
            const isSelected = selectedDay.day === d.day && selectedDay.status === d.status;

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

                {d.status === 'balanced' && <View style={styles.balancedDot} />}

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
                {getDayName(selectedDay.day)}, Oct {selectedDay.day}
              </Text>
              <View
                style={[
                  styles.detailDayTag,
                  selectedDay.day === 23
                    ? { backgroundColor: theme.colors.primaryFixed }
                    : { backgroundColor: theme.colors.surfaceContainerHigh },
                ]}
              >
                <Text
                  style={[
                    styles.detailDayTagText,
                    selectedDay.day === 23
                      ? { color: theme.colors.primary }
                      : { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {selectedDay.day === 23 ? 'Today' : `Day ${selectedDay.day}`}
                </Text>
              </View>
            </View>
            <Text style={styles.detailShiftText}>Shift Window: 09:00 AM – 05:00 PM</Text>
          </View>

          {/* Status Pill */}
          <View
            style={[
              styles.detailStatusPill,
              selectedDay.status === 'extra' || selectedDay.status === 'active'
                ? { backgroundColor: '#85F8C460' }
                : selectedDay.status === 'deficit'
                ? { backgroundColor: theme.colors.errorContainer }
                : selectedDay.status === 'warning'
                ? { backgroundColor: '#FFECE2' }
                : { backgroundColor: theme.colors.surfaceContainer },
            ]}
          >
            <View
              style={[
                styles.detailStatusDot,
                selectedDay.status === 'extra' || selectedDay.status === 'active'
                  ? { backgroundColor: theme.colors.secondaryBright }
                  : selectedDay.status === 'deficit'
                  ? { backgroundColor: theme.colors.tertiaryBright }
                  : selectedDay.status === 'warning'
                  ? { backgroundColor: theme.colors.warning }
                  : { backgroundColor: theme.colors.outline },
              ]}
            />
            <Text
              style={[
                styles.detailStatusLabel,
                selectedDay.status === 'extra' || selectedDay.status === 'active'
                  ? { color: theme.colors.onSecondaryContainer }
                  : selectedDay.status === 'deficit'
                  ? { color: theme.colors.tertiaryBright }
                  : selectedDay.status === 'warning'
                  ? { color: theme.colors.warning }
                  : { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {selectedDay.status === 'extra'
                ? `${selectedDay.delta} Banked`
                : selectedDay.status === 'deficit'
                ? `${selectedDay.delta} Deficit`
                : selectedDay.status === 'active'
                ? '+14m Projected'
                : selectedDay.status === 'warning'
                ? 'Missing Clock-Out'
                : selectedDay.status === 'weekend'
                ? 'Weekend Off'
                : 'Balanced (0m)'}
            </Text>
          </View>
        </View>

        {/* Productive Progress Bar */}
        <View style={styles.detailProgressBox}>
          <View style={styles.detailProgressRow}>
            <Text style={styles.detailProgressLabel}>Productive Logged</Text>
            <Text style={styles.detailProgressValue}>
              {selectedDay.worked || '7h 45m'}{' '}
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
                  width: `${selectedDay.progressPercent || 82}%`,
                  backgroundColor:
                    selectedDay.status === 'deficit'
                      ? theme.colors.tertiaryBright
                      : selectedDay.status === 'warning'
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
                {selectedDay.inTime || '09:00 AM'}
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
                  selectedDay.status === 'active' && { color: theme.colors.primary },
                ]}
              >
                {selectedDay.outTime || '05:00 PM'}
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
                `Punch sequence for Oct ${selectedDay.day}: In ${selectedDay.inTime || '09:00 AM'} → Out ${selectedDay.outTime || '05:00 PM'}`
              )
            }
            activeOpacity={0.7}
          >
            <MaterialIcons name="timeline" size={18} color={theme.colors.onSurface} />
            <Text style={styles.detailTimelineBtnText}>View Timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailAdjustBtn}
            onPress={() => onOpenAdjustment(`Oct ${selectedDay.day}, 2026`)}
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
