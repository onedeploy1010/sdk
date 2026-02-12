/**
 * OnePositionDetail - Detailed position tracking view
 * Part of ONE Ecosystem SDK
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform, TouchableOpacity, Animated } from 'react-native';
import type { AIPosition } from '../../../types/console';
import { formatPnl, formatPercent } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OnePositionDetailProps {
  position: AIPosition;
  showTimeline?: boolean;
  showReasoning?: boolean;
  showRiskLevels?: boolean;
  showHistory?: boolean;
  priceUpdateInterval?: number;
  onClose?: (positionId: string) => void;
  onUpdateStopLoss?: (positionId: string, stopLoss: number) => void;
  onUpdateTakeProfit?: (positionId: string, takeProfit: number) => void;
  style?: ViewStyle;
  dark?: boolean;
}

export const OnePositionDetail: React.FC<OnePositionDetailProps> = ({
  position,
  showTimeline = true,
  showReasoning = true,
  showRiskLevels = true,
  showHistory = true,
  priceUpdateInterval = 5000,
  onClose,
  onUpdateStopLoss,
  onUpdateTakeProfit,
  style,
  dark = true,
}) => {
  const bg = dark ? '#0A0A0C' : '#ffffff';
  const cardBg = dark ? '#111111' : '#F9FAFB';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';

  const isLong = position.side === 'LONG';
  const sideColor = isLong ? '#10B981' : '#EF4444';
  const sideBgColor = isLong ? '#D1FAE5' : '#FEE2E2';
  const pnlColor = position.pnl >= 0 ? '#10B981' : '#EF4444';

  // Animated values for P&L updates
  const pnlAnim = useRef(new Animated.Value(0)).current;
  const [prevPnl, setPrevPnl] = useState(position.pnl);

  useEffect(() => {
    if (position.pnl !== prevPnl) {
      Animated.sequence([
        Animated.timing(pnlAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(pnlAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
      setPrevPnl(position.pnl);
    }
  }, [position.pnl, prevPnl, pnlAnim]);

  const pnlBgColor = pnlAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardBg, position.pnl >= 0 ? '#134E4A' : '#7F1D1D'],
  });

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatDuration = (openTime: number, closeTime?: number): string => {
    const end = closeTime || Date.now();
    const duration = end - openTime;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Calculate distance to liquidation
  const distanceToLiquidation = position.liquidationPrice
    ? Math.abs((position.currentPrice - position.liquidationPrice) / position.currentPrice * 100)
    : null;

  // Calculate P&L at TP and SL
  const pnlAtTP = position.takeProfit
    ? ((isLong
        ? (position.takeProfit - position.entryPrice)
        : (position.entryPrice - position.takeProfit)) / position.entryPrice) * position.leverage * position.size
    : null;

  const pnlAtSL = position.stopLoss
    ? ((isLong
        ? (position.stopLoss - position.entryPrice)
        : (position.entryPrice - position.stopLoss)) / position.entryPrice) * position.leverage * position.size
    : null;

  const handleClose = () => {
    if (onClose) {
      onClose(position.id);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }, style]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={[styles.sideBadge, { backgroundColor: sideBgColor }]}>
              <Text style={[styles.sideText, { color: sideColor }]}>{position.side}</Text>
            </View>
            <Text style={[styles.pair, { color: textPrimary }]}>{position.pair}</Text>
            <Text style={[styles.leverage, { color: textSecondary }]}>{position.leverage}x</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: position.status === 'open' ? '#D1FAE5' : '#F3F4F6' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: position.status === 'open' ? '#10B981' : '#9CA3AF' }
            ]}>
              {position.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main P&L Display */}
        <Animated.View style={[styles.pnlSection, { backgroundColor: pnlBgColor }]}>
          <View style={styles.pnlMain}>
            <Text style={[styles.pnlValue, { color: pnlColor }]}>
              {formatPnl(position.pnl)}
            </Text>
            <Text style={[styles.pnlPercent, { color: pnlColor }]}>
              {formatPercent(position.pnlPercent)}
            </Text>
          </View>
          <Text style={[styles.pnlLabel, { color: textMuted }]}>Unrealized P&L</Text>
        </Animated.View>
      </View>

      {/* Price Information */}
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textMuted }]}>Price Information</Text>
        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: textMuted }]}>Entry Price</Text>
            <Text style={[styles.priceValue, { color: textPrimary }]}>
              ${formatPrice(position.entryPrice)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: textMuted }]}>Current Price</Text>
            <Text style={[styles.priceValue, { color: textPrimary }]}>
              ${formatPrice(position.currentPrice)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: textMuted }]}>Price Change</Text>
            <Text style={[
              styles.priceValue,
              { color: (position.currentPrice - position.entryPrice) * (isLong ? 1 : -1) >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {((position.currentPrice - position.entryPrice) / position.entryPrice * 100) >= 0 ? '+' : ''}
              {((position.currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(4)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Position Details */}
      <View style={[styles.section, { backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textMuted }]}>Position Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textSecondary }]}>Size</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              ${position.size.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textSecondary }]}>Margin</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              ${position.margin.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textSecondary }]}>Leverage</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              {position.leverage}x
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textSecondary }]}>Strategy</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              {position.strategyName}
            </Text>
          </View>
          {position.chain && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: textSecondary }]}>Chain</Text>
              <Text style={[styles.detailValue, { color: textPrimary }]}>
                {position.chain}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textSecondary }]}>Duration</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              {formatDuration(position.openTime, position.closeTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Risk Levels */}
      {showRiskLevels && (
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Risk Management</Text>
          <View style={styles.riskGrid}>
            {position.stopLoss && (
              <View style={[styles.riskCard, { borderColor: '#EF4444' }]}>
                <Text style={[styles.riskCardLabel, { color: '#EF4444' }]}>Stop Loss</Text>
                <Text style={[styles.riskCardPrice, { color: textPrimary }]}>
                  ${formatPrice(position.stopLoss)}
                </Text>
                {pnlAtSL !== null && (
                  <Text style={[styles.riskCardPnl, { color: '#EF4444' }]}>
                    {formatPnl(pnlAtSL)}
                  </Text>
                )}
              </View>
            )}
            {position.takeProfit && (
              <View style={[styles.riskCard, { borderColor: '#10B981' }]}>
                <Text style={[styles.riskCardLabel, { color: '#10B981' }]}>Take Profit</Text>
                <Text style={[styles.riskCardPrice, { color: textPrimary }]}>
                  ${formatPrice(position.takeProfit)}
                </Text>
                {pnlAtTP !== null && (
                  <Text style={[styles.riskCardPnl, { color: '#10B981' }]}>
                    {formatPnl(pnlAtTP)}
                  </Text>
                )}
              </View>
            )}
            {position.liquidationPrice && (
              <View style={[styles.riskCard, { borderColor: '#F59E0B' }]}>
                <Text style={[styles.riskCardLabel, { color: '#F59E0B' }]}>Liquidation</Text>
                <Text style={[styles.riskCardPrice, { color: textPrimary }]}>
                  ${formatPrice(position.liquidationPrice)}
                </Text>
                {distanceToLiquidation !== null && (
                  <Text style={[styles.riskCardDistance, { color: textMuted }]}>
                    {distanceToLiquidation.toFixed(2)}% away
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* AI Reasoning */}
      {showReasoning && position.aiReasoning && (
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>AI Analysis</Text>
          <View style={[styles.reasoningBox, { backgroundColor: dark ? '#1A1A1F' : '#F3F4F6' }]}>
            <Text style={[styles.reasoningText, { color: textSecondary }]}>
              {position.aiReasoning}
            </Text>
          </View>
          {position.aiConfidence && (
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidenceLabel, { color: textMuted }]}>Confidence</Text>
              <View style={[styles.confidenceBar, { backgroundColor: dark ? '#1A1A1F' : '#E5E7EB' }]}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${position.aiConfidence * 100}%`,
                      backgroundColor: position.aiConfidence >= 0.7 ? '#10B981' :
                                       position.aiConfidence >= 0.5 ? '#F59E0B' : '#EF4444',
                    }
                  ]}
                />
              </View>
              <Text style={[styles.confidenceValue, { color: textPrimary }]}>
                {(position.aiConfidence * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Timeline */}
      {showTimeline && (
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: textSecondary }]}>Position Opened</Text>
                <Text style={[styles.timelineTime, { color: textMuted }]}>
                  {formatTimestamp(position.openTime)}
                </Text>
                <Text style={[styles.timelineDetail, { color: textMuted }]}>
                  @ ${formatPrice(position.entryPrice)}
                </Text>
              </View>
            </View>
            {position.closeTime && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#EF4444' }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: textSecondary }]}>Position Closed</Text>
                  <Text style={[styles.timelineTime, { color: textMuted }]}>
                    {formatTimestamp(position.closeTime)}
                  </Text>
                  <Text style={[styles.timelineDetail, { color: textMuted }]}>
                    @ ${formatPrice(position.currentPrice)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {position.status === 'open' && onClose && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close Position</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sideText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
  },
  pair: {
    fontSize: 20,
    fontWeight: '700',
  },
  leverage: {
    fontFamily: MONO,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pnlSection: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  pnlMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  pnlValue: {
    fontFamily: MONO,
    fontSize: 32,
    fontWeight: '700',
  },
  pnlPercent: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: '600',
  },
  pnlLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  section: {
    margin: 12,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1F',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
  riskGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  riskCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  riskCardLabel: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  riskCardPrice: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
  riskCardPnl: {
    fontFamily: MONO,
    fontSize: 11,
  },
  riskCardDistance: {
    fontFamily: MONO,
    fontSize: 10,
  },
  reasoningBox: {
    padding: 12,
    borderRadius: 8,
  },
  reasoningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
  timeline: {
    gap: 16,
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  timelineTime: {
    fontFamily: MONO,
    fontSize: 11,
  },
  timelineDetail: {
    fontFamily: MONO,
    fontSize: 11,
  },
  actionsSection: {
    padding: 16,
    gap: 10,
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
