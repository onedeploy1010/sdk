/**
 * OneMetricsDashboard - Displays trading metrics and performance
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import type { ConsoleMetrics } from '../../../types/console';
import { formatPnl, formatPercent } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneMetricsDashboardProps {
  metrics: ConsoleMetrics;
  showNAV?: boolean;
  showPnL?: boolean;
  showTrades?: boolean;
  showPositions?: boolean;
  showStrategies?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneMetricsDashboard: React.FC<OneMetricsDashboardProps> = ({
  metrics,
  showNAV = true,
  showPnL = true,
  showTrades = true,
  showPositions = true,
  showStrategies = false,
  compact = false,
  style,
  dark = true,
}) => {
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';
  const cardBg = dark ? '#1A1A1F' : '#F9FAFB';

  const MetricCard = ({
    label,
    value,
    subValue,
    valueColor,
    icon,
  }: {
    label: string;
    value: string;
    subValue?: string;
    valueColor?: string;
    icon?: string;
  }) => (
    <View style={[styles.metricCard, { backgroundColor: cardBg }]}>
      <View style={styles.metricHeader}>
        {icon && <Text style={styles.metricIcon}>{icon}</Text>}
        <Text style={[styles.metricLabel, { color: textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: valueColor || textPrimary }]}>
        {value}
      </Text>
      {subValue && (
        <Text style={[styles.metricSubValue, { color: textSecondary }]}>
          {subValue}
        </Text>
      )}
    </View>
  );

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }, style]}>
        <View style={styles.compactItem}>
          <Text style={[styles.compactLabel, { color: textMuted }]}>NAV</Text>
          <Text style={[styles.compactValue, { color: textPrimary }]}>
            ${metrics.nav.toFixed(0)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Text style={[styles.compactLabel, { color: textMuted }]}>P&L</Text>
          <Text style={[
            styles.compactValue,
            { color: metrics.totalPnl >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {formatPnl(metrics.totalPnl)}
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Text style={[styles.compactLabel, { color: textMuted }]}>Win</Text>
          <Text style={[styles.compactValue, { color: textPrimary }]}>
            {(metrics.winRate * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Text style={[styles.compactLabel, { color: textMuted }]}>Pos</Text>
          <Text style={[styles.compactValue, { color: textPrimary }]}>
            {metrics.openPositions}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      {/* NAV Section */}
      {showNAV && (
        <View style={styles.navSection}>
          <View style={styles.navMain}>
            <Text style={[styles.navLabel, { color: textMuted }]}>Net Asset Value</Text>
            <Text style={[styles.navValue, { color: textPrimary }]}>
              ${metrics.nav.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.navChangeRow}>
              <Text style={[
                styles.navChange,
                { color: metrics.navChange24h >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {metrics.navChange24h >= 0 ? '+' : ''}${metrics.navChange24h.toFixed(2)}
              </Text>
              <Text style={[
                styles.navChangePercent,
                { color: metrics.navChange24h >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                ({formatPercent(metrics.navChangePercent24h)})
              </Text>
              <Text style={[styles.navPeriod, { color: textMuted }]}>24h</Text>
            </View>
          </View>
        </View>
      )}

      {/* P&L Grid */}
      {showPnL && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Profit & Loss</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total P&L"
              value={formatPnl(metrics.totalPnl)}
              valueColor={metrics.totalPnl >= 0 ? '#10B981' : '#EF4444'}
            />
            <MetricCard
              label="Realized"
              value={formatPnl(metrics.realizedPnl)}
              valueColor={metrics.realizedPnl >= 0 ? '#10B981' : '#EF4444'}
            />
            <MetricCard
              label="Unrealized"
              value={formatPnl(metrics.unrealizedPnl)}
              valueColor={metrics.unrealizedPnl >= 0 ? '#10B981' : '#EF4444'}
            />
            <MetricCard
              label="Today"
              value={formatPnl(metrics.pnlToday)}
              valueColor={metrics.pnlToday >= 0 ? '#10B981' : '#EF4444'}
            />
          </View>
          <View style={styles.pnlPeriods}>
            <View style={styles.pnlPeriodItem}>
              <Text style={[styles.pnlPeriodLabel, { color: textMuted }]}>7D</Text>
              <Text style={[
                styles.pnlPeriodValue,
                { color: metrics.pnl7d >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {formatPnl(metrics.pnl7d)}
              </Text>
            </View>
            <View style={styles.pnlPeriodItem}>
              <Text style={[styles.pnlPeriodLabel, { color: textMuted }]}>30D</Text>
              <Text style={[
                styles.pnlPeriodValue,
                { color: metrics.pnl30d >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {formatPnl(metrics.pnl30d)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Trading Stats */}
      {showTrades && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Trading Stats</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total Trades"
              value={metrics.totalTrades.toString()}
              subValue={`${metrics.tradesToday} today`}
            />
            <MetricCard
              label="Win Rate"
              value={`${(metrics.winRate * 100).toFixed(1)}%`}
              subValue={`${metrics.winCount}W / ${metrics.lossCount}L`}
              valueColor={metrics.winRate >= 0.5 ? '#10B981' : '#EF4444'}
            />
            <MetricCard
              label="Avg Win"
              value={formatPnl(metrics.avgWin)}
              valueColor="#10B981"
            />
            <MetricCard
              label="Avg Loss"
              value={formatPnl(metrics.avgLoss)}
              valueColor="#EF4444"
            />
          </View>
          {metrics.profitFactor > 0 && metrics.profitFactor !== Infinity && (
            <View style={styles.profitFactorRow}>
              <Text style={[styles.profitFactorLabel, { color: textMuted }]}>Profit Factor</Text>
              <Text style={[
                styles.profitFactorValue,
                { color: metrics.profitFactor >= 1.5 ? '#10B981' : metrics.profitFactor >= 1 ? '#F59E0B' : '#EF4444' }
              ]}>
                {metrics.profitFactor.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Position Stats */}
      {showPositions && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Position Overview</Text>
          <View style={styles.positionStats}>
            <View style={styles.positionItem}>
              <Text style={[styles.positionLabel, { color: textMuted }]}>Open Positions</Text>
              <Text style={[styles.positionValue, { color: textPrimary }]}>
                {metrics.openPositions}
              </Text>
            </View>
            <View style={styles.positionItem}>
              <Text style={[styles.positionLabel, { color: textMuted }]}>Total Exposure</Text>
              <Text style={[styles.positionValue, { color: textPrimary }]}>
                ${metrics.totalExposure.toFixed(0)}
              </Text>
            </View>
            <View style={styles.positionItem}>
              <Text style={[styles.positionLabel, { color: textMuted }]}>Avg Leverage</Text>
              <Text style={[styles.positionValue, { color: textPrimary }]}>
                {metrics.avgLeverage.toFixed(1)}x
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Strategy Breakdown */}
      {showStrategies && metrics.strategyMetrics && Object.keys(metrics.strategyMetrics).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Strategy Performance</Text>
          {Object.entries(metrics.strategyMetrics).map(([strategyId, data]) => (
            <View key={strategyId} style={styles.strategyRow}>
              <Text style={[styles.strategyName, { color: textSecondary }]}>
                {strategyId.replace('-01', '').replace('-', ' ')}
              </Text>
              <View style={styles.strategyStats}>
                <Text style={[
                  styles.strategyPnl,
                  { color: data.pnl >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {formatPnl(data.pnl)}
                </Text>
                <Text style={[styles.strategyWinRate, { color: textMuted }]}>
                  {(data.winRate * 100).toFixed(0)}%
                </Text>
                <Text style={[styles.strategyTrades, { color: textMuted }]}>
                  {data.trades} trades
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  compactItem: {
    alignItems: 'center',
    gap: 2,
  },
  compactLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  compactValue: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
  compactDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2A35',
  },
  navSection: {
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  navMain: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  navValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: MONO,
  },
  navChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navChange: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '600',
  },
  navChangePercent: {
    fontFamily: MONO,
    fontSize: 12,
  },
  navPeriod: {
    fontFamily: MONO,
    fontSize: 10,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    fontSize: 12,
  },
  metricLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '700',
  },
  metricSubValue: {
    fontFamily: MONO,
    fontSize: 10,
  },
  pnlPeriods: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  pnlPeriodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pnlPeriodLabel: {
    fontFamily: MONO,
    fontSize: 10,
  },
  pnlPeriodValue: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
  },
  profitFactorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  profitFactorLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  profitFactorValue: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '700',
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  positionItem: {
    alignItems: 'center',
    gap: 4,
  },
  positionLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  positionValue: {
    fontFamily: MONO,
    fontSize: 16,
    fontWeight: '600',
  },
  strategyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1F',
  },
  strategyName: {
    fontSize: 12,
    textTransform: 'capitalize',
    flex: 1,
  },
  strategyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strategyPnl: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    width: 70,
    textAlign: 'right',
  },
  strategyWinRate: {
    fontFamily: MONO,
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
  strategyTrades: {
    fontFamily: MONO,
    fontSize: 10,
    width: 60,
    textAlign: 'right',
  },
});
