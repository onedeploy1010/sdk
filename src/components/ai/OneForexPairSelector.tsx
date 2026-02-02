/**
 * OneForexPairSelector - Stablecoin FX pair selection for forex trading
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { FOREX_CURRENCY_PAIRS } from '../../types/forex';
import type { ForexCurrencyPair } from '../../types/forex';

export interface OneForexPairSelectorProps {
  /** Currently selected pair IDs */
  selectedPairs: string[];
  /** Callback when a pair is toggled */
  onTogglePair: (pairId: string) => void;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Custom pairs list (defaults to FOREX_CURRENCY_PAIRS) */
  pairs?: ForexCurrencyPair[];
  /** Custom container style */
  style?: ViewStyle;
}

export const OneForexPairSelector: React.FC<OneForexPairSelectorProps> = ({
  selectedPairs,
  onTogglePair,
  accentColor = '#0EA5E9',
  title,
  subtitle,
  pairs = FOREX_CURRENCY_PAIRS,
  style,
}) => {
  const handleToggle = (pairId: string) => {
    if (selectedPairs.includes(pairId) && selectedPairs.length <= 1) return;
    onTogglePair(pairId);
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.pairGrid}>
        {pairs.map((pair) => {
          const isSelected = selectedPairs.includes(pair.id);
          return (
            <TouchableOpacity
              key={pair.id}
              style={[
                styles.pairBtn,
                isSelected && styles.pairBtnActive,
                isSelected && { borderColor: accentColor, backgroundColor: accentColor + '08' },
              ]}
              onPress={() => handleToggle(pair.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.pairFlag}>{pair.flag}</Text>
              <View style={styles.pairInfo}>
                <Text style={[styles.pairSymbol, isSelected && { color: accentColor, fontWeight: '600' }]}>
                  {pair.symbol}
                </Text>
                <Text style={styles.pairName}>{pair.name}</Text>
              </View>
              {isSelected && (
                <Text style={[styles.check, { color: accentColor }]}>{'\u2713'}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectedInfo}>
        {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected (min: 1)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  pairGrid: { gap: 8 },
  pairBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e5e5',
    backgroundColor: '#fff', gap: 10,
  },
  pairBtnActive: { borderWidth: 2 },
  pairFlag: { fontSize: 20 },
  pairInfo: { flex: 1 },
  pairSymbol: { fontSize: 14, color: '#666' },
  pairName: { fontSize: 11, color: '#999' },
  check: { fontSize: 16, fontWeight: '700' },
  selectedInfo: { fontSize: 12, color: '#888', marginTop: 8 },
});
