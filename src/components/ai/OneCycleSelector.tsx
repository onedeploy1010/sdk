/**
 * OneCycleSelector - Investment cycle selection component for AI trading
 * Part of ONE Ecosystem SDK - can be used by any ecosystem partner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

// Default share rates by cycle (platform takes this percentage)
export const DEFAULT_SHARE_RATES: Record<number, number> = {
  7: 25,
  14: 22,
  30: 18,
  60: 15,
  90: 12,
};

export interface OneCycleSelectorProps {
  /** List of supported cycle days */
  supportedCycles: number[];
  /** Currently selected cycle */
  selectedCycle: number;
  /** Callback when cycle selection changes */
  onSelectCycle: (cycle: number) => void;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Custom share rates by cycle (overrides defaults) */
  shareRates?: Record<number, number>;
  /** Days label */
  daysLabel?: string;
  /** Your share label */
  yourShareLabel?: string;
  /** Platform fee label */
  platformFeeLabel?: string;
  /** Custom styles */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
}

export const OneCycleSelector: React.FC<OneCycleSelectorProps> = ({
  supportedCycles,
  selectedCycle,
  onSelectCycle,
  accentColor = '#188775',
  title,
  subtitle,
  shareRates = DEFAULT_SHARE_RATES,
  daysLabel = 'days',
  yourShareLabel = 'Your share',
  platformFeeLabel = 'Platform fee',
  style,
  titleStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.cyclesContainer}>
        {supportedCycles.map((cycle) => {
          const isSelected = selectedCycle === cycle;
          const shareRate = shareRates[cycle] || 20;
          const userRate = 100 - shareRate;

          return (
            <TouchableOpacity
              key={cycle}
              style={[
                styles.cycleOption,
                isSelected && styles.cycleOptionSelected,
                isSelected && { borderColor: accentColor, backgroundColor: accentColor + '10' }
              ]}
              onPress={() => onSelectCycle(cycle)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.cycleDays,
                isSelected && { color: accentColor }
              ]}>
                {cycle}
              </Text>
              <Text style={styles.cycleDaysLabel}>{daysLabel}</Text>

              <View style={styles.cycleEarnings}>
                <Text style={[
                  styles.cycleEarningsValue,
                  isSelected && { color: accentColor }
                ]}>
                  {userRate}%
                </Text>
                <Text style={styles.cycleEarningsLabel}>{yourShareLabel}</Text>
              </View>

              <Text style={styles.cycleFee}>
                {shareRate}% {platformFeeLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Longer cycles = higher user share
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
  cyclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cycleOption: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cycleOptionSelected: {
    borderWidth: 2,
  },
  cycleDays: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cycleDaysLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cycleEarnings: {
    alignItems: 'center',
  },
  cycleEarningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  cycleEarningsLabel: {
    fontSize: 11,
    color: '#666',
  },
  cycleFee: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  infoBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
