/**
 * ONE SDK - Master Trading Console Hook
 * Orchestrates all AI and Forex trading data in a unified interface
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAIQuantConsole } from './useAIQuantConsole';
import { useForexSimulation, useForexPools, useForexInvestments } from './useForexTrading';
import type {
  AIAgent,
  AIPosition,
  AIDecision,
  RiskStatus,
  ConsoleMetrics,
  CombinedLogEntry,
  TradingConsoleOptions,
  TradingConsoleState,
} from '../types/console';
import { DEFAULT_CONSOLE_METRICS } from '../types/console';
import type { BotLogEntry, BotState, StrategyPersonality } from '../services/forex/BotSimulationEngine';
import type { ForexLogEntry, ForexPoolTransaction, ForexPool, ForexInvestment } from '../types/forex';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseTradingConsoleResult {
  // AI Data
  ai: {
    strategies: StrategyPersonality[];
    agents: AIAgent[];
    positions: AIPosition[];
    decisions: AIDecision[];
    riskStatus: RiskStatus | null;
    simulationLogs: BotLogEntry[];
    logsByStrategy: Map<string, BotLogEntry[]>;
    botStates: Map<string, BotState>;
  };
  // Forex Data
  forex: {
    logs: ForexLogEntry[];
    poolTransactions: ForexPoolTransaction[];
    pools: ForexPool[];
    investments: ForexInvestment[];
    stats: {
      totalPnl: number;
      totalTrades: number;
      totalPips: number;
      totalLots: number;
    };
  };
  // Combined
  combinedLogs: CombinedLogEntry[];
  metrics: ConsoleMetrics;
  // Controls
  controls: {
    startAISimulation: (strategyIds?: string[]) => void;
    stopAISimulation: (strategyIds?: string[]) => void;
    startForexSimulation: () => void;
    stopForexSimulation: () => void;
    startAll: () => void;
    stopAll: () => void;
    clearLogs: () => void;
    emitBootSequence: () => void;
    refreshAll: () => Promise<void>;
  };
  // State
  state: {
    isAISimulationRunning: boolean;
    isForexSimulationRunning: boolean;
    isAnyRunning: boolean;
    isLoading: boolean;
    error: string | null;
  };
  // Agent helpers
  getAgent: (strategyId: string) => AIAgent | undefined;
  getAgentLogs: (strategyId: string) => BotLogEntry[];
  getAgentPositions: (strategyId: string) => AIPosition[];
  getAgentDecisions: (strategyId: string) => AIDecision[];
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useTradingConsole(options?: TradingConsoleOptions): UseTradingConsoleResult {
  const simulation = options?.simulation ?? true;
  const pollInterval = options?.pollInterval ?? 5000;
  const maxLogs = options?.maxLogs ?? 500;
  const strategyIds = options?.strategyIds;
  const autoStart = options?.autoStart ?? false;

  // AI Console Hook
  const aiConsole = useAIQuantConsole({
    simulation,
    pollInterval,
    maxLogs,
    strategyIds,
  });

  // Forex Hooks
  const forexSim = useForexSimulation({ maxLogs });
  const forexPools = useForexPools({ refreshInterval: pollInterval });
  const forexInvestments = useForexInvestments({ refreshInterval: pollInterval });

  // Combine logs from both AI and Forex
  const combinedLogs = useMemo((): CombinedLogEntry[] => {
    const combined: CombinedLogEntry[] = [];

    // Add AI logs
    for (const log of aiConsole.logs) {
      combined.push({
        id: log.id,
        timestamp: log.timestamp,
        source: 'ai',
        strategyId: log.strategyId,
        strategyName: log.strategyName,
        type: log.type,
        message: log.message,
        data: log.data,
        importance: log.importance,
      });
    }

    // Add Forex logs
    for (const log of forexSim.logs) {
      combined.push({
        id: log.id,
        timestamp: log.timestamp,
        source: 'forex',
        type: log.type,
        message: log.message,
        data: log.data,
        importance: log.importance,
      });
    }

    // Sort by timestamp descending
    return combined.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxLogs);
  }, [aiConsole.logs, forexSim.logs, maxLogs]);

  // Combine metrics from AI and Forex
  const combinedMetrics = useMemo((): ConsoleMetrics => {
    const aiMetrics = aiConsole.metrics;

    // Add forex stats to metrics
    return {
      ...aiMetrics,
      totalPnl: aiMetrics.totalPnl + forexSim.stats.totalPnl,
      totalTrades: aiMetrics.totalTrades + forexSim.stats.totalTrades,
    };
  }, [aiConsole.metrics, forexSim.stats]);

  // Controls
  const controls = useMemo(() => ({
    startAISimulation: (ids?: string[]) => {
      aiConsole.emitBootSequence();
      setTimeout(() => aiConsole.start(ids), 5500);
    },
    stopAISimulation: (ids?: string[]) => {
      aiConsole.stop(ids);
    },
    startForexSimulation: () => {
      forexSim.start();
    },
    stopForexSimulation: () => {
      forexSim.stop();
    },
    startAll: () => {
      aiConsole.emitBootSequence();
      setTimeout(() => {
        aiConsole.start();
        forexSim.start();
      }, 5500);
    },
    stopAll: () => {
      aiConsole.stop();
      forexSim.stop();
    },
    clearLogs: () => {
      aiConsole.clearLogs();
      forexSim.clearLogs();
    },
    emitBootSequence: () => {
      aiConsole.emitBootSequence();
    },
    refreshAll: async () => {
      await Promise.all([
        aiConsole.refresh(),
        forexPools.refresh(),
        forexInvestments.refresh(),
      ]);
    },
  }), [aiConsole, forexSim, forexPools, forexInvestments]);

  // State
  const state = useMemo(() => ({
    isAISimulationRunning: aiConsole.isRunning,
    isForexSimulationRunning: forexSim.isRunning,
    isAnyRunning: aiConsole.isRunning || forexSim.isRunning,
    isLoading: aiConsole.isLoading || forexPools.isLoading || forexInvestments.isLoading,
    error: aiConsole.error || forexPools.error || forexInvestments.error,
  }), [aiConsole.isRunning, aiConsole.isLoading, aiConsole.error, forexSim.isRunning, forexPools, forexInvestments]);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart) {
      controls.startAll();
    }
  }, [autoStart, controls]);

  return {
    ai: {
      strategies: aiConsole.strategies,
      agents: aiConsole.agents,
      positions: aiConsole.positions,
      decisions: aiConsole.decisions,
      riskStatus: aiConsole.riskStatus,
      simulationLogs: aiConsole.logs,
      logsByStrategy: aiConsole.logsByStrategy,
      botStates: aiConsole.botStates,
    },
    forex: {
      logs: forexSim.logs,
      poolTransactions: forexSim.poolTransactions,
      pools: forexPools.pools,
      investments: forexInvestments.investments,
      stats: forexSim.stats,
    },
    combinedLogs,
    metrics: combinedMetrics,
    controls,
    state,
    getAgent: aiConsole.getAgent,
    getAgentLogs: aiConsole.getAgentLogs,
    getAgentPositions: aiConsole.getAgentPositions,
    getAgentDecisions: aiConsole.getAgentDecisions,
  };
}

// ── Convenience Exports ───────────────────────────────────────────────────────

export { useAIQuantConsole } from './useAIQuantConsole';
export { useBotSimulation } from './useBotSimulation';
export { useAIPositions, setConsoleAccessToken, clearConsoleAccessToken, setConsoleEngineUrl } from './useAIPositions';
export { useAIDecisions } from './useAIDecisions';
export { useAIRiskStatus } from './useAIRiskStatus';
