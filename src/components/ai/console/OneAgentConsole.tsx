/**
 * OneAgentConsole - Individual agent detail view
 * Part of ONE Ecosystem SDK
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import type { BotLogEntry, BotState } from '../../../services/forex/BotSimulationEngine';
import type { AIPosition, AIDecision, AIAgent } from '../../../types/console';
import { AI_LOG_COLORS } from '../../../types/console';
import { OnePositionCard } from './OnePositionCard';
import { OneDecisionTimeline } from './OneDecisionTimeline';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneAgentConsoleProps {
  agent?: AIAgent;
  strategyId?: string;
  strategyName?: string;
  logs: BotLogEntry[];
  botState?: BotState;
  positions?: AIPosition[];
  decisions?: AIDecision[];
  showConsole?: boolean;
  showPositions?: boolean;
  showDecisions?: boolean;
  showMetrics?: boolean;
  maxLogs?: number;
  autoScroll?: boolean;
  consoleHeight?: number;
  onPositionPress?: (position: AIPosition) => void;
  onDecisionPress?: (decision: AIDecision) => void;
  onClosePosition?: (positionId: string) => void;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneAgentConsole: React.FC<OneAgentConsoleProps> = ({
  agent,
  strategyId,
  strategyName,
  logs,
  botState,
  positions = [],
  decisions = [],
  showConsole = true,
  showPositions = true,
  showDecisions = true,
  showMetrics = true,
  maxLogs = 100,
  autoScroll = true,
  consoleHeight = 300,
  onPositionPress,
  onDecisionPress,
  onClosePosition,
  style,
  dark = true,
}) => {
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';
  const consoleBg = dark ? '#0A0A0C' : '#F9FAFB';

  const scrollRef = useRef<ScrollView>(null);
  const visibleLogs = logs.slice(-maxLogs);
  const openPositions = positions.filter(p => p.status === 'open');

  // Auto-scroll console
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [logs.length, autoScroll]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const displayName = agent?.name || strategyName || strategyId || 'Agent';
  const displayColor = agent?.color || botState?.strategyName ? '#3B82F6' : '#9CA3AF';
  const isActive = agent?.status === 'active' || botState?.isRunning;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.colorDot, { backgroundColor: displayColor }]} />
          <Text style={[styles.agentName, { color: textPrimary }]}>{displayName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isActive ? '#D1FAE5' : '#F3F4F6' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isActive ? '#10B981' : '#9CA3AF' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isActive ? '#10B981' : '#9CA3AF' }
            ]}>
              {isActive ? 'Active' : 'Idle'}
            </Text>
          </View>
        </View>
        {botState && (
          <View style={styles.headerRight}>
            <Text style={[styles.currentPair, { color: textSecondary }]}>
              {botState.currentPair}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Metrics */}
      {showMetrics && (agent || botState) && (
        <View style={[styles.metricsRow, { borderBottomColor: border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>P&L</Text>
            <Text style={[
              styles.metricValue,
              { color: (agent?.totalPnl ?? botState?.totalPnl ?? 0) >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {(agent?.totalPnl ?? botState?.totalPnl ?? 0) >= 0 ? '+' : ''}
              ${(agent?.totalPnl ?? botState?.totalPnl ?? 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Win Rate</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {((agent?.winRate ?? botState?.winRate ?? 0) * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Trades</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {agent?.totalTrades ?? botState?.totalTrades ?? 0}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: textMuted }]}>Positions</Text>
            <Text style={[styles.metricValue, { color: textPrimary }]}>
              {openPositions.length}
            </Text>
          </View>
          {botState?.lastSignal && botState.lastSignal !== 'HOLD' && (
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: textMuted }]}>Signal</Text>
              <View style={[
                styles.signalBadge,
                { backgroundColor: botState.lastSignal === 'LONG' ? '#D1FAE5' : '#FEE2E2' }
              ]}>
                <Text style={[
                  styles.signalText,
                  { color: botState.lastSignal === 'LONG' ? '#10B981' : '#EF4444' }
                ]}>
                  {botState.lastSignal}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Console Output */}
      {showConsole && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Console Output</Text>
          <View style={[styles.consoleContainer, { backgroundColor: consoleBg, height: consoleHeight }]}>
            <ScrollView
              ref={scrollRef}
              style={styles.consoleScroll}
              contentContainerStyle={styles.consoleContent}
            >
              {visibleLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={[styles.logTime, { color: textMuted }]}>
                    {formatTime(log.timestamp)}
                  </Text>
                  <Text style={[
                    styles.logType,
                    { color: AI_LOG_COLORS[log.type as keyof typeof AI_LOG_COLORS] || textMuted }
                  ]}>
                    {log.type.padEnd(10)}
                  </Text>
                  <Text
                    style={[
                      styles.logMessage,
                      { color: log.importance === 'high' ? textPrimary : textSecondary },
                      log.importance === 'high' && styles.logMessageHigh,
                    ]}
                    numberOfLines={2}
                  >
                    {log.message}
                  </Text>
                </View>
              ))}
              {visibleLogs.length === 0 && (
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  Waiting for activity...
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Open Positions */}
      {showPositions && openPositions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>
            Open Positions ({openPositions.length})
          </Text>
          <View style={styles.positionsList}>
            {openPositions.map((position) => (
              <OnePositionCard
                key={position.id}
                position={position}
                onPress={onPositionPress}
                onClose={onClosePosition}
                compact={true}
                dark={dark}
              />
            ))}
          </View>
        </View>
      )}

      {/* Recent Decisions */}
      {showDecisions && decisions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>
            Recent Decisions ({decisions.length})
          </Text>
          <OneDecisionTimeline
            decisions={decisions.slice(0, 5)}
            showReasoning={true}
            showIndicators={false}
            showConfidence={true}
            onDecisionPress={onDecisionPress}
            height={250}
            dark={dark}
          />
        </View>
      )}

      {/* Indicators (if bot state available) */}
      {botState?.indicators && (
        <View style={[styles.indicatorsSection, { borderTopColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Current Indicators</Text>
          <View style={styles.indicatorsGrid}>
            <View style={styles.indicatorItem}>
              <Text style={[styles.indicatorLabel, { color: textMuted }]}>RSI</Text>
              <Text style={[
                styles.indicatorValue,
                {
                  color: botState.indicators.rsi < 30 ? '#10B981' :
                         botState.indicators.rsi > 70 ? '#EF4444' : textPrimary
                }
              ]}>
                {botState.indicators.rsi.toFixed(1)}
              </Text>
            </View>
            <View style={styles.indicatorItem}>
              <Text style={[styles.indicatorLabel, { color: textMuted }]}>MACD</Text>
              <Text style={[
                styles.indicatorValue,
                { color: botState.indicators.macd.histogram >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {botState.indicators.macd.histogram >= 0 ? '+' : ''}
                {botState.indicators.macd.histogram.toFixed(3)}
              </Text>
            </View>
            <View style={styles.indicatorItem}>
              <Text style={[styles.indicatorLabel, { color: textMuted }]}>EMA</Text>
              <Text style={[
                styles.indicatorValue,
                { color: botState.indicators.ema.crossover === 'golden' ? '#10B981' :
                         botState.indicators.ema.crossover === 'death' ? '#EF4444' : textSecondary }
              ]}>
                {botState.indicators.ema.crossover !== 'none' ?
                  botState.indicators.ema.crossover.toUpperCase() : 'NEUTRAL'}
              </Text>
            </View>
            <View style={styles.indicatorItem}>
              <Text style={[styles.indicatorLabel, { color: textMuted }]}>Volume</Text>
              <Text style={[styles.indicatorValue, { color: textPrimary }]}>
                {botState.indicators.volume.ratio.toFixed(1)}x
              </Text>
            </View>
            <View style={styles.indicatorItem}>
              <Text style={[styles.indicatorLabel, { color: textMuted }]}>BB Pos</Text>
              <Text style={[styles.indicatorValue, { color: textPrimary }]}>
                {botState.indicators.bollinger.position.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  agentName: {
    fontSize: 16,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  currentPair: {
    fontFamily: MONO,
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
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
    fontSize: 14,
    fontWeight: '600',
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  signalText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  consoleContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  consoleScroll: {
    flex: 1,
  },
  consoleContent: {
    padding: 8,
  },
  logRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  logTime: {
    fontFamily: MONO,
    fontSize: 10,
    width: 60,
    marginRight: 6,
  },
  logType: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    width: 75,
    marginRight: 6,
  },
  logMessage: {
    fontFamily: MONO,
    fontSize: 10,
    flex: 1,
  },
  logMessageHigh: {
    fontWeight: '600',
  },
  emptyText: {
    fontFamily: MONO,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 30,
  },
  positionsList: {
    gap: 8,
  },
  indicatorsSection: {
    padding: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  indicatorItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 60,
  },
  indicatorLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  indicatorValue: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '600',
  },
});
