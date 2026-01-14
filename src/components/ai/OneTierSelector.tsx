/**
 * OneTierSelector - Investment tier selection component for AI trading
 * Part of ONE Ecosystem SDK - can be used by any ecosystem partner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

export interface Tier {
  tier: number;
  amount: number;
  label: string;
  label_zh?: string;
}

export interface OneTierSelectorProps {
  /** Available investment tiers */
  tiers: Tier[];
  /** Currently selected tier */
  selectedTier: Tier | null;
  /** Callback when tier selection changes */
  onSelectTier: (tier: Tier) => void;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Show recommended badge on middle tier */
  showRecommended?: boolean;
  /** Recommended label text */
  recommendedLabel?: string;
  /** Use Chinese labels */
  useZhLabels?: boolean;
  /** Custom styles */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
}

export const OneTierSelector: React.FC<OneTierSelectorProps> = ({
  tiers,
  selectedTier,
  onSelectTier,
  accentColor = '#188775',
  title,
  subtitle,
  showRecommended = true,
  recommendedLabel = 'Recommended',
  useZhLabels = false,
  style,
  titleStyle,
}) => {
  // Middle tier is usually recommended
  const recommendedTierIndex = Math.floor(tiers.length / 2);

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.tiersContainer}>
        {tiers.map((tier, index) => {
          const isSelected = selectedTier?.tier === tier.tier;
          const isRecommended = showRecommended && index === recommendedTierIndex;

          return (
            <TouchableOpacity
              key={tier.tier}
              style={[
                styles.tierCard,
                isSelected && styles.tierCardSelected,
                isSelected && { borderColor: accentColor }
              ]}
              onPress={() => onSelectTier(tier)}
              activeOpacity={0.7}
            >
              {isRecommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.recommendedText}>{recommendedLabel}</Text>
                </View>
              )}

              <Text style={[
                styles.tierLabel,
                isSelected && { color: accentColor },
                isRecommended && styles.tierLabelWithBadge
              ]}>
                {useZhLabels && tier.label_zh ? tier.label_zh : tier.label}
              </Text>

              <Text style={[
                styles.tierAmount,
                isSelected && { color: accentColor }
              ]}>
                ${tier.amount.toLocaleString()}
              </Text>

              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: accentColor }]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  tiersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardSelected: {
    backgroundColor: '#fff',
  },
  tierLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tierLabelWithBadge: {
    marginTop: 16,
  },
  tierAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  checkCircle: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
});
