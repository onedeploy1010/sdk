/**
 * OneAgentCard - Displays agent status and mini metrics
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import type { AIAgent } from '../../../types/console';
import { AGENT_STATUS_COLORS, RISK_LEVEL_COLORS, formatPnl } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneAgentCardProps {
  agent: AIAgent;
  onPress?: (agent: AIAgent) => void;
  showMetrics?: boolean;
  showIndicators?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneAgentCard: React.FC<OneAgentCardProps> = ({
  agent,
  onPress,
  showMetrics = true,
  showIndicators = true,
  compact = false,
  style,
  dark = true,
}) => {
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';

  const statusConfig = AGENT_STATUS_COLORS[agent.status];
  const riskConfig = RISK_LEVEL_COLORS[agent.riskLevel];

  const handlePress = () => {
    if (onPress) {
      onPress(agent);
    }
  };

  // Render content shared between pressable and non-pressable versions
  const renderCompactContent = () => (
    <>
      <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
      <Text style={[styles.compactName, { color: textPrimary }]}>{agent.shortName}</Text>
      <Text style={[
        styles.compactPnl,
        { color: agent.totalPnl >= 0 ? '#10B981' : '#EF4444' }
      ]}>
        {formatPnl(agent.totalPnl)}
      </Text>
    </>
  );

  const renderFullContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.colorDot, { backgroundColor: agent.color }]} />
          <Text style={[styles.name, { color: textPrimary }]}>{agent.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Current Activity */}
      {agent.currentPair && (
        <View style={styles.activityRow}>
          <Text style={[styles.activityLabel, { color: textMuted }]}>Watching</Text>
          <Text style={[styles.activityValue, { color: textSecondary }]}>
            {agent.currentPair} @ ${agent.currentPrice?.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Signal */}
      {agent.lastSignal && agent.lastSignal !== 'HOLD' && (
        <View style={styles.signalRow}>
          <Text style={[styles.signalLabel, { color: textMuted }]}>Signal</Text>
          <View style={[
            styles.signalBadge,
            { backgroundColor: agent.lastSignal === 'LONG' ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.signalText,
              { color: agent.lastSignal === 'LONG' ? '#10B981' : '#EF4444' }
            ]}>
              {agent.lastSignal}
            </Text>
          </View>
          {agent.lastSignalConfidence && (
            <Text style={[styles.confidenceText, { color: textSecondary }]}>
              {(agent.lastSignalConfidence * 100).toFixed(0)}%
            </Text>
          )}
        </View>
      )}

      {/* Metrics */}
      {showMetrics && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>P&L</Text>
            <Text style={[
              styles.metricValue,
              { color: agent.totalPnl >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {formatPnl(agent.totalPnl)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Win Rate</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {(agent.winRate * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Trades</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {agent.totalTrades}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Positions</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {agent.openPositions}
            </Text>
          </View>
        </View>
      )}

      {/* Indicators */}
      {showIndicators && (
        <View style={styles.indicatorsRow}>
          <View style={styles.indicatorItem}>
            <Text style={[styles.indicatorLabel, { color: textMuted }]}>Risk</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskConfig.bgColor }]}>
              <Text style={[styles.riskText, { color: riskConfig.color }]}>
                {agent.riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.indicatorItem}>
            <Text style={[styles.indicatorLabel, { color: textMuted }]}>Exposure</Text>
            <Text style={[styles.indicatorValue, { color: textSecondary }]}>
              ${agent.totalExposure.toFixed(0)}
            </Text>
          </View>
        </View>
      )}

      {/* Strategy Info */}
      <View style={styles.strategyRow}>
        <Text style={[styles.strategyLabel, { color: textMuted }]}>
          {agent.primaryIndicators.join(' · ')}
        </Text>
        <Text style={[styles.leverageText, { color: textMuted }]}>
          {agent.leverageRange[0]}-{agent.leverageRange[1]}x
        </Text>
      </View>
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
    gap: 10,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactName: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  activityValue: {
    fontFamily: MONO,
    fontSize: 12,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  signalText: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
  },
  confidenceText: {
    fontFamily: MONO,
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  indicatorValue: {
    fontFamily: MONO,
    fontSize: 12,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  strategyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strategyLabel: {
    fontFamily: MONO,
    fontSize: 9,
  },
  leverageText: {
    fontFamily: MONO,
    fontSize: 9,
  },
});
