/**
 * OneTradingConsole - Total unified console view (AI + Forex)
 * Part of ONE Ecosystem SDK
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import type { CombinedLogEntry, ConsoleMetrics, RiskStatus, AIAgent } from '../../../types/console';
import type { BotLogEntry } from '../../../services/forex/BotSimulationEngine';
import type { ForexLogEntry } from '../../../types/forex';
import { AI_LOG_COLORS, FOREX_LOG_COLORS } from '../../../types/console';
import { OneMetricsDashboard } from './OneMetricsDashboard';
import { OneRiskIndicator } from './OneRiskIndicator';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneTradingConsoleProps {
  mode?: 'combined' | 'ai-only' | 'forex-only';
  // Combined logs
  combinedLogs?: CombinedLogEntry[];
  // Or separate logs
  aiLogs?: BotLogEntry[];
  forexLogs?: ForexLogEntry[];
  // Data
  agents?: AIAgent[];
  metrics?: ConsoleMetrics;
  riskStatus?: RiskStatus | null;
  // Display options
  maxLogs?: number;
  autoScroll?: boolean;
  showMetrics?: boolean;
  showRisk?: boolean;
  showControls?: boolean;
  consoleHeight?: number;
  // Controls
  isAIRunning?: boolean;
  isForexRunning?: boolean;
  onStartAI?: () => void;
  onStopAI?: () => void;
  onStartForex?: () => void;
  onStopForex?: () => void;
  onStartAll?: () => void;
  onStopAll?: () => void;
  onClearLogs?: () => void;
  onRefresh?: () => void;
  // Callbacks
  onAgentSelect?: (agent: AIAgent) => void;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneTradingConsole: React.FC<OneTradingConsoleProps> = ({
  mode = 'combined',
  combinedLogs = [],
  aiLogs = [],
  forexLogs = [],
  agents = [],
  metrics,
  riskStatus,
  maxLogs = 200,
  autoScroll = true,
  showMetrics = true,
  showRisk = true,
  showControls = true,
  consoleHeight = 400,
  isAIRunning = false,
  isForexRunning = false,
  onStartAI,
  onStopAI,
  onStartForex,
  onStopForex,
  onStartAll,
  onStopAll,
  onClearLogs,
  onRefresh,
  onAgentSelect,
  style,
  dark = true,
}) => {
  const bg = dark ? '#0A0A0C' : '#ffffff';
  const consoleBg = dark ? '#0A0A0C' : '#F9FAFB';
  const cardBg = dark ? '#111111' : '#F9FAFB';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';

  const scrollRef = useRef<ScrollView>(null);
  const [selectedTab, setSelectedTab] = useState<'console' | 'metrics' | 'risk' | 'agents'>('console');

  // Merge logs if not using combined
  const allLogs: CombinedLogEntry[] = combinedLogs.length > 0
    ? combinedLogs
    : [
        ...aiLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          source: 'ai' as const,
          strategyId: log.strategyId,
          strategyName: log.strategyName,
          type: log.type,
          message: log.message,
          data: log.data,
          importance: log.importance,
        })),
        ...forexLogs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          source: 'forex' as const,
          type: log.type,
          message: log.message,
          data: log.data,
          importance: log.importance,
        })),
      ].sort((a, b) => a.timestamp - b.timestamp);

  // Filter logs based on mode
  const filteredLogs = allLogs.filter(log => {
    if (mode === 'ai-only') return log.source === 'ai';
    if (mode === 'forex-only') return log.source === 'forex';
    return true;
  });

  const visibleLogs = filteredLogs.slice(-maxLogs);

  const isAnyRunning = isAIRunning || isForexRunning;

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current && selectedTab === 'console') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [visibleLogs.length, autoScroll, selectedTab]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const getLogColor = (log: CombinedLogEntry): string => {
    if (log.source === 'ai') {
      return AI_LOG_COLORS[log.type as keyof typeof AI_LOG_COLORS] || textMuted;
    }
    return FOREX_LOG_COLORS[log.type as keyof typeof FOREX_LOG_COLORS] || textMuted;
  };

  const activeAgents = agents.filter(a => a.status === 'active');
  const totalPnl = agents.reduce((sum, a) => sum + a.totalPnl, 0);

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: textPrimary }]}>Trading Console</Text>
          <View style={styles.statusBadges}>
            {mode !== 'forex-only' && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: isAIRunning ? '#D1FAE5' : '#F3F4F6' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isAIRunning ? '#10B981' : '#9CA3AF' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isAIRunning ? '#10B981' : '#9CA3AF' }
                ]}>
                  AI
                </Text>
              </View>
            )}
            {mode !== 'ai-only' && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: isForexRunning ? '#DBEAFE' : '#F3F4F6' }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isForexRunning ? '#3B82F6' : '#9CA3AF' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isForexRunning ? '#3B82F6' : '#9CA3AF' }
                ]}>
                  FX
                </Text>
              </View>
            )}
          </View>
        </View>
        {showControls && (
          <View style={styles.headerControls}>
            {onClearLogs && (
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: cardBg }]}
                onPress={onClearLogs}
                activeOpacity={0.7}
              >
                <Text style={[styles.controlBtnText, { color: textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}
            {onRefresh && (
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: cardBg }]}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Text style={[styles.controlBtnText, { color: textSecondary }]}>Refresh</Text>
              </TouchableOpacity>
            )}
            {(onStartAll || onStopAll) && (
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  { backgroundColor: isAnyRunning ? '#FEE2E2' : '#D1FAE5' }
                ]}
                onPress={isAnyRunning ? onStopAll : onStartAll}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.controlBtnText,
                  { color: isAnyRunning ? '#EF4444' : '#10B981' }
                ]}>
                  {isAnyRunning ? 'Stop' : 'Start'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={[styles.quickStats, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: textMuted }]}>Agents</Text>
          <Text style={[styles.quickStatValue, { color: textPrimary }]}>
            {activeAgents.length}/{agents.length}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: textMuted }]}>P&L</Text>
          <Text style={[
            styles.quickStatValue,
            { color: totalPnl >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: textMuted }]}>Logs</Text>
          <Text style={[styles.quickStatValue, { color: textPrimary }]}>
            {visibleLogs.length}
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'console' && styles.tabActive]}
          onPress={() => setSelectedTab('console')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'console' ? '#3B82F6' : textSecondary }
          ]}>
            Console
          </Text>
        </TouchableOpacity>
        {showMetrics && metrics && (
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'metrics' && styles.tabActive]}
            onPress={() => setSelectedTab('metrics')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'metrics' ? '#3B82F6' : textSecondary }
            ]}>
              Metrics
            </Text>
          </TouchableOpacity>
        )}
        {showRisk && riskStatus && (
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'risk' && styles.tabActive]}
            onPress={() => setSelectedTab('risk')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'risk' ? '#3B82F6' : textSecondary }
            ]}>
              Risk
            </Text>
          </TouchableOpacity>
        )}
        {agents.length > 0 && (
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'agents' && styles.tabActive]}
            onPress={() => setSelectedTab('agents')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'agents' ? '#3B82F6' : textSecondary }
            ]}>
              Agents
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {selectedTab === 'console' && (
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
                <View style={[
                  styles.sourceBadge,
                  { backgroundColor: log.source === 'ai' ? '#1E3A5F' : '#1E3A3A' }
                ]}>
                  <Text style={[
                    styles.sourceText,
                    { color: log.source === 'ai' ? '#60A5FA' : '#5EEAD4' }
                  ]}>
                    {log.source === 'ai' ? (log.strategyName || 'AI') : 'FX'}
                  </Text>
                </View>
                <Text style={[styles.logType, { color: getLogColor(log) }]}>
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
              <View style={styles.emptyState}>
                <Text style={[styles.emptyIcon, { color: textMuted }]}>⚡</Text>
                <Text style={[styles.emptyTitle, { color: textSecondary }]}>
                  No Activity Yet
                </Text>
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  Start the trading simulation to see live activity
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {selectedTab === 'metrics' && metrics && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
          <OneMetricsDashboard
            metrics={metrics}
            showNAV={true}
            showPnL={true}
            showTrades={true}
            showPositions={true}
            showStrategies={true}
            dark={dark}
          />
        </ScrollView>
      )}

      {selectedTab === 'risk' && riskStatus && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
          <OneRiskIndicator
            riskStatus={riskStatus}
            showDetails={true}
            showWarnings={true}
            showLimits={true}
            dark={dark}
          />
        </ScrollView>
      )}

      {selectedTab === 'agents' && agents.length > 0 && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
          {agents.map(agent => (
            <TouchableOpacity
              key={agent.id}
              style={[styles.agentRow, { backgroundColor: cardBg, borderColor: border }]}
              onPress={() => onAgentSelect?.(agent)}
              activeOpacity={0.7}
            >
              <View style={styles.agentLeft}>
                <View style={[styles.agentDot, { backgroundColor: agent.color }]} />
                <View>
                  <Text style={[styles.agentName, { color: textPrimary }]}>{agent.name}</Text>
                  <Text style={[styles.agentPair, { color: textMuted }]}>
                    {agent.currentPair || 'Idle'}
                  </Text>
                </View>
              </View>
              <View style={styles.agentRight}>
                <Text style={[
                  styles.agentPnl,
                  { color: agent.totalPnl >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {agent.totalPnl >= 0 ? '+' : ''}${agent.totalPnl.toFixed(2)}
                </Text>
                <View style={[
                  styles.agentStatus,
                  { backgroundColor: agent.status === 'active' ? '#D1FAE5' : '#F3F4F6' }
                ]}>
                  <Text style={[
                    styles.agentStatusText,
                    { color: agent.status === 'active' ? '#10B981' : '#9CA3AF' }
                  ]}>
                    {agent.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  controlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  quickStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  quickStatLabel: {
    fontFamily: MONO,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  quickStatValue: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2A35',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  consoleContainer: {
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
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  logTime: {
    fontFamily: MONO,
    fontSize: 10,
    width: 55,
    marginRight: 6,
  },
  sourceBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  sourceText: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '700',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    padding: 14,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  agentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  agentName: {
    fontSize: 13,
    fontWeight: '600',
  },
  agentPair: {
    fontFamily: MONO,
    fontSize: 10,
  },
  agentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  agentPnl: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '600',
  },
  agentStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  agentStatusText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
