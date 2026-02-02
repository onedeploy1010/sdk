/**
 * OneForexPoolCard - Displays a forex liquidity pool with metrics
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { ForexPool } from '../../types/forex';

export interface OneForexPoolCardProps {
  /** Pool data object */
  pool: ForexPool;
  /** Pool display name (provide translated string) */
  poolName?: string;
  /** Whether to show enhanced metrics (APY, flow, tx count) */
  showMetrics?: boolean;
  /** Custom accent color override */
  accentColor?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Dark mode */
  dark?: boolean;
}

export const OneForexPoolCard: React.FC<OneForexPoolCardProps> = ({
  pool,
  poolName,
  showMetrics = true,
  accentColor,
  style,
  dark = true,
}) => {
  const color = accentColor || pool.color;
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#1a1a1a' : '#e5e5e5';
  const textPrimary = dark ? '#ffffff' : '#1a1a1a';
  const textSecondary = dark ? '#9ca3af' : '#666666';
  const textMuted = dark ? '#666666' : '#999999';
  const barBg = dark ? '#1a1a1a' : '#e5e5e5';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.name, { color: textPrimary }]}>
          {poolName || pool.nameKey}
        </Text>
        <Text style={[styles.alloc, { color: textSecondary }]}>
          {(pool.allocation * 100).toFixed(0)}%
        </Text>
      </View>

      <View style={[styles.barOuter, { backgroundColor: barBg }]}>
        <View style={[styles.barFill, { width: `${pool.utilization * 100}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.statsRow}>
        <Text style={[styles.statValue, { color: textSecondary }]}>
          ${(pool.totalSize / 1_000_000).toFixed(1)}M
        </Text>
        <Text style={[styles.statLabel, { color: textMuted }]}>
          {(pool.utilization * 100).toFixed(1)}% util
        </Text>
      </View>

      {showMetrics && (
        <View style={[styles.metricsRow, { borderTopColor: border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>APY 7d</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {pool.apy7d.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>24h Flow</Text>
            <Text style={[styles.metricValue, { color: pool.netFlow24h >= 0 ? '#10B981' : '#EF4444' }]}>
              {pool.netFlow24h >= 0 ? '+' : ''}${(pool.netFlow24h / 1000).toFixed(0)}K
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Txs</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>{pool.txCount24h}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 8, borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 13, fontWeight: '600', flex: 1 },
  alloc: { fontSize: 12 },
  barOuter: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontSize: 12, fontWeight: '600' },
  statLabel: { fontSize: 11 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 8, borderTopWidth: 1 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metricValue: { fontSize: 12, fontWeight: '600' },
});
