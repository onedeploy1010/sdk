/**
 * OnePositionCard - Displays position with live P&L
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import type { AIPosition } from '../../../types/console';
import { formatPnl, formatPercent } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OnePositionCardProps {
  position: AIPosition;
  onPress?: (position: AIPosition) => void;
  onClose?: (positionId: string) => void;
  showDetails?: boolean;
  showRiskLevels?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

export const OnePositionCard: React.FC<OnePositionCardProps> = ({
  position,
  onPress,
  onClose,
  showDetails = true,
  showRiskLevels = true,
  compact = false,
  style,
  dark = true,
}) => {
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';

  const isLong = position.side === 'LONG';
  const sideColor = isLong ? '#10B981' : '#EF4444';
  const sideBgColor = isLong ? '#D1FAE5' : '#FEE2E2';
  const pnlColor = position.pnl >= 0 ? '#10B981' : '#EF4444';

  const handlePress = () => {
    if (onPress) {
      onPress(position);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose(position.id);
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(3);
    return price.toFixed(5);
  };

  const openDuration = Date.now() - position.openTime;
  const hours = Math.floor(openDuration / 3600000);
  const minutes = Math.floor((openDuration % 3600000) / 60000);
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Render compact content
  const renderCompactContent = () => (
    <>
      <View style={[styles.sideBadge, { backgroundColor: sideBgColor }]}>
        <Text style={[styles.sideText, { color: sideColor }]}>{position.side}</Text>
      </View>
      <Text style={[styles.compactPair, { color: textPrimary }]}>{position.pair}</Text>
      <Text style={[styles.compactLeverage, { color: textMuted }]}>{position.leverage}x</Text>
      <Text style={[styles.compactPnl, { color: pnlColor }]}>
        {formatPnl(position.pnl)}
      </Text>
    </>
  );

  // Render full content
  const renderFullContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.sideBadge, { backgroundColor: sideBgColor }]}>
            <Text style={[styles.sideText, { color: sideColor }]}>{position.side}</Text>
          </View>
          <Text style={[styles.pair, { color: textPrimary }]}>{position.pair}</Text>
          <Text style={[styles.leverage, { color: textSecondary }]}>{position.leverage}x</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.pnl, { color: pnlColor }]}>
            {formatPnl(position.pnl)}
          </Text>
          <Text style={[styles.pnlPercent, { color: pnlColor }]}>
            {formatPercent(position.pnlPercent)}
          </Text>
        </View>
      </View>

      {/* Price Info */}
      <View style={styles.priceRow}>
        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: textMuted }]}>Entry</Text>
          <Text style={[styles.priceValue, { color: textSecondary }]}>
            ${formatPrice(position.entryPrice)}
          </Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: textMuted }]}>Current</Text>
          <Text style={[styles.priceValue, { color: textPrimary }]}>
            ${formatPrice(position.currentPrice)}
          </Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: textMuted }]}>Size</Text>
          <Text style={[styles.priceValue, { color: textSecondary }]}>
            ${position.size.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Risk Levels */}
      {showRiskLevels && (position.stopLoss || position.takeProfit) && (
        <View style={styles.riskRow}>
          {position.stopLoss && (
            <View style={styles.riskItem}>
              <Text style={[styles.riskLabel, { color: '#EF4444' }]}>SL</Text>
              <Text style={[styles.riskValue, { color: textSecondary }]}>
                ${formatPrice(position.stopLoss)}
              </Text>
            </View>
          )}
          {position.takeProfit && (
            <View style={styles.riskItem}>
              <Text style={[styles.riskLabel, { color: '#10B981' }]}>TP</Text>
              <Text style={[styles.riskValue, { color: textSecondary }]}>
                ${formatPrice(position.takeProfit)}
              </Text>
            </View>
          )}
          {position.liquidationPrice && (
            <View style={styles.riskItem}>
              <Text style={[styles.riskLabel, { color: '#F59E0B' }]}>LIQ</Text>
              <Text style={[styles.riskValue, { color: textSecondary }]}>
                ${formatPrice(position.liquidationPrice)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Details */}
      {showDetails && (
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Strategy</Text>
            <Text style={[styles.detailValue, { color: textSecondary }]}>
              {position.strategyName}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Duration</Text>
            <Text style={[styles.detailValue, { color: textSecondary }]}>
              {durationText}
            </Text>
          </View>
          {position.chain && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: textMuted }]}>Chain</Text>
              <Text style={[styles.detailValue, { color: textSecondary }]}>
                {position.chain}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* AI Reasoning */}
      {position.aiReasoning && (
        <View style={[styles.reasoningBox, { backgroundColor: dark ? '#1A1A1F' : '#F3F4F6' }]}>
          <Text style={[styles.reasoningLabel, { color: textMuted }]}>AI Reasoning</Text>
          <Text style={[styles.reasoningText, { color: textSecondary }]}>
            {position.aiReasoning}
          </Text>
          {position.aiConfidence && (
            <Text style={[styles.confidenceText, { color: textMuted }]}>
              Confidence: {(position.aiConfidence * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      )}

      {/* Close Button */}
      {onClose && position.status === 'open' && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>Close Position</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (compact) {
    if (onPress) {
      return (
        <TouchableOpacity
          style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }, style]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {renderCompactContent()}
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }, style]}>
        {renderCompactContent()}
      </View>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {renderFullContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      {renderFullContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sideText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  compactPair: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  compactLeverage: {
    fontFamily: MONO,
    fontSize: 11,
  },
  compactPnl: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  pair: {
    fontSize: 16,
    fontWeight: '700',
  },
  leverage: {
    fontFamily: MONO,
    fontSize: 12,
  },
  pnl: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '700',
  },
  pnlPercent: {
    fontFamily: MONO,
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
    gap: 2,
  },
  priceLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontFamily: MONO,
    fontSize: 12,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskLabel: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  riskValue: {
    fontFamily: MONO,
    fontSize: 11,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    gap: 2,
  },
  detailLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: MONO,
    fontSize: 11,
  },
  reasoningBox: {
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  reasoningLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  reasoningText: {
    fontSize: 12,
    lineHeight: 18,
  },
  confidenceText: {
    fontFamily: MONO,
    fontSize: 10,
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
