/**
 * OnePairSelector - Trading pair selection component for AI trading
 * Part of ONE Ecosystem SDK - can be used by any ecosystem partner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

// Common trading pairs with icons
export const PAIR_ICONS: Record<string, string> = {
  'BTC/USDT': '₿',
  'ETH/USDT': 'Ξ',
  'SOL/USDT': '◎',
  'BNB/USDT': '◆',
  'XRP/USDT': '✕',
  'DOGE/USDT': 'Ð',
  'ADA/USDT': '◈',
  'AVAX/USDT': '▲',
  'DOT/USDT': '●',
  'MATIC/USDT': '⬡',
  'LINK/USDT': '◇',
  'UNI/USDT': '🦄',
  'ATOM/USDT': '⚛',
  'LTC/USDT': 'Ł',
  'ARB/USDT': '◆',
  'OP/USDT': '◉',
};

export interface OnePairSelectorProps {
  /** List of supported trading pairs */
  supportedPairs: string[];
  /** Currently selected pairs */
  selectedPairs: string[];
  /** Callback when pair selection changes */
  onTogglePair: (pair: string) => void;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Minimum required selections */
  minSelections?: number;
  /** Maximum allowed selections (0 = unlimited) */
  maxSelections?: number;
  /** Custom styles */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
}

export const OnePairSelector: React.FC<OnePairSelectorProps> = ({
  supportedPairs,
  selectedPairs,
  onTogglePair,
  accentColor = '#188775',
  title,
  subtitle,
  minSelections = 1,
  maxSelections = 0,
  style,
  titleStyle,
}) => {
  const handleToggle = (pair: string) => {
    const isSelected = selectedPairs.includes(pair);

    // Prevent deselecting below minimum
    if (isSelected && selectedPairs.length <= minSelections) {
      return;
    }

    // Prevent selecting above maximum
    if (!isSelected && maxSelections > 0 && selectedPairs.length >= maxSelections) {
      return;
    }

    onTogglePair(pair);
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.pairsContainer}>
        {supportedPairs.map((pair) => {
          const isSelected = selectedPairs.includes(pair);
          const icon = PAIR_ICONS[pair] || '●';
          const baseSymbol = pair.split('/')[0];

          return (
            <TouchableOpacity
              key={pair}
              style={[
                styles.pairChip,
                isSelected && styles.pairChipSelected,
                isSelected && { backgroundColor: accentColor + '15', borderColor: accentColor }
              ]}
              onPress={() => handleToggle(pair)}
              activeOpacity={0.7}
            >
              <Text style={styles.pairIcon}>{icon}</Text>
              <Text style={[
                styles.pairText,
                isSelected && { color: accentColor, fontWeight: '600' }
              ]}>
                {baseSymbol}
              </Text>
              {isSelected && (
                <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected
          {minSelections > 0 && ` (min: ${minSelections})`}
          {maxSelections > 0 && ` (max: ${maxSelections})`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  pairsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pairChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 6,
  },
  pairChipSelected: {
    borderWidth: 2,
  },
  pairIcon: {
    fontSize: 14,
  },
  pairText: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedInfo: {
    marginTop: 8,
    paddingVertical: 4,
  },
  selectedText: {
    fontSize: 12,
    color: '#888',
  },
});
