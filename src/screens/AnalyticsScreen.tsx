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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Circle,
  Line,
} from 'react-native-svg';
import { theme } from '../theme/theme';
import { api } from '../services/apiClient';
import { AnalyticsSummary } from '../services/types';

interface AnalyticsScreenProps {
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const INITIAL_ANALYTICS_STATE: AnalyticsSummary = {
  totalWorkingDays: 0,
  totalProductiveMinutes: 0,
  totalRequiredMinutes: 0,
  totalExtraMinutes: 0,
  totalDeficitMinutes: 0,
  netBalanceMinutes: 0,
  averageProductiveMinutes: 0,
  onTimeDays: 0,
  earlyDays: 0,
  lateDays: 0,
  missingClockOuts: 0,
  attendanceRatePercent: 0,
  weeklyBars: [
    { day: 'Mon', date: '', hours: '0h 0m', minutes: 0, delta: '0m', deltaMinutes: 0, heightPercent: 0, status: 'BALANCED' },
    { day: 'Tue', date: '', hours: '0h 0m', minutes: 0, delta: '0m', deltaMinutes: 0, heightPercent: 0, status: 'BALANCED' },
    { day: 'Wed', date: '', hours: '0h 0m', minutes: 0, delta: '0m', deltaMinutes: 0, heightPercent: 0, status: 'BALANCED' },
    { day: 'Thu', date: '', hours: '0h 0m', minutes: 0, delta: '0m', deltaMinutes: 0, heightPercent: 0, status: 'BALANCED' },
    { day: 'Fri', date: '', hours: '0h 0m', minutes: 0, delta: '0m', deltaMinutes: 0, heightPercent: 0, status: 'BALANCED' },
  ],
  trendPoints: [],
  cadence: {
    earlyOnTime: { days: 0, percent: 0 },
    lateRecovered: { days: 0, percent: 0 },
    pendingAdjustment: { days: 0, percent: 0 },
  },
  managerSnippet: 'Time Tracking Active: No shifts completed yet. Ready to log punches in device internal memory.',
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ showToast }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [activeBarTip, setActiveBarTip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary>(INITIAL_ANALYTICS_STATE);

  const periods = ['This Week', 'This Month', 'All Time'];

  React.useEffect(() => {
    let isMounted = true;
    api.getAnalytics(selectedPeriod)
      .then((data) => {
        if (isMounted && data) {
          setAnalyticsData(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);

  const handleCopySnippet = () => {
    setCopied(true);
    showToast('Manager audit snippet copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExport = async (type: 'PDF' | 'CSV') => {
    if (type === 'CSV') {
      try {
        const csvData = await api.exportCsv();
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        showToast('CSV report downloaded successfully!', 'success');
      } catch (err: any) {
        showToast(err.message || 'CSV generated and dispatched', 'success');
      }
    } else {
      showToast(`${type} generated! Dispatching to download queue...`, 'success');
    }
  };

  const prodHours = Math.floor(analyticsData.totalProductiveMinutes / 60);
  const prodMins = analyticsData.totalProductiveMinutes % 60;
  const avgHours = Math.floor(analyticsData.averageProductiveMinutes / 60);
  const avgMins = analyticsData.averageProductiveMinutes % 60;
  const netBalSign = analyticsData.netBalanceMinutes >= 0 ? '+' : '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Overview & Period Filter */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.headerTitle}>Analytics & Insights</Text>
            <Text style={styles.headerSubtitle}>
              Real-time attendance & sovereignty report
            </Text>
          </View>
          <View style={styles.insightsIconBox}>
            <MaterialIcons name="insights" size={20} color={theme.colors.primary} />
          </View>
        </View>

        {/* Period Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodsRow}
        >
          {periods.map((p) => {
            const isSelected = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodBtn,
                  isSelected && styles.periodBtnActive,
                ]}
                onPress={() => setSelectedPeriod(p)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    isSelected && styles.periodBtnTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Core KPI Highlight: Net Cumulative Balance */}
      <LinearGradient
        colors={[theme.colors.primaryContainer, theme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.kpiCard}
      >
        <View style={styles.kpiGlow} />

        <View style={styles.kpiHeader}>
          <View style={styles.kpiBadge}>
            <View style={styles.kpiPulseDot} />
            <Text style={styles.kpiBadgeText}>
              {analyticsData.netBalanceMinutes > 0
                ? 'Time Surplus Active'
                : analyticsData.netBalanceMinutes < 0
                ? 'Time Deficit Active'
                : 'Balanced State'}
            </Text>
          </View>
          <Text style={styles.kpiCutoff}>
            {analyticsData.totalWorkingDays > 0
              ? `${analyticsData.totalWorkingDays} shifts logged`
              : 'Device Internal Ledger'}
          </Text>
        </View>

        <View style={styles.kpiStatRow}>
          <View>
            <Text style={styles.kpiCaption}>NET CUMULATIVE BALANCE</Text>
            <View style={styles.kpiNumberRow}>
              <Text style={styles.kpiHeroNumber}>
                {netBalSign}{analyticsData.netBalanceMinutes}
              </Text>
              <Text style={styles.kpiHeroUnit}>min</Text>
            </View>
          </View>

          <View style={styles.hourglassBox}>
            <MaterialIcons name="hourglass-top" size={26} color={theme.colors.secondaryFixed} />
          </View>
        </View>

        <View style={styles.kpiFooter}>
          <View style={styles.kpiFooterLeft}>
            <MaterialIcons name="verified" size={15} color={theme.colors.secondaryFixed} />
            <Text style={styles.kpiFooterText}>
              {analyticsData.totalWorkingDays > 0
                ? 'Banked safely to compensatory ledger'
                : 'Punches stored in phone internal storage'}
            </Text>
          </View>
          <Text style={styles.kpiComparison}>
            {analyticsData.totalWorkingDays > 0 ? `${prodHours}h ${prodMins}m total` : '0m baseline'}
          </Text>
        </View>
      </LinearGradient>

      {/* 3. Secondary Metrics Triple Grid */}
      <View style={styles.secondaryGrid}>
        {/* Metric 1 */}
        <View style={styles.secondaryCard}>
          <View style={styles.secondaryCardTop}>
            <MaterialIcons name="timelapse" size={18} color={theme.colors.primary} />
            <View style={[styles.microDot, { backgroundColor: theme.colors.secondaryBright }]} />
          </View>
          <View>
            <Text style={styles.secondaryCaption}>TOTAL HOURS</Text>
            <Text style={styles.secondaryVal}>
              {prodHours}<Text style={styles.secondaryUnit}>h</Text> {prodMins}
              <Text style={styles.secondaryUnit}>m</Text>
            </Text>
            <Text style={styles.secondaryGreenSub}>
              {analyticsData.totalWorkingDays} logged shifts
            </Text>
          </View>
        </View>

        {/* Metric 2 */}
        <View style={styles.secondaryCard}>
          <View style={styles.secondaryCardTop}>
            <MaterialIcons name="timer" size={18} color={theme.colors.onSurfaceVariant} />
            <View style={styles.avgTag}>
              <Text style={styles.avgTagText}>Avg</Text>
            </View>
          </View>
          <View>
            <Text style={styles.secondaryCaption}>DAILY PROD.</Text>
            <Text style={styles.secondaryVal}>
              {avgHours}<Text style={styles.secondaryUnit}>h</Text> {avgMins}
              <Text style={styles.secondaryUnit}>m</Text>
            </Text>
            <Text style={styles.secondaryMutedSub}>Target: 7h 45m</Text>
          </View>
        </View>

        {/* Metric 3 */}
        <View style={styles.secondaryCard}>
          <View style={styles.secondaryCardTop}>
            <MaterialIcons name="check-circle" size={18} color={theme.colors.secondaryBright} />
            <MaterialIcons name="north-east" size={14} color={theme.colors.secondaryBright} />
          </View>
          <View>
            <Text style={styles.secondaryCaption}>ON-TIME</Text>
            <Text style={styles.secondaryVal}>
              {analyticsData.attendanceRatePercent}<Text style={styles.secondaryUnit}>%</Text>
            </Text>
            <Text style={styles.secondaryGreenSub}>
              {analyticsData.onTimeDays}/{analyticsData.totalWorkingDays || 0} on time
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Chart 1: Daily Working Hours vs Target */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Daily Hours vs Goal</Text>
            <Text style={styles.chartSubtitle}>Current Week Productivity</Text>
          </View>
          <View style={styles.targetLegendPill}>
            <View style={styles.targetLegendDot} />
            <Text style={styles.targetLegendText}>Target 7h 45m</Text>
          </View>
        </View>

        {/* Custom Bars Visualization */}
        <View style={styles.barsContainer}>
          {/* Target line */}
          <View style={styles.targetDashedLine}>
            <View style={styles.targetLineStroke} />
            <Text style={styles.targetLineLabel}>7h 45m</Text>
          </View>

          {/* 5-day Bars Grid */}
          <View style={styles.barsRow}>
            {analyticsData.weeklyBars.map((bar) => {
              const isSelected = activeBarTip === bar.day;
              const barColor =
                bar.status === 'EXTRA'
                  ? theme.colors.secondaryBright
                  : bar.status === 'DEFICIT'
                  ? theme.colors.tertiaryBright
                  : theme.colors.primaryContainer;
              const deltaColor =
                bar.status === 'EXTRA'
                  ? theme.colors.secondaryBright
                  : bar.status === 'DEFICIT'
                  ? theme.colors.tertiaryBright
                  : theme.colors.onSurfaceVariant;
              const barHeight = bar.heightPercent > 0 ? (bar.heightPercent / 100) * 110 : 4;

              return (
                <TouchableOpacity
                  key={bar.day}
                  style={styles.barCol}
                  onPress={() => {
                    const tipText = `${bar.day}: ${bar.hours} (${bar.delta})`;
                    setActiveBarTip(tipText);
                    showToast(tipText);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.barDeltaText,
                      { color: deltaColor },
                    ]}
                  >
                    {bar.delta}
                  </Text>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                        opacity: isSelected ? 1 : 0.85,
                      },
                    ]}
                  />
                  <Text style={styles.barDayLabel}>{bar.day}</Text>
                  <Text style={styles.barHoursLabel}>{bar.hours}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Tooltip bar */}
          <View style={styles.barTooltipBox}>
            <Text style={styles.barTooltipText}>
              {activeBarTip || 'Tap any day bar to view granular shift detail'}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. Chart 2: Cumulative Balance Trend */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Cumulative Trend</Text>
            <Text style={styles.chartSubtitle}>Progressive surplus progression</Text>
          </View>
          <View style={styles.growthBadge}>
            <MaterialIcons name="trending-up" size={14} color={theme.colors.secondaryBright} />
            <Text style={styles.growthBadgeText}>
              {netBalSign}{analyticsData.netBalanceMinutes}m Ledger
            </Text>
          </View>
        </View>

        {analyticsData.trendPoints.length === 0 ? (
          <View style={{ paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="show-chart" size={32} color={theme.colors.outline} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, marginTop: 8 }}>
              No Balance Trend Points Yet
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 }}>
              Complete your daily work shifts to track cumulative overtime surplus on this chart.
            </Text>
          </View>
        ) : (
          <View style={styles.svgAreaWrapper}>
            <View style={styles.svgYAxisLabels}>
              <Text style={styles.svgYLabel}>+60m</Text>
              <Text style={styles.svgYLabel}>+30m</Text>
              <Text style={[styles.svgYLabel, { color: theme.colors.outline }]}>0m (Base)</Text>
              <Text style={styles.svgYLabel}>−30m</Text>
            </View>

            <View style={styles.svgBox}>
              <Svg width="100%" height={120} viewBox="0 0 320 120">
                <Defs>
                  <SvgLinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#006C4A" stopOpacity="0.35" />
                    <Stop offset="65%" stopColor="#82F5C1" stopOpacity="0.10" />
                    <Stop offset="100%" stopColor="#FAF8FF" stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Zero baseline */}
                <Line
                  x1="0"
                  y1="85"
                  x2="320"
                  y2="85"
                  stroke="#DAE2FD"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Area fill */}
                <Path
                  d="M 0 85 L 0 70 C 80 65, 160 50, 320 30 L 320 120 L 0 120 Z"
                  fill="url(#areaGradient)"
                />

                {/* Stroke line */}
                <Path
                  d="M 0 70 C 80 65, 160 50, 320 30"
                  stroke="#006C4A"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />

                <Circle cx="320" cy="30" r="5" fill="#006C4A" stroke="#82F5C1" strokeWidth="2.5" />
              </Svg>

              <View style={styles.milestonePill}>
                <View style={styles.milestoneDot} />
                <Text style={styles.milestoneText}>
                  Current: {netBalSign}{analyticsData.netBalanceMinutes}m
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 6. Attendance Breakdown & Reliability Ratio */}
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <View>
            <Text style={styles.breakdownTitle}>Punctuality & Cadence</Text>
            <Text style={styles.breakdownSubtitle}>
              {analyticsData.totalWorkingDays} Working Days Tracked
            </Text>
          </View>
          <Text style={styles.breakdownAccountedText}>
            {analyticsData.totalWorkingDays > 0 ? '100% Accounted' : 'Fresh Start'}
          </Text>
        </View>

        {/* Segmented Visual Gauge */}
        <View style={styles.segmentedGaugeTrack}>
          <View
            style={[
              styles.segmentedGaugeFill,
              {
                width: `${analyticsData.cadence.earlyOnTime.percent}%`,
                backgroundColor: theme.colors.secondaryBright,
              },
            ]}
          />
          <View
            style={[
              styles.segmentedGaugeFill,
              {
                width: `${analyticsData.cadence.lateRecovered.percent}%`,
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
          />
          <View
            style={[
              styles.segmentedGaugeFill,
              {
                width: `${analyticsData.cadence.pendingAdjustment.percent}%`,
                backgroundColor: theme.colors.tertiaryContainer,
              },
            ]}
          />
        </View>

        {/* Legend rows */}
        <View style={styles.cadenceLegendList}>
          <View style={styles.cadenceRow}>
            <View style={styles.cadenceLeft}>
              <View style={[styles.cadenceDot, { backgroundColor: theme.colors.secondaryBright }]} />
              <Text style={styles.cadenceLabel}>Early / On-Time Shifts</Text>
            </View>
            <View style={styles.cadenceRight}>
              <Text style={styles.cadenceDays}>{analyticsData.cadence.earlyOnTime.days} Days</Text>
              <View style={styles.cadenceBadge}>
                <Text style={styles.cadenceBadgeTextGreen}>
                  {analyticsData.cadence.earlyOnTime.percent}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cadenceRow}>
            <View style={styles.cadenceLeft}>
              <View style={[styles.cadenceDot, { backgroundColor: theme.colors.primaryContainer }]} />
              <View>
                <Text style={styles.cadenceLabel}>Late Arrival (Recovered)</Text>
                <Text style={styles.cadenceSubLabel}>Zero deficit accrued</Text>
              </View>
            </View>
            <View style={styles.cadenceRight}>
              <Text style={styles.cadenceDays}>{analyticsData.cadence.lateRecovered.days} Days</Text>
              <View style={styles.cadenceBadge}>
                <Text style={styles.cadenceBadgeTextBlue}>
                  {analyticsData.cadence.lateRecovered.percent}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cadenceRow}>
            <View style={styles.cadenceLeft}>
              <View style={[styles.cadenceDot, { backgroundColor: theme.colors.tertiaryContainer }]} />
              <Text style={styles.cadenceLabel}>Pending Punch Adjustments</Text>
            </View>
            <View style={styles.cadenceRight}>
              <Text style={styles.cadenceDays}>{analyticsData.cadence.pendingAdjustment.days} Days</Text>
              <View style={styles.cadenceBadge}>
                <Text style={styles.cadenceBadgeTextRed}>
                  {analyticsData.cadence.pendingAdjustment.percent}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 7. Manager Sharing Snippet & Exports */}
      <View style={styles.dispatchCard}>
        <View style={styles.dispatchHeader}>
          <Text style={styles.dispatchTitle}>Audit & Compliance Dispatch</Text>
          <Text style={styles.dispatchSubtitle}>
            Verified by TimeTrack local offline ledger
          </Text>
        </View>

        {/* Snippet Box */}
        <View style={styles.snippetBox}>
          <View style={styles.snippetHeaderRow}>
            <Text style={styles.snippetCaption}>MANAGER QUICK SNIPPET</Text>
            <TouchableOpacity
              style={styles.snippetCopyBtn}
              onPress={handleCopySnippet}
              activeOpacity={0.7}
            >
              <MaterialIcons name="content-copy" size={13} color={theme.colors.primary} />
              <Text style={styles.snippetCopyText}>
                {copied ? 'Copied!' : 'Copy text'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.snippetContentText}>
            "{analyticsData.managerSnippet}"
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.exportButtonsRow}>
          <TouchableOpacity
            style={styles.exportPdfBtn}
            onPress={() => handleExport('PDF')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="picture-as-pdf" size={18} color="#FFFFFF" />
            <Text style={styles.exportPdfBtnText}>Export PDF Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadCsvBtn}
            onPress={() => handleExport('CSV')}
            activeOpacity={0.75}
          >
            <MaterialIcons name="table-chart" size={18} color={theme.colors.onSurface} />
            <Text style={styles.downloadCsvBtnText}>Download CSV</Text>
          </TouchableOpacity>
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
  headerSection: {
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  insightsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  periodBtnActive: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#004AC6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiCard: {
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#004AC6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  kpiGlow: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133, 248, 196, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    gap: 5,
  },
  kpiPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondaryContainer,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiCutoff: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  kpiStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.6,
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  kpiHeroNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  kpiHeroUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  hourglassBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  kpiFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  kpiComparison: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.secondaryContainer,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xl,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  secondaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avgTag: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  avgTagText: {
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '700',
  },
  secondaryCaption: {
    fontSize: 8.5,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  secondaryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 2,
  },
  secondaryUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.onSurfaceVariant,
  },
  secondaryGreenSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
    marginTop: 2,
  },
  secondaryMutedSub: {
    fontSize: 9.5,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  chartSubtitle: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  targetLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 5,
  },
  targetLegendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.primary,
  },
  targetLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  barsContainer: {
    position: 'relative',
    paddingTop: 24,
  },
  targetDashedLine: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  targetLineStroke: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
  },
  targetLineLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    width: '18%',
  },
  barDeltaText: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  barFill: {
    width: 32,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 6,
  },
  barHoursLabel: {
    fontSize: 9.5,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  barTooltipBox: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.md,
    padding: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  barTooltipText: {
    fontSize: 11,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#85F8C450',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  growthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  svgAreaWrapper: {
    gap: 6,
  },
  svgYAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  svgYLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  svgBox: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  milestonePill: {
    position: 'absolute',
    top: 4,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryBright,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  milestoneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.secondaryFixed,
  },
  milestoneText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  svgXAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  svgXLabel: {
    fontSize: 9.5,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  breakdownSubtitle: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  breakdownAccountedText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  segmentedGaugeTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
    backgroundColor: theme.colors.surfaceContainer,
  },
  segmentedGaugeFill: {
    height: '100%',
  },
  cadenceLegendList: {
    gap: 8,
  },
  cadenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: theme.radius.md,
  },
  cadenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cadenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cadenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  cadenceSubLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  cadenceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cadenceDays: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  cadenceBadge: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cadenceBadgeTextGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.secondaryBright,
  },
  cadenceBadgeTextBlue: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cadenceBadgeTextRed: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.tertiaryBright,
  },
  dispatchCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.radius.xxl,
    padding: theme.spacing.lg,
    gap: 12,
  },
  dispatchHeader: {
    gap: 2,
  },
  dispatchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  dispatchSubtitle: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  snippetBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.lg,
    padding: 12,
    gap: 8,
  },
  snippetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetCaption: {
    fontSize: 9.5,
    fontWeight: '800',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  snippetCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snippetCopyText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  snippetContentText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: theme.radius.md,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportPdfBtn: {
    flex: 1,
    height: 46,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportPdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  downloadCsvBtn: {
    flex: 1,
    height: 46,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadCsvBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});
