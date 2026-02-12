/**
 * ONE SDK - AI Quant Console Hook
 * Combined hook for all AI trading console data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBotSimulation } from './useBotSimulation';
import { useAIPositions } from './useAIPositions';
import { useAIDecisions } from './useAIDecisions';
import { useAIRiskStatus } from './useAIRiskStatus';
import type {
  AIAgent,
  AIPosition,
  AIDecision,
  RiskStatus,
  ConsoleMetrics,
  AIQuantConsoleOptions,
} from '../types/console';
import { DEFAULT_CONSOLE_METRICS, AGENT_STATUS_COLORS } from '../types/console';
import type { BotLogEntry, BotState, StrategyPersonality } from '../services/forex/BotSimulationEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAIQuantConsoleResult {
  // Strategies and Agents
  strategies: StrategyPersonality[];
  agents: AIAgent[];
  // Logs
  logs: BotLogEntry[];
  logsByStrategy: Map<string, BotLogEntry[]>;
  // Bot States
  botStates: Map<string, BotState>;
  // Positions
  positions: AIPosition[];
  openPositions: AIPosition[];
  // Decisions
  decisions: AIDecision[];
  recentDecisions: AIDecision[];
  // Risk
  riskStatus: RiskStatus | null;
  // Metrics
  metrics: ConsoleMetrics;
  // State
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  // Controls
  start: (strategyIds?: string[]) => void;
  stop: (strategyIds?: string[]) => void;
  clearLogs: () => void;
  emitBootSequence: () => void;
  refresh: () => Promise<void>;
  // Agent helpers
  getAgent: (strategyId: string) => AIAgent | undefined;
  getAgentLogs: (strategyId: string) => BotLogEntry[];
  getAgentPositions: (strategyId: string) => AIPosition[];
  getAgentDecisions: (strategyId: string) => AIDecision[];
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useAIQuantConsole(options?: AIQuantConsoleOptions): UseAIQuantConsoleResult {
  const simulation = options?.simulation ?? true;
  const pollInterval = options?.pollInterval ?? 5000;
  const maxLogs = options?.maxLogs ?? 500;
  const strategyIds = options?.strategyIds;

  // Sub-hooks
  const botSim = useBotSimulation({
    maxLogs,
    strategyIds,
    autoStart: false,
  });

  const positionsHook = useAIPositions({
    strategyIds,
    pollInterval,
    simulation,
  });

  const decisionsHook = useAIDecisions({
    strategyIds,
    pollInterval,
    simulation,
    limit: 100,
  });

  const riskHook = useAIRiskStatus({
    pollInterval,
    simulation,
  });

  // Transform bot states to agents
  const agents = useMemo((): AIAgent[] => {
    const agentList: AIAgent[] = [];

    for (const strategy of botSim.strategies) {
      const state = botSim.botStates.get(strategy.id);
      const strategyPositions = positionsHook.positions.filter(p => p.strategyId === strategy.id);
      const strategyDecisions = decisionsHook.decisions.filter(d => d.strategyId === strategy.id);
      const openPos = strategyPositions.filter(p => p.status === 'open');

      const totalPnl = strategyPositions.reduce((sum, p) => sum + p.pnl, 0);
      const exposure = openPos.reduce((sum, p) => sum + p.size, 0);
      const winCount = strategyPositions.filter(p => p.pnl > 0).length;
      const totalTrades = strategyPositions.length;

      // Determine agent risk level based on exposure and drawdown
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (strategy.riskTolerance === 'high') riskLevel = 'medium';
      if (exposure > 50000) riskLevel = 'high';
      if (state && state.openPositions.length >= 3) riskLevel = 'high';

      agentList.push({
        id: strategy.id,
        strategyId: strategy.id,
        name: strategy.name,
        shortName: strategy.shortName,
        color: strategy.color,
        status: state?.isRunning ? 'active' : botSim.isRunning ? 'idle' : 'paused',
        totalPnl: state?.totalPnl ?? totalPnl,
        pnlToday: totalPnl * 0.3, // Simulated
        winRate: state?.winRate ?? (totalTrades > 0 ? winCount / totalTrades : 0.5),
        totalTrades: state?.totalTrades ?? totalTrades,
        tradesToday: Math.floor((state?.totalTrades ?? totalTrades) * 0.2),
        currentPair: state?.currentPair,
        currentPrice: state?.currentPrice,
        lastSignal: state?.lastSignal,
        lastSignalConfidence: state?.lastSignalConfidence,
        lastActivity: state ? Date.now() : undefined,
        openPositions: openPos.length,
        totalExposure: exposure,
        riskLevel,
        drawdown: Math.random() * 5, // Simulated
        riskTolerance: strategy.riskTolerance,
        primaryIndicators: strategy.primaryIndicators,
        preferredPairs: strategy.preferredPairs,
        leverageRange: [strategy.leverageMin, strategy.leverageMax],
      });
    }

    return agentList;
  }, [botSim.strategies, botSim.botStates, botSim.isRunning, positionsHook.positions, decisionsHook.decisions]);

  // Calculate combined metrics
  const metrics = useMemo((): ConsoleMetrics => {
    const positions = positionsHook.positions;
    const openPos = positions.filter(p => p.status === 'open');
    const closedPos = positions.filter(p => p.status === 'closed');

    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const unrealizedPnl = openPos.reduce((sum, p) => sum + p.pnl, 0);
    const realizedPnl = closedPos.reduce((sum, p) => sum + p.pnl, 0);

    const wins = positions.filter(p => p.pnl > 0);
    const losses = positions.filter(p => p.pnl < 0);

    const avgWin = wins.length > 0
      ? wins.reduce((sum, p) => sum + p.pnl, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0)) / losses.length
      : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const totalExposure = openPos.reduce((sum, p) => sum + p.size, 0);
    const avgLeverage = openPos.length > 0
      ? openPos.reduce((sum, p) => sum + p.leverage, 0) / openPos.length
      : 0;

    // Strategy metrics
    const strategyMetrics: Record<string, { pnl: number; trades: number; winRate: number; exposure: number }> = {};
    for (const agent of agents) {
      const strategyPos = positions.filter(p => p.strategyId === agent.strategyId);
      const strategyOpen = strategyPos.filter(p => p.status === 'open');
      const strategyWins = strategyPos.filter(p => p.pnl > 0);

      strategyMetrics[agent.strategyId] = {
        pnl: strategyPos.reduce((sum, p) => sum + p.pnl, 0),
        trades: strategyPos.length,
        winRate: strategyPos.length > 0 ? strategyWins.length / strategyPos.length : 0,
        exposure: strategyOpen.reduce((sum, p) => sum + p.size, 0),
      };
    }

    return {
      nav: 100000 + totalPnl,
      navChange24h: totalPnl * 0.3,
      navChangePercent24h: (totalPnl * 0.3) / 100000 * 100,
      totalPnl,
      realizedPnl,
      unrealizedPnl,
      pnlToday: totalPnl * 0.3,
      pnl7d: totalPnl * 0.7,
      pnl30d: totalPnl,
      totalTrades: positions.length,
      tradesToday: Math.floor(positions.length * 0.2),
      winRate: positions.length > 0 ? wins.length / positions.length : 0,
      winCount: wins.length,
      lossCount: losses.length,
      avgWin,
      avgLoss,
      profitFactor,
      openPositions: openPos.length,
      totalExposure,
      avgLeverage,
      strategyMetrics,
    };
  }, [positionsHook.positions, agents]);

  // Controls
  const start = useCallback((ids?: string[]) => {
    botSim.start(ids || strategyIds);
  }, [botSim, strategyIds]);

  const stop = useCallback((ids?: string[]) => {
    botSim.stop(ids);
  }, [botSim]);

  const clearLogs = useCallback(() => {
    botSim.clearLogs();
  }, [botSim]);

  const refresh = useCallback(async () => {
    await Promise.all([
      positionsHook.refresh(),
      decisionsHook.refresh(),
      riskHook.refresh(),
    ]);
  }, [positionsHook, decisionsHook, riskHook]);

  // Agent helpers
  const getAgent = useCallback((strategyId: string) =>
    agents.find(a => a.strategyId === strategyId),
    [agents]
  );

  const getAgentLogs = useCallback((strategyId: string) =>
    botSim.logsByStrategy.get(strategyId) || [],
    [botSim.logsByStrategy]
  );

  const getAgentPositions = useCallback((strategyId: string) =>
    positionsHook.positions.filter(p => p.strategyId === strategyId),
    [positionsHook.positions]
  );

  const getAgentDecisions = useCallback((strategyId: string) =>
    decisionsHook.decisions.filter(d => d.strategyId === strategyId),
    [decisionsHook.decisions]
  );

  // Combined loading/error state
  const isLoading = positionsHook.isLoading || decisionsHook.isLoading || riskHook.isLoading;
  const error = positionsHook.error || decisionsHook.error || riskHook.error;

  return {
    strategies: botSim.strategies,
    agents,
    logs: botSim.logs,
    logsByStrategy: botSim.logsByStrategy,
    botStates: botSim.botStates,
    positions: positionsHook.positions,
    openPositions: positionsHook.openPositions,
    decisions: decisionsHook.decisions,
    recentDecisions: decisionsHook.recentDecisions,
    riskStatus: riskHook.riskStatus,
    metrics,
    isRunning: botSim.isRunning,
    isLoading,
    error,
    start,
    stop,
    clearLogs,
    emitBootSequence: botSim.emitBootSequence,
    refresh,
    getAgent,
    getAgentLogs,
    getAgentPositions,
    getAgentDecisions,
  };
}
