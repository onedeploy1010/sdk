/**
 * OneRiskIndicator - Displays risk status with visual indicators
 * Part of ONE Ecosystem SDK
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import type { RiskStatus, RiskLevel, TradingStatus } from '../../../types/console';
import { RISK_LEVEL_COLORS, TRADING_STATUS_COLORS } from '../../../types/console';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneRiskIndicatorProps {
  riskStatus: RiskStatus;
  showDetails?: boolean;
  showWarnings?: boolean;
  showLimits?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneRiskIndicator: React.FC<OneRiskIndicatorProps> = ({
  riskStatus,
  showDetails = true,
  showWarnings = true,
  showLimits = true,
  compact = false,
  style,
  dark = true,
}) => {
  const bg = dark ? '#111111' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';

  const riskConfig = RISK_LEVEL_COLORS[riskStatus.riskLevel];
  const statusConfig = TRADING_STATUS_COLORS[riskStatus.tradingStatus];

  // Progress bar component
  const ProgressBar = ({
    value,
    max,
    color,
    label,
    showValue = true,
  }: {
    value: number;
    max: number;
    color: string;
    label: string;
    showValue?: boolean;
  }) => {
    const percent = Math.min((value / max) * 100, 100);
    const barColor = percent > 80 ? '#EF4444' : percent > 60 ? '#F59E0B' : color;

    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: textMuted }]}>{label}</Text>
          {showValue && (
            <Text style={[styles.progressValue, { color: textSecondary }]}>
              {value.toFixed(0)} / {max.toFixed(0)}
            </Text>
          )}
        </View>
        <View style={[styles.progressTrack, { backgroundColor: dark ? '#1A1A1F' : '#E5E7EB' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: barColor }
            ]}
          />
        </View>
        <Text style={[styles.progressPercent, { color: barColor }]}>
          {percent.toFixed(1)}%
        </Text>
      </View>
    );
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bg, borderColor: border }, style]}>
        <View style={[styles.riskBadge, { backgroundColor: riskConfig.bgColor }]}>
          <View style={[styles.riskDot, { backgroundColor: riskConfig.color }]} />
          <Text style={[styles.riskText, { color: riskConfig.color }]}>
            {riskStatus.riskLevel.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {riskStatus.tradingStatus.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.compactExposure, { color: textSecondary }]}>
          Exp: {riskStatus.exposurePercent.toFixed(0)}%
        </Text>
        <Text style={[
          styles.compactPnl,
          { color: riskStatus.dailyPnl >= 0 ? '#10B981' : '#EF4444' }
        ]}>
          {riskStatus.dailyPnl >= 0 ? '+' : ''}{riskStatus.dailyPnl.toFixed(0)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: textPrimary }]}>Risk Status</Text>
          <View style={[styles.riskBadgeLarge, { backgroundColor: riskConfig.bgColor }]}>
            <View style={[styles.riskDotLarge, { backgroundColor: riskConfig.color }]} />
            <Text style={[styles.riskTextLarge, { color: riskConfig.color }]}>
              {riskStatus.riskLevel.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.tradingStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.tradingStatusText, { color: statusConfig.color }]}>
            {riskStatus.tradingStatus === 'active' ? 'Trading Active' :
             riskStatus.tradingStatus === 'paused' ? 'Trading Paused' :
             riskStatus.tradingStatus === 'stopped' ? 'Trading Stopped' : 'Cooldown'}
          </Text>
        </View>
      </View>

      {/* Progress Bars */}
      {showLimits && (
        <View style={styles.progressSection}>
          <ProgressBar
            value={riskStatus.totalExposure}
            max={riskStatus.maxExposure}
            color="#3B82F6"
            label="Portfolio Exposure"
          />
          <ProgressBar
            value={riskStatus.currentDrawdown}
            max={riskStatus.maxDrawdown}
            color="#8B5CF6"
            label="Drawdown"
            showValue={false}
          />
          <ProgressBar
            value={Math.abs(riskStatus.dailyPnl)}
            max={riskStatus.dailyPnlLimit}
            color={riskStatus.dailyPnl >= 0 ? '#10B981' : '#EF4444'}
            label="Daily P&L Limit"
          />
          <ProgressBar
            value={riskStatus.openPositions}
            max={riskStatus.maxPositions}
            color="#F59E0B"
            label="Open Positions"
          />
        </View>
      )}

      {/* Details Grid */}
      {showDetails && (
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Exposure</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              ${riskStatus.totalExposure.toFixed(0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Daily P&L</Text>
            <Text style={[
              styles.detailValue,
              { color: riskStatus.dailyPnl >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {riskStatus.dailyPnl >= 0 ? '+' : ''}${riskStatus.dailyPnl.toFixed(0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Drawdown</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              {riskStatus.currentDrawdown.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: textMuted }]}>Trades Today</Text>
            <Text style={[styles.detailValue, { color: textPrimary }]}>
              {riskStatus.dailyTradeCount} / {riskStatus.dailyTradeLimit}
            </Text>
          </View>
        </View>
      )}

      {/* Warnings */}
      {showWarnings && riskStatus.warnings.length > 0 && (
        <View style={[styles.warningsSection, { backgroundColor: dark ? '#1A1A1F' : '#FEF3C7' }]}>
          <Text style={[styles.warningsTitle, { color: '#F59E0B' }]}>Warnings</Text>
          {riskStatus.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningIcon}>!</Text>
              <Text style={[styles.warningText, { color: textSecondary }]}>{warning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Strategy Risks */}
      {riskStatus.strategyRisks && Object.keys(riskStatus.strategyRisks).length > 0 && (
        <View style={styles.strategyRisksSection}>
          <Text style={[styles.sectionTitle, { color: textMuted }]}>Strategy Risk Breakdown</Text>
          {Object.entries(riskStatus.strategyRisks).map(([strategyId, risk]) => {
            const strategyRiskConfig = RISK_LEVEL_COLORS[risk.riskLevel];
            return (
              <View key={strategyId} style={styles.strategyRiskItem}>
                <Text style={[styles.strategyName, { color: textSecondary }]}>
                  {strategyId.replace('-01', '')}
                </Text>
                <View style={[styles.strategyRiskBadge, { backgroundColor: strategyRiskConfig.bgColor }]}>
                  <Text style={[styles.strategyRiskText, { color: strategyRiskConfig.color }]}>
                    {risk.riskLevel.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.strategyExposure, { color: textMuted }]}>
                  ${risk.exposure.toFixed(0)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 14,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  riskBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
  },
  riskTextLarge: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
  },
  tradingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tradingStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactExposure: {
    fontFamily: MONO,
    fontSize: 11,
    flex: 1,
  },
  compactPnl: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    gap: 10,
  },
  progressItem: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  progressValue: {
    fontFamily: MONO,
    fontSize: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontFamily: MONO,
    fontSize: 10,
    textAlign: 'right',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48%',
    gap: 2,
  },
  detailLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '600',
  },
  warningsSection: {
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  warningsTitle: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#F59E0B',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 8,
    overflow: 'hidden',
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  strategyRisksSection: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  strategyRiskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strategyName: {
    fontFamily: MONO,
    fontSize: 11,
    flex: 1,
    textTransform: 'capitalize',
  },
  strategyRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strategyRiskText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: '700',
  },
  strategyExposure: {
    fontFamily: MONO,
    fontSize: 10,
    width: 60,
    textAlign: 'right',
  },
});
