/**
 * OneDecisionTimeline - Displays AI decision history with reasoning
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import type { AIDecision, DecisionAction } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const ACTION_COLORS: Record<DecisionAction, { color: string; bgColor: string; label: string }> = {
  OPEN_LONG: { color: '#10B981', bgColor: '#D1FAE5', label: 'LONG' },
  OPEN_SHORT: { color: '#EF4444', bgColor: '#FEE2E2', label: 'SHORT' },
  CLOSE_LONG: { color: '#6366F1', bgColor: '#E0E7FF', label: 'CLOSE L' },
  CLOSE_SHORT: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'CLOSE S' },
  HOLD: { color: '#9CA3AF', bgColor: '#F3F4F6', label: 'HOLD' },
  SKIP: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'SKIP' },
};

export interface OneDecisionTimelineProps {
  decisions: AIDecision[];
  maxItems?: number;
  showReasoning?: boolean;
  showIndicators?: boolean;
  showConfidence?: boolean;
  onDecisionPress?: (decision: AIDecision) => void;
  style?: ViewStyle;
  height?: number;
  dark?: boolean;
}

export const OneDecisionTimeline: React.FC<OneDecisionTimelineProps> = ({
  decisions,
  maxItems = 50,
  showReasoning = true,
  showIndicators = true,
  showConfidence = true,
  onDecisionPress,
  style,
  height = 400,
  dark = true,
}) => {
  const bg = dark ? '#0A0A0C' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';
  const cardBg = dark ? '#111111' : '#F9FAFB';

  const visibleDecisions = decisions.slice(0, maxItems);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return '#10B981';
    if (confidence >= 0.5) return '#F59E0B';
    return '#EF4444';
  };

  const handlePress = (decision: AIDecision) => {
    if (onDecisionPress) {
      onDecisionPress(decision);
    }
  };

  const DecisionItem = ({ decision }: { decision: AIDecision }) => {
    const actionConfig = ACTION_COLORS[decision.action];

    const itemContent = (
      <>
        {/* Timeline dot and line */}
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: actionConfig.color }]} />
          <View style={[styles.timelineLine, { backgroundColor: border }]} />
        </View>

        {/* Content */}
        <View style={styles.decisionContent}>
          {/* Header */}
          <View style={styles.decisionHeader}>
            <View style={styles.decisionHeaderLeft}>
              <View style={[styles.actionBadge, { backgroundColor: actionConfig.bgColor }]}>
                <Text style={[styles.actionText, { color: actionConfig.color }]}>
                  {actionConfig.label}
                </Text>
              </View>
              <Text style={[styles.pairText, { color: textPrimary }]}>{decision.pair}</Text>
            </View>
            <View style={styles.decisionHeaderRight}>
              <Text style={[styles.timeText, { color: textMuted }]}>
                {formatDate(decision.timestamp)} {formatTime(decision.timestamp)}
              </Text>
            </View>
          </View>

          {/* Strategy and Confidence */}
          <View style={styles.metaRow}>
            <Text style={[styles.strategyText, { color: textSecondary }]}>
              {decision.strategyName}
            </Text>
            {showConfidence && (
              <View style={styles.confidenceRow}>
                <Text style={[styles.confidenceLabel, { color: textMuted }]}>Confidence:</Text>
                <View style={[styles.confidenceBar, { backgroundColor: dark ? '#1A1A1F' : '#E5E7EB' }]}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${decision.confidence * 100}%`,
                        backgroundColor: getConfidenceColor(decision.confidence),
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.confidenceValue, { color: getConfidenceColor(decision.confidence) }]}>
                  {(decision.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>

          {/* Reasoning */}
          {showReasoning && decision.reasoning && (
            <View style={[styles.reasoningBox, { backgroundColor: dark ? '#1A1A1F' : '#F3F4F6' }]}>
              <Text style={[styles.reasoningText, { color: textSecondary }]}>
                {decision.reasoning}
              </Text>
            </View>
          )}

          {/* Indicators */}
          {showIndicators && decision.indicators && Object.keys(decision.indicators).length > 0 && (
            <View style={styles.indicatorsRow}>
              {decision.indicators.rsi !== undefined && (
                <View style={styles.indicatorItem}>
                  <Text style={[styles.indicatorLabel, { color: textMuted }]}>RSI</Text>
                  <Text style={[styles.indicatorValue, { color: textSecondary }]}>
                    {decision.indicators.rsi.toFixed(1)}
                  </Text>
                </View>
              )}
              {decision.indicators.macd !== undefined && (
                <View style={styles.indicatorItem}>
                  <Text style={[styles.indicatorLabel, { color: textMuted }]}>MACD</Text>
                  <Text style={[
                    styles.indicatorValue,
                    { color: decision.indicators.macd >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {decision.indicators.macd >= 0 ? '+' : ''}{decision.indicators.macd.toFixed(3)}
                  </Text>
                </View>
              )}
              {decision.indicators.ema && (
                <View style={styles.indicatorItem}>
                  <Text style={[styles.indicatorLabel, { color: textMuted }]}>EMA</Text>
                  <Text style={[
                    styles.indicatorValue,
                    { color: decision.indicators.ema === 'bullish' ? '#10B981' : '#EF4444' }
                  ]}>
                    {decision.indicators.ema}
                  </Text>
                </View>
              )}
              {decision.indicators.volume !== undefined && (
                <View style={styles.indicatorItem}>
                  <Text style={[styles.indicatorLabel, { color: textMuted }]}>Vol</Text>
                  <Text style={[styles.indicatorValue, { color: textSecondary }]}>
                    {decision.indicators.volume.toFixed(1)}x
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Signals */}
          {decision.signals && decision.signals.length > 0 && (
            <View style={styles.signalsRow}>
              {decision.signals.slice(0, 3).map((signal, index) => (
                <View key={index} style={[styles.signalBadge, { backgroundColor: dark ? '#1A1A1F' : '#E5E7EB' }]}>
                  <Text style={[styles.signalText, { color: textSecondary }]}>{signal}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Execution Info */}
          {decision.executed && (
            <View style={[styles.executionRow, { borderTopColor: border }]}>
              <View style={[styles.executedBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.executedText}>EXECUTED</Text>
              </View>
              {decision.price && (
                <Text style={[styles.executionDetail, { color: textSecondary }]}>
                  @ ${decision.price.toFixed(2)}
                </Text>
              )}
              {decision.size && (
                <Text style={[styles.executionDetail, { color: textSecondary }]}>
                  Size: ${decision.size}
                </Text>
              )}
              {decision.leverage && (
                <Text style={[styles.executionDetail, { color: textSecondary }]}>
                  {decision.leverage}x
                </Text>
              )}
            </View>
          )}
        </View>
      </>
    );

    if (onDecisionPress) {
      return (
        <TouchableOpacity
          style={[styles.decisionItem, { backgroundColor: cardBg }]}
          onPress={() => handlePress(decision)}
          activeOpacity={0.7}
        >
          {itemContent}
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.decisionItem, { backgroundColor: cardBg }]}>
        {itemContent}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border, height }, style]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {visibleDecisions.map((decision) => (
          <DecisionItem key={decision.id} decision={decision} />
        ))}
        {visibleDecisions.length === 0 && (
          <Text style={[styles.emptyText, { color: textMuted }]}>
            No decisions recorded yet...
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  decisionItem: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  decisionContent: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  decisionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  decisionHeaderRight: {
    alignItems: 'flex-end',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  pairText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    fontFamily: MONO,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strategyText: {
    fontSize: 11,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceLabel: {
    fontFamily: MONO,
    fontSize: 9,
  },
  confidenceBar: {
    width: 50,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
  },
  reasoningBox: {
    padding: 8,
    borderRadius: 6,
  },
  reasoningText: {
    fontSize: 11,
    lineHeight: 16,
  },
  indicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  indicatorValue: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '600',
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  signalText: {
    fontFamily: MONO,
    fontSize: 9,
  },
  executionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  executedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  executedText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  executionDetail: {
    fontFamily: MONO,
    fontSize: 10,
  },
  emptyText: {
    fontFamily: MONO,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
