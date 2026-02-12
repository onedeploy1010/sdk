/**
 * OneAIQuantConsole - All 7 AI agents overview
 * Part of ONE Ecosystem SDK
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import type { AIAgent, ConsoleMetrics, RiskStatus } from '../../../types/console';
import { OneAgentCard } from './OneAgentCard';
import { OneMetricsDashboard } from './OneMetricsDashboard';
import { OneRiskIndicator } from './OneRiskIndicator';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export interface OneAIQuantConsoleProps {
  agents: AIAgent[];
  metrics?: ConsoleMetrics;
  riskStatus?: RiskStatus | null;
  layout?: 'list' | 'grid' | 'compact';
  showMetrics?: boolean;
  showRisk?: boolean;
  showPerformance?: boolean;
  showPositions?: boolean;
  onAgentSelect?: (agent: AIAgent) => void;
  onStartAll?: () => void;
  onStopAll?: () => void;
  isRunning?: boolean;
  style?: ViewStyle;
  dark?: boolean;
}

export const OneAIQuantConsole: React.FC<OneAIQuantConsoleProps> = ({
  agents,
  metrics,
  riskStatus,
  layout = 'list',
  showMetrics = true,
  showRisk = true,
  showPerformance = true,
  showPositions = true,
  onAgentSelect,
  onStartAll,
  onStopAll,
  isRunning = false,
  style,
  dark = true,
}) => {
  const bg = dark ? '#0A0A0C' : '#ffffff';
  const border = dark ? '#2A2A35' : '#E5E7EB';
  const textPrimary = dark ? '#ffffff' : '#111827';
  const textSecondary = dark ? '#9CA3AF' : '#6B7280';
  const textMuted = dark ? '#555560' : '#9CA3AF';
  const cardBg = dark ? '#111111' : '#F9FAFB';

  const [selectedTab, setSelectedTab] = useState<'agents' | 'metrics' | 'risk'>('agents');

  const activeAgents = agents.filter(a => a.status === 'active');
  const totalPnl = agents.reduce((sum, a) => sum + a.totalPnl, 0);
  const totalPositions = agents.reduce((sum, a) => sum + a.openPositions, 0);

  const handleAgentPress = (agent: AIAgent) => {
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  const renderAgentList = () => {
    if (layout === 'compact') {
      return (
        <View style={styles.compactGrid}>
          {agents.map(agent => (
            <OneAgentCard
              key={agent.id}
              agent={agent}
              onPress={handleAgentPress}
              compact={true}
              dark={dark}
              style={styles.compactCard}
            />
          ))}
        </View>
      );
    }

    if (layout === 'grid') {
      return (
        <View style={styles.agentGrid}>
          {agents.map(agent => (
            <View key={agent.id} style={styles.gridItem}>
              <OneAgentCard
                agent={agent}
                onPress={handleAgentPress}
                showMetrics={showPerformance}
                showIndicators={true}
                dark={dark}
              />
            </View>
          ))}
        </View>
      );
    }

    // Default: list layout
    return (
      <View style={styles.agentList}>
        {agents.map(agent => (
          <OneAgentCard
            key={agent.id}
            agent={agent}
            onPress={handleAgentPress}
            showMetrics={showPerformance}
            showIndicators={showPositions}
            dark={dark}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: textPrimary }]}>AI Quant Console</Text>
          <View style={[styles.statusBadge, { backgroundColor: isRunning ? '#D1FAE5' : '#F3F4F6' }]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isRunning ? '#10B981' : '#9CA3AF' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isRunning ? '#10B981' : '#9CA3AF' }
            ]}>
              {isRunning ? 'Running' : 'Stopped'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {onStartAll && onStopAll && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: isRunning ? '#FEE2E2' : '#D1FAE5' }
              ]}
              onPress={isRunning ? onStopAll : onStartAll}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.controlButtonText,
                { color: isRunning ? '#EF4444' : '#10B981' }
              ]}>
                {isRunning ? 'Stop All' : 'Start All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
          <Text style={[styles.quickStatLabel, { color: textMuted }]}>Total P&L</Text>
          <Text style={[
            styles.quickStatValue,
            { color: totalPnl >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: textMuted }]}>Positions</Text>
          <Text style={[styles.quickStatValue, { color: textPrimary }]}>
            {totalPositions}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'agents' && styles.tabActive,
            selectedTab === 'agents' && { borderBottomColor: '#3B82F6' }
          ]}
          onPress={() => setSelectedTab('agents')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'agents' ? '#3B82F6' : textSecondary }
          ]}>
            Agents ({agents.length})
          </Text>
        </TouchableOpacity>
        {showMetrics && metrics && (
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'metrics' && styles.tabActive,
              selectedTab === 'metrics' && { borderBottomColor: '#3B82F6' }
            ]}
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
            style={[
              styles.tab,
              selectedTab === 'risk' && styles.tabActive,
              selectedTab === 'risk' && { borderBottomColor: '#3B82F6' }
            ]}
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
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {selectedTab === 'agents' && renderAgentList()}

        {selectedTab === 'metrics' && metrics && (
          <OneMetricsDashboard
            metrics={metrics}
            showNAV={true}
            showPnL={true}
            showTrades={true}
            showPositions={true}
            showStrategies={true}
            dark={dark}
          />
        )}

        {selectedTab === 'risk' && riskStatus && (
          <OneRiskIndicator
            riskStatus={riskStatus}
            showDetails={true}
            showWarnings={true}
            showLimits={true}
            dark={dark}
          />
        )}

        {/* Empty state */}
        {agents.length === 0 && selectedTab === 'agents' && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: textMuted }]}>⚡</Text>
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>
              No Agents Available
            </Text>
            <Text style={[styles.emptyText, { color: textMuted }]}>
              Start the simulation to see AI trading agents
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
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
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '700',
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2A35',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 14,
    gap: 12,
  },
  agentList: {
    gap: 12,
  },
  agentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  compactGrid: {
    gap: 8,
  },
  compactCard: {
    marginBottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
