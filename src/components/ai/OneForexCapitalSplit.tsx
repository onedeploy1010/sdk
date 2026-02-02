/**
 * OneForexCapitalSplit - Displays 50/50 capital allocation split
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FOREX_CAPITAL_SPLIT, FOREX_POOL_DEFAULTS, computePoolAllocations } from '../../types/forex';

export interface OneForexCapitalSplitProps {
  /** Total investment amount */
  amount: number;
  /** Labels (provide translated strings) */
  labels?: {
    title?: string;
    tradingCapital?: string;
    poolReserves?: string;
    clearing?: string;
    hedging?: string;
    insurance?: string;
  };
  /** Show pool breakdown within reserves */
  showPoolBreakdown?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Dark mode */
  dark?: boolean;
}

export const OneForexCapitalSplit: React.FC<OneForexCapitalSplitProps> = ({
  amount,
  labels = {},
  showPoolBreakdown = true,
  style,
  dark = false,
}) => {
  const allocs = computePoolAllocations(amount);
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#1a1a1a' : '#e5e5e5';
  const textPrimary = dark ? '#ffffff' : '#1a1a1a';
  const textSecondary = dark ? '#9ca3af' : '#666666';
  const itemBg = dark ? '#0a0a0a' : '#f5f5f5';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      {labels.title && <Text style={[styles.title, { color: textPrimary }]}>{labels.title}</Text>}

      <View style={styles.splitRow}>
        <View style={[styles.splitItem, { backgroundColor: itemBg }]}>
          <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
          <Text style={[styles.splitLabel, { color: textSecondary }]}>
            {labels.tradingCapital || 'Active Trading (RFQ)'}
          </Text>
          <Text style={[styles.splitPct, { color: textSecondary }]}>50%</Text>
          <Text style={[styles.splitAmt, { color: textPrimary }]}>
            ${allocs.tradingCapital.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.splitItem, { backgroundColor: itemBg }]}>
          <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.splitLabel, { color: textSecondary }]}>
            {labels.poolReserves || 'Pool Reserves'}
          </Text>
          <Text style={[styles.splitPct, { color: textSecondary }]}>50%</Text>
          <Text style={[styles.splitAmt, { color: textPrimary }]}>
            ${allocs.totalPoolReserves.toLocaleString()}
          </Text>
        </View>
      </View>

      {showPoolBreakdown && amount > 0 && (
        <View style={[styles.breakdown, { borderTopColor: border }]}>
          {FOREX_POOL_DEFAULTS.map(pool => {
            const poolAmt = allocs[pool.id as keyof typeof allocs] as number;
            return (
              <View key={pool.id} style={styles.poolRow}>
                <View style={[styles.poolDot, { backgroundColor: pool.color }]} />
                <Text style={[styles.poolName, { color: textSecondary }]}>
                  {(labels as any)?.[pool.id] || pool.nameKey}
                </Text>
                <View style={[styles.poolBar, { backgroundColor: dark ? '#1a1a1a' : '#e5e5e5' }]}>
                  <View style={[styles.poolBarFill, { width: `${pool.allocation * 100}%`, backgroundColor: pool.color }]} />
                </View>
                <Text style={[styles.poolAmt, { color: textPrimary }]}>
                  ${poolAmt.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 8, borderWidth: 1, padding: 14 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  splitRow: { gap: 8 },
  splitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  splitLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  splitPct: { fontSize: 12, fontWeight: '600', marginRight: 12 },
  splitAmt: { fontSize: 14, fontWeight: '700' },
  breakdown: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  poolRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  poolDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  poolName: { width: 80, fontSize: 12 },
  poolBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  poolBarFill: { height: '100%', borderRadius: 3 },
  poolAmt: { width: 70, fontSize: 12, fontWeight: '600', textAlign: 'right' },
});
