/**
 * ONE SDK - AI Decisions Hook
 * Provides React hook for fetching AI trading decision history with reasoning
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AIDecision, DecisionAction } from '../types/console';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAIDecisionsOptions {
  strategyId?: string;
  strategyIds?: string[];
  actions?: DecisionAction[];
  limit?: number;
  pollInterval?: number;
  simulation?: boolean;
}

export interface UseAIDecisionsResult {
  decisions: AIDecision[];
  recentDecisions: AIDecision[];
  executedDecisions: AIDecision[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Filters
  getByStrategy: (strategyId: string) => AIDecision[];
  getByAction: (action: DecisionAction) => AIDecision[];
  // Stats
  stats: {
    totalDecisions: number;
    executedCount: number;
    executionRate: number;
    byAction: Record<DecisionAction, number>;
    byStrategy: Record<string, number>;
    avgConfidence: number;
  };
}

// ── Simulation Data Generator ─────────────────────────────────────────────────

function generateSimulatedDecisions(
  strategyIds?: string[],
  limit: number = 50
): AIDecision[] {
  const strategies = [
    { id: 'balanced-01', name: 'Balanced Alpha' },
    { id: 'conservative-01', name: 'Conservative Shield' },
    { id: 'aggressive-01', name: 'Aggressive Momentum' },
  ];

  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT', 'AVAX/USDT'];
  const actions: DecisionAction[] = ['OPEN_LONG', 'OPEN_SHORT', 'CLOSE_LONG', 'CLOSE_SHORT', 'HOLD', 'SKIP'];

  const reasonings = {
    OPEN_LONG: [
      'RSI oversold with MACD bullish crossover',
      'Golden cross detected on EMA, volume confirming',
      'Support level held, momentum building',
      'Bullish divergence on RSI, trend reversal likely',
    ],
    OPEN_SHORT: [
      'RSI overbought with MACD bearish crossover',
      'Death cross on EMA, volume increasing',
      'Resistance level rejected, bearish pressure',
      'Bearish divergence detected, reversal expected',
    ],
    CLOSE_LONG: [
      'Take profit target reached',
      'Momentum weakening, securing profits',
      'Risk management triggered',
    ],
    CLOSE_SHORT: [
      'Take profit target reached',
      'Bearish momentum exhausted',
      'Stop loss proximity warning',
    ],
    HOLD: [
      'No clear signal, waiting for confirmation',
      'Consolidation phase, insufficient momentum',
      'Mixed indicators, patience advised',
    ],
    SKIP: [
      'Confidence below threshold',
      'Risk parameters exceeded',
      'Position limit reached',
    ],
  };

  const filteredStrategies = strategyIds
    ? strategies.filter(s => strategyIds.includes(s.id))
    : strategies;

  const decisions: AIDecision[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const strategy = filteredStrategies[Math.floor(Math.random() * filteredStrategies.length)];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const confidence = Math.random() * 0.5 + 0.3;
    const executed = action !== 'HOLD' && action !== 'SKIP' && confidence > 0.5;
    const reasoningList = reasonings[action];

    decisions.push({
      id: `dec_${now - i * 60000}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now - i * (Math.random() * 300000 + 60000),
      strategyId: strategy.id,
      strategyName: strategy.name,
      pair,
      action,
      confidence,
      reasoning: reasoningList[Math.floor(Math.random() * reasoningList.length)],
      indicators: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 2,
        ema: Math.random() > 0.5 ? 'bullish' : 'bearish',
        volume: Math.random() * 2 + 0.5,
        bollinger: Math.random() > 0.5 ? 'upper' : 'lower',
      },
      signals: [
        `RSI ${Math.random() > 0.5 ? 'oversold' : 'overbought'}`,
        `MACD ${Math.random() > 0.5 ? 'bullish' : 'bearish'}`,
      ],
      executed,
      positionId: executed ? `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` : undefined,
      price: 50000 * (1 + (Math.random() - 0.5) * 0.1),
      size: executed ? Math.floor(Math.random() * 1000) + 100 : undefined,
      leverage: executed ? Math.floor(Math.random() * 10) + 2 : undefined,
    });
  }

  return decisions.sort((a, b) => b.timestamp - a.timestamp);
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useAIDecisions(options?: UseAIDecisionsOptions): UseAIDecisionsResult {
  const limit = options?.limit ?? 100;
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (options?.simulation) {
        const simulated = generateSimulatedDecisions(options?.strategyIds, limit);
        setDecisions(simulated);
      } else {
        let path = '/api/v1/ai-quant/decisions';
        const params = new URLSearchParams();
        if (options?.strategyId) {
          params.append('strategyId', options.strategyId);
        }
        if (options?.strategyIds?.length) {
          params.append('strategyIds', options.strategyIds.join(','));
        }
        if (options?.actions?.length) {
          params.append('actions', options.actions.join(','));
        }
        params.append('limit', limit.toString());
        if (params.toString()) {
          path += `?${params.toString()}`;
        }

        const res = await fetch(`https://api.one23.io${path}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.decisions) {
            setDecisions(data.decisions.map(mapDecision));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch decisions');
    } finally {
      setIsLoading(false);
    }
  }, [options?.simulation, options?.strategyId, options?.strategyIds, options?.actions, limit]);

  // Initial fetch and polling
  useEffect(() => {
    fetchDecisions();
    if (options?.pollInterval) {
      const timer = setInterval(fetchDecisions, options.pollInterval);
      return () => clearInterval(timer);
    }
  }, [fetchDecisions, options?.pollInterval]);

  // Filter functions
  const getByStrategy = useCallback((strategyId: string) =>
    decisions.filter(d => d.strategyId === strategyId),
    [decisions]
  );

  const getByAction = useCallback((action: DecisionAction) =>
    decisions.filter(d => d.action === action),
    [decisions]
  );

  // Computed values
  const recentDecisions = useMemo(() =>
    decisions.slice(0, 10),
    [decisions]
  );

  const executedDecisions = useMemo(() =>
    decisions.filter(d => d.executed),
    [decisions]
  );

  const stats = useMemo(() => {
    const executed = decisions.filter(d => d.executed);
    const byAction: Record<DecisionAction, number> = {
      OPEN_LONG: 0,
      OPEN_SHORT: 0,
      CLOSE_LONG: 0,
      CLOSE_SHORT: 0,
      HOLD: 0,
      SKIP: 0,
    };
    const byStrategy: Record<string, number> = {};

    for (const d of decisions) {
      byAction[d.action]++;
      byStrategy[d.strategyId] = (byStrategy[d.strategyId] || 0) + 1;
    }

    const avgConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0;

    return {
      totalDecisions: decisions.length,
      executedCount: executed.length,
      executionRate: decisions.length > 0 ? executed.length / decisions.length : 0,
      byAction,
      byStrategy,
      avgConfidence,
    };
  }, [decisions]);

  return {
    decisions,
    recentDecisions,
    executedDecisions,
    isLoading,
    error,
    refresh: fetchDecisions,
    getByStrategy,
    getByAction,
    stats,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function mapDecision(raw: any): AIDecision {
  return {
    id: raw.id,
    timestamp: raw.timestamp ?? Date.now(),
    strategyId: raw.strategyId ?? raw.strategy_id,
    strategyName: raw.strategyName ?? raw.strategy_name ?? '',
    pair: raw.pair,
    action: raw.action,
    confidence: raw.confidence ?? 0,
    reasoning: raw.reasoning ?? '',
    indicators: raw.indicators ?? {},
    signals: raw.signals ?? [],
    executed: raw.executed ?? false,
    positionId: raw.positionId ?? raw.position_id,
    price: raw.price,
    size: raw.size,
    leverage: raw.leverage,
  };
}
