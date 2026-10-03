import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { AttendanceRecord, INITIAL_RECORDS } from '../data/mockData';

interface HistoryScreenProps {
  onOpenAdjustment: (date: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onOpenAdjustment,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'extra' | 'deficit' | 'balanced' | 'missing'>('all');
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [expandedId, setExpandedId] = useState<string>('rec-2');

  const filteredRecords = records.filter((rec) => {
    // Filter chip check
    if (activeFilter !== 'all' && rec.status !== activeFilter) {
      if (activeFilter === 'deficit' && rec.status !== 'deficit') return false;
      if (activeFilter === 'extra' && rec.status !== 'extra') return false;
      if (activeFilter === 'balanced' && rec.status !== 'balanced') return false;
      if (activeFilter === 'missing' && rec.status !== 'missing') return false;
    }

    // Search query check
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchDate = rec.dateStr.toLowerCase().includes(q);
      const matchDay = rec.dayLabel.toLowerCase().includes(q);
      const matchNotes = rec.notes ? rec.notes.toLowerCase().includes(q) : false;
      return matchDate || matchDay || matchNotes;
    }

    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Month Overview & Net Balance Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={styles.overviewTitleRow}>
            <MaterialIcons name="calendar-today" size={18} color={theme.colors.primary} />
            <Text style={styles.overviewTitle}>October 2026</Text>
          </View>
          <View style={styles.netPill}>
            <View style={styles.netPulseDot} />
            <Text style={styles.netPillText}>+50m Net</Text>
          </View>
        </View>

        <View style={styles.overviewMetricsRow}>
          <View style={styles.overviewMetricCol}>
            <Text style={styles.metricCaption}>WORKDAYS</Text>
            <Text style={styles.metricVal}>22 Days</Text>
          </View>
          <View style={styles.overviewMetricCol}>
            <Text style={styles.metricCaption}>LOGGED AVG</Text>
            <Text style={styles.metricVal}>8h 02m</Text>
          </View>
          <View style={styles.overviewMetricCol}>
            <Text style={styles.metricCaption}>STATUS</Text>
            <Text style={[styles.metricVal, { color: theme.colors.secondaryBright }]}>
              Surplus
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.outline} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search punches, tags, notes..."
            placeholderTextColor={theme.colors.outline}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <MaterialIcons name="cancel" size={16} color={theme.colors.outline} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.tuneButton}
          activeOpacity={0.7}
          onPress={() => showToast('Filtered for active cycle')}
        >
          <MaterialIcons name="tune" size={20} color={theme.colors.outline} />
        </TouchableOpacity>
      </View>

      {/* 3. Filter Pills (Scrollable) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            All (22)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'extra' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('extra')}
          activeOpacity={0.8}
        >
          <View style={[styles.chipDot, { backgroundColor: theme.colors.secondaryBright }]} />
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'extra' && styles.filterChipTextActive,
            ]}
          >
            Extra Time (🟢)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'deficit' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('deficit')}
          activeOpacity={0.8}
        >
          <View style={[styles.chipDot, { backgroundColor: theme.colors.tertiaryBright }]} />
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'deficit' && styles.filterChipTextActive,
            ]}
          >
            Adjustments (🔴)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'balanced' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('balanced')}
          activeOpacity={0.8}
        >
          <View style={[styles.chipDot, { backgroundColor: theme.colors.outline }]} />
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'balanced' && styles.filterChipTextActive,
            ]}
          >
            Balanced (⚪)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'missing' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('missing')}
          activeOpacity={0.8}
        >
          <View style={[styles.chipDot, { backgroundColor: theme.colors.tertiaryContainer }]} />
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'missing' && styles.filterChipTextActive,
            ]}
          >
            Missing (⚠️)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 4. Attendance Punch Cards List */}
      <View style={styles.cardsList}>
        {filteredRecords.map((rec) => {
          const isExpanded = expandedId === rec.id;

          // Special Card: Missing Punch Warning Alert
          if (rec.status === 'missing') {
            return (
              <View key={rec.id} style={styles.missingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardDate}>{rec.dateStr}</Text>
                    <Text style={styles.cardDaySub}>{rec.weekday}</Text>
                  </View>
                  <View style={styles.missingBadge}>
                    <MaterialIcons name="priority-high" size={13} color="#FFFFFF" />
                    <Text style={styles.missingBadgeText}>Missing Punch</Text>
                  </View>
                </View>

                <View style={styles.missingDetailsRow}>
                  <View>
                    <Text style={styles.missingLabel}>Clocked In</Text>
                    <Text style={styles.missingTime}>{rec.inTime}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.missingLabel}>Clocked Out</Text>
                    <View style={styles.missingUnrecordedRow}>
                      <MaterialIcons name="error" size={15} color={theme.colors.tertiaryBright} />
                      <Text style={styles.missingUnrecordedText}>Unrecorded</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.missingActionBtn}
                  onPress={() => onOpenAdjustment(rec.dateStr)}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="build" size={16} color="#FFFFFF" />
                  <Text style={styles.missingActionBtnText}>
                    Tap to correct clock-out
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // Special Card: Today (In Progress)
          if (rec.isToday) {
            return (
              <TouchableOpacity
                key={rec.id}
                style={styles.standardCard}
                onPress={() => setExpandedId(isExpanded ? '' : rec.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardDate}>{rec.dateStr}</Text>
                    <Text style={styles.cardDaySub}>(Today)</Text>
                  </View>
                  <View style={styles.workingBadge}>
                    <View style={styles.workingDot} />
                    <Text style={styles.workingBadgeText}>Working</Text>
                  </View>
                </View>

                <View style={styles.todayGrid}>
                  <View>
                    <Text style={styles.todayCaption}>Clocked In</Text>
                    <Text style={styles.todayTime}>{rec.inTime}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.todayCaption}>Office Elapsed</Text>
                    <Text style={[styles.todayTime, { color: theme.colors.primary }]}>
                      {rec.officeDuration}
                    </Text>
                  </View>
                </View>

                <View style={styles.todayFooter}>
                  <Text style={styles.todayFooterText}>Standard target: 7h 45m</Text>
                  <Text style={styles.todayFooterHighlight}>
                    Estimated wrap 6:53 PM
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          // Oct 2 or other expandable cards with timeline & breakdown
          return (
            <TouchableOpacity
              key={rec.id}
              style={[
                styles.standardCard,
                isExpanded && styles.expandedCard,
              ]}
              onPress={() => setExpandedId(isExpanded ? '' : rec.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardDate}>{rec.dateStr}</Text>
                    <Text style={styles.cardDaySub}>{rec.weekday}</Text>
                  </View>
                  <Text style={styles.cardLedgerSub}>
                    {rec.id === 'rec-2' ? "Yesterday's Ledger Entry" : 'Attendance Record'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusChip,
                    rec.status === 'extra'
                      ? { backgroundColor: theme.colors.secondaryContainer }
                      : rec.status === 'deficit'
                      ? { backgroundColor: theme.colors.errorContainer }
                      : { backgroundColor: theme.colors.surfaceContainer },
                  ]}
                >
                  <View
                    style={[
                      styles.statusChipDot,
                      rec.status === 'extra'
                        ? { backgroundColor: theme.colors.secondaryBright }
                        : rec.status === 'deficit'
                        ? { backgroundColor: theme.colors.tertiaryBright }
                        : { backgroundColor: theme.colors.outline },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      rec.status === 'extra'
                        ? { color: theme.colors.onSecondaryContainer }
                        : rec.status === 'deficit'
                        ? { color: theme.colors.tertiaryBright }
                        : { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {rec.deltaStr}
                  </Text>
                </View>
              </View>

              {/* Quick Metrics Ribbon */}
              <View style={styles.metricsRibbon}>
                <View style={styles.metricRibbonCol}>
                  <Text style={styles.ribbonCaption}>Office Time</Text>
                  <Text style={styles.ribbonVal}>{rec.officeDuration}</Text>
                </View>
                <View style={styles.metricRibbonCol}>
                  <Text style={styles.ribbonCaption}>Productive</Text>
                  <Text
                    style={[
                      styles.ribbonVal,
                      rec.status === 'extra' && { color: theme.colors.secondaryBright },
                    ]}
                  >
                    {rec.productiveDuration}
                  </Text>
                </View>
                <View style={styles.metricRibbonCol}>
                  <Text style={styles.ribbonCaption}>Day Delta</Text>
                  <Text
                    style={[
                      styles.ribbonVal,
                      rec.status === 'extra'
                        ? { color: theme.colors.secondaryBright }
                        : rec.status === 'deficit'
                        ? { color: theme.colors.tertiaryBright }
                        : { color: theme.colors.onSurface },
                    ]}
                  >
                    {rec.deltaStr}
                  </Text>
                </View>
              </View>

              {/* Expanded Section (Timeline & Calculation Breakdown) */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  {/* Visual Punch Timeline */}
                  {rec.timeline && (
                    <View style={styles.timelineSection}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineHeaderTitle}>
                          VISUAL PUNCH TIMELINE
                        </Text>
                        <Text style={styles.timelineHeaderSubtitle}>
                          10m Early Start
                        </Text>
                      </View>

                      <View style={styles.timelineContainer}>
                        {rec.timeline.map((step, idx) => (
                          <View key={idx} style={styles.timelineStepRow}>
                            <View style={styles.timelineLineCol}>
                              <View
                                style={[
                                  styles.timelineDot,
                                  step.type === 'in'
                                    ? { backgroundColor: theme.colors.secondaryBright }
                                    : step.type === 'out'
                                    ? { backgroundColor: theme.colors.primary }
                                    : { backgroundColor: theme.colors.outlineVariant },
                                ]}
                              />
                              {idx < rec.timeline!.length - 1 && (
                                <View style={styles.timelineVerticalLine} />
                              )}
                            </View>

                            <View style={styles.timelineContentRow}>
                              <View>
                                <Text style={styles.timelineStepTime}>
                                  {step.time}
                                </Text>
                                <Text style={styles.timelineStepTitle}>
                                  {step.title}
                                </Text>
                              </View>
                              {step.badge && (
                                <View style={styles.timelineBadge}>
                                  <Text style={styles.timelineBadgeText}>
                                    {step.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Calculation Breakdown Table */}
                  {rec.breakdown && (
                    <View style={styles.breakdownTable}>
                      <Text style={styles.breakdownTableTitle}>
                        CALCULATION BREAKDOWN
                      </Text>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Gross Office Time</Text>
                        <Text style={styles.breakdownVal}>
                          {rec.breakdown.grossTime}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>
                          Lunch + Buffer Deductions
                        </Text>
                        <Text style={[styles.breakdownVal, { color: theme.colors.tertiaryBright }]}>
                          {rec.breakdown.deductions}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Net Productive Work</Text>
                        <Text style={styles.breakdownValBold}>
                          {rec.breakdown.netProductive}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Required Target</Text>
                        <Text style={styles.breakdownVal}>
                          {rec.breakdown.requiredTarget}
                        </Text>
                      </View>
                      <View style={styles.breakdownDivider} />
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownTotalLabel}>Day Balance</Text>
                        <Text style={styles.breakdownTotalVal}>
                          {rec.breakdown.dayBalance}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownSub}>Cumulative Month Position</Text>
                        <Text style={styles.breakdownSubVal}>
                          {rec.breakdown.cumulativeBalance}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Actions inside expanded card */}
                  <View style={styles.expandedActionsRow}>
                    <TouchableOpacity
                      style={styles.expandedEditBtn}
                      onPress={() => onOpenAdjustment(rec.dateStr)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="edit-calendar" size={16} color={theme.colors.onSurface} />
                      <Text style={styles.expandedEditBtnText}>
                        Edit / Correct Entry
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.expandedExportBtn}
                      onPress={() => showToast(`Timesheet slip for ${rec.dateStr} generated`)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="file-download" size={16} color={theme.colors.onSurface} />
                      <Text style={styles.expandedExportBtnText}>Export Slip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  overviewCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: 12,
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
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  netPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#85F8C440',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 5,
  },
  netPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondaryBright,
  },
  netPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSecondaryContainer,
  },
  overviewMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  overviewMetricCol: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  metricCaption: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#131B2E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onSurface,
  },
  tuneButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceContainerLowest,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardsList: {
    gap: 10,
  },
  standardCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: 10,
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
  expandedCard: {
    borderWidth: 1.5,
    borderColor: theme.colors.primaryFixed,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  cardDaySub: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  cardLedgerSub: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRibbon: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  metricRibbonCol: {
    flex: 1,
    alignItems: 'center',
  },
  ribbonCaption: {
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  ribbonVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  todayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  todayCaption: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  todayTime: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  todayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  todayFooterText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  todayFooterHighlight: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  workingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  workingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  workingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  missingCard: {
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.errorContainer,
  },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryBright,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  missingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  missingLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  missingTime: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  missingUnrecordedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  missingUnrecordedText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.tertiaryBright,
  },
  missingActionBtn: {
    height: 42,
    backgroundColor: theme.colors.tertiaryBright,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  missingActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandedSection: {
    marginTop: 6,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(19, 27, 46, 0.08)',
    paddingTop: 10,
  },
  timelineSection: {
    gap: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  timelineHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  timelineContainer: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.lg,
    padding: 12,
    gap: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 38,
  },
  timelineLineCol: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineVerticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerHighest,
    marginVertical: 2,
  },
  timelineContentRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 6,
  },
  timelineStepTime: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  timelineStepTitle: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  timelineBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  timelineBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  breakdownTable: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radius.lg,
    padding: 12,
    gap: 6,
  },
  breakdownTableTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  breakdownValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.08)',
    marginVertical: 4,
  },
  breakdownTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  breakdownTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.secondaryBright,
  },
  breakdownSub: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownSubVal: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  expandedActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  expandedEditBtn: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expandedEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  expandedExportBtn: {
    width: 110,
    height: 42,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expandedExportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});
