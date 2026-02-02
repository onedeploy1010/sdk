/**
 * OneForexTradeHistory - Displays trade history with settlement details
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import type { ForexTradeRecord } from '../../types/forex';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneForexTradeHistoryProps {
  /** Trade records to display */
  trades: ForexTradeRecord[];
  /** Maximum trades to show */
  maxItems?: number;
  /** Show settlement details (clearing/hedging/insurance fees) */
  showSettlementDetails?: boolean;
  /** Show transaction hash */
  showTxHash?: boolean;
  /** Empty state text */
  emptyText?: string;
  /** Custom container style */
  style?: ViewStyle;
}

export const OneForexTradeHistory: React.FC<OneForexTradeHistoryProps> = ({
  trades,
  maxItems = 50,
  showSettlementDetails = true,
  showTxHash = true,
  emptyText = 'No trade history yet',
  style,
}) => {
  const visibleTrades = trades.slice(-maxItems).reverse();

  if (visibleTrades.length === 0) {
    return (
      <View style={[styles.empty, style]}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} contentContainerStyle={styles.scrollContent}>
      {visibleTrades.map((trade) => (
        <View key={trade.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.pair}>{trade.pairSymbol}</Text>
            <View style={[
              styles.sideBadge,
              { backgroundColor: trade.side === 'BUY' ? '#10B98118' : '#EF444418', borderColor: trade.side === 'BUY' ? '#10B98140' : '#EF444440' },
            ]}>
              <Text style={[styles.sideText, { color: trade.side === 'BUY' ? '#10B981' : '#EF4444' }]}>
                {trade.side}
              </Text>
            </View>
            <Text style={[styles.pnl, { color: trade.pnl >= 0 ? '#10B981' : '#EF4444' }]}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
            </Text>
          </View>

          <View style={styles.details}>
            <Text style={styles.detail}>
              {trade.lots.toFixed(2)} lots | {trade.pips >= 0 ? '+' : ''}{trade.pips.toFixed(1)} pips
            </Text>
            <Text style={styles.time}>{new Date(trade.timestamp).toLocaleString()}</Text>
          </View>

          {showSettlementDetails && trade.clearingFee !== undefined && (
            <View style={styles.settlement}>
              <Text style={styles.settlementText}>
                CLR: ${trade.clearingFee.toFixed(2)} | HDG: ${(trade.hedgingCost || 0).toFixed(2)} | INS: ${(trade.insuranceReserve || 0).toFixed(2)}
              </Text>
            </View>
          )}

          {showTxHash && trade.txHash && (
            <Text style={styles.txHash}>
              {trade.txHash.slice(0, 10)}...{trade.txHash.slice(-6)}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#666' },
  card: { backgroundColor: '#111111', borderRadius: 6, borderWidth: 1, borderColor: '#1a1a1a', padding: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pair: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  sideBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, borderWidth: 1 },
  sideText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  pnl: { fontFamily: MONO, marginLeft: 'auto', fontSize: 13, fontWeight: '700' },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  detail: { fontFamily: MONO, fontSize: 11, color: '#9ca3af' },
  time: { fontSize: 11, color: '#666' },
  settlement: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  settlementText: { fontFamily: MONO, fontSize: 10, color: '#666' },
  txHash: { fontFamily: MONO, fontSize: 9, color: '#444', marginTop: 2 },
});
