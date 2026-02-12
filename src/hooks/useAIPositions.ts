/**
 * ONE SDK - AI Positions Hook
 * Provides React hook for fetching and tracking AI trading positions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AIPosition, PositionStatus } from '../types/console';

// ── Configuration ─────────────────────────────────────────────────────────────

let _consoleAccessToken: string | null = null;
let _consoleEngineUrl: string = 'https://api.one23.io';

export function setConsoleAccessToken(token: string): void {
  _consoleAccessToken = token;
}

export function clearConsoleAccessToken(): void {
  _consoleAccessToken = null;
}

export function setConsoleEngineUrl(url: string): void {
  _consoleEngineUrl = url;
}

// ── Internal API Helper ───────────────────────────────────────────────────────

async function consoleApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (_consoleAccessToken) {
      headers['Authorization'] = `Bearer ${_consoleAccessToken}`;
    }
    const res = await fetch(`${_consoleEngineUrl}${path}`, { ...options, headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAIPositionsOptions {
  strategyId?: string;
  strategyIds?: string[];
  status?: PositionStatus | PositionStatus[];
  pollInterval?: number;
  simulation?: boolean;
}

export interface UseAIPositionsResult {
  positions: AIPosition[];
  openPositions: AIPosition[];
  closedPositions: AIPosition[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Position actions
  closePosition: (positionId: string) => Promise<boolean>;
  updateStopLoss: (positionId: string, stopLoss: number) => Promise<boolean>;
  updateTakeProfit: (positionId: string, takeProfit: number) => Promise<boolean>;
  // Computed values
  summary: {
    totalPositions: number;
    openCount: number;
    totalExposure: number;
    totalPnl: number;
    unrealizedPnl: number;
    avgLeverage: number;
    byStrategy: Record<string, { count: number; pnl: number; exposure: number }>;
  };
}

// ── Simulation Data Generator ─────────────────────────────────────────────────

function generateSimulatedPositions(strategyIds?: string[]): AIPosition[] {
  const strategies = [
    { id: 'balanced-01', name: 'Balanced Alpha', shortName: 'BAL' },
    { id: 'conservative-01', name: 'Conservative Shield', shortName: 'CON' },
    { id: 'aggressive-01', name: 'Aggressive Momentum', shortName: 'AGG' },
  ];

  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT', 'AVAX/USDT'];
  const basePrices: Record<string, number> = {
    'BTC/USDT': 67500,
    'ETH/USDT': 3450,
    'SOL/USDT': 178,
    'ARB/USDT': 1.18,
    'AVAX/USDT': 38.5,
  };

  const positions: AIPosition[] = [];
  const filteredStrategies = strategyIds
    ? strategies.filter(s => strategyIds.includes(s.id))
    : strategies;

  for (const strategy of filteredStrategies) {
    // Generate 0-3 positions per strategy
    const numPositions = Math.floor(Math.random() * 4);
    for (let i = 0; i < numPositions; i++) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const basePrice = basePrices[pair];
      const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      const entryPrice = basePrice * (1 + (Math.random() - 0.5) * 0.02);
      const currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.03);
      const leverage = Math.floor(Math.random() * 10) + 2;
      const size = Math.floor(Math.random() * 1000) + 100;
      const margin = size / leverage;

      const priceDiff = side === 'LONG'
        ? (currentPrice - entryPrice) / entryPrice
        : (entryPrice - currentPrice) / entryPrice;
      const pnlPercent = priceDiff * leverage * 100;
      const pnl = size * priceDiff * leverage;

      positions.push({
        id: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        strategyId: strategy.id,
        strategyName: strategy.name,
        pair,
        side,
        entryPrice,
        currentPrice,
        size,
        leverage,
        margin,
        pnl,
        pnlPercent,
        status: 'open',
        stopLoss: entryPrice * (side === 'LONG' ? 0.95 : 1.05),
        takeProfit: entryPrice * (side === 'LONG' ? 1.1 : 0.9),
        liquidationPrice: entryPrice * (side === 'LONG' ? (1 - 1 / leverage) : (1 + 1 / leverage)),
        openTime: Date.now() - Math.floor(Math.random() * 86400000),
        chain: ['ethereum', 'arbitrum', 'base'][Math.floor(Math.random() * 3)],
        aiConfidence: Math.random() * 0.4 + 0.5,
        aiReasoning: `${side === 'LONG' ? 'Bullish' : 'Bearish'} momentum detected on ${pair}`,
      });
    }
  }

  return positions;
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useAIPositions(options?: UseAIPositionsOptions): UseAIPositionsResult {
  const [positions, setPositions] = useState<AIPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (options?.simulation) {
        // Use simulated data
        const simulated = generateSimulatedPositions(options?.strategyIds);
        setPositions(simulated);
      } else {
        // Fetch from API
        let path = '/api/v1/ai-quant/positions';
        const params = new URLSearchParams();
        if (options?.strategyId) {
          params.append('strategyId', options.strategyId);
        }
        if (options?.strategyIds?.length) {
          params.append('strategyIds', options.strategyIds.join(','));
        }
        if (options?.status) {
          const statuses = Array.isArray(options.status) ? options.status : [options.status];
          params.append('status', statuses.join(','));
        }
        if (params.toString()) {
          path += `?${params.toString()}`;
        }

        const data = await consoleApi<{ positions: any[] }>(path);
        if (data?.positions) {
          setPositions(data.positions.map(mapPosition));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setIsLoading(false);
    }
  }, [options?.simulation, options?.strategyId, options?.strategyIds, options?.status]);

  // Close position
  const closePosition = useCallback(async (positionId: string): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setPositions(prev => prev.map(p =>
          p.id === positionId ? { ...p, status: 'closed' as const, closeTime: Date.now() } : p
        ));
        return true;
      }
      await consoleApi(`/api/v1/ai-quant/positions/${positionId}/close`, { method: 'POST' });
      setPositions(prev => prev.map(p =>
        p.id === positionId ? { ...p, status: 'closed' as const, closeTime: Date.now() } : p
      ));
      return true;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  // Update stop loss
  const updateStopLoss = useCallback(async (positionId: string, stopLoss: number): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setPositions(prev => prev.map(p =>
          p.id === positionId ? { ...p, stopLoss } : p
        ));
        return true;
      }
      await consoleApi(`/api/v1/ai-quant/positions/${positionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stopLoss }),
      });
      setPositions(prev => prev.map(p =>
        p.id === positionId ? { ...p, stopLoss } : p
      ));
      return true;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  // Update take profit
  const updateTakeProfit = useCallback(async (positionId: string, takeProfit: number): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setPositions(prev => prev.map(p =>
          p.id === positionId ? { ...p, takeProfit } : p
        ));
        return true;
      }
      await consoleApi(`/api/v1/ai-quant/positions/${positionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ takeProfit }),
      });
      setPositions(prev => prev.map(p =>
        p.id === positionId ? { ...p, takeProfit } : p
      ));
      return true;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  // Initial fetch and polling
  useEffect(() => {
    fetchPositions();
    if (options?.pollInterval) {
      const timer = setInterval(fetchPositions, options.pollInterval);
      return () => clearInterval(timer);
    }
  }, [fetchPositions, options?.pollInterval]);

  // Computed values
  const openPositions = useMemo(() =>
    positions.filter(p => p.status === 'open'),
    [positions]
  );

  const closedPositions = useMemo(() =>
    positions.filter(p => p.status === 'closed'),
    [positions]
  );

  const summary = useMemo(() => {
    const open = positions.filter(p => p.status === 'open');
    const byStrategy: Record<string, { count: number; pnl: number; exposure: number }> = {};

    for (const pos of open) {
      if (!byStrategy[pos.strategyId]) {
        byStrategy[pos.strategyId] = { count: 0, pnl: 0, exposure: 0 };
      }
      byStrategy[pos.strategyId].count++;
      byStrategy[pos.strategyId].pnl += pos.pnl;
      byStrategy[pos.strategyId].exposure += pos.size;
    }

    const totalExposure = open.reduce((sum, p) => sum + p.size, 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const unrealizedPnl = open.reduce((sum, p) => sum + p.pnl, 0);
    const avgLeverage = open.length > 0
      ? open.reduce((sum, p) => sum + p.leverage, 0) / open.length
      : 0;

    return {
      totalPositions: positions.length,
      openCount: open.length,
      totalExposure,
      totalPnl,
      unrealizedPnl,
      avgLeverage,
      byStrategy,
    };
  }, [positions]);

  return {
    positions,
    openPositions,
    closedPositions,
    isLoading,
    error,
    refresh: fetchPositions,
    closePosition,
    updateStopLoss,
    updateTakeProfit,
    summary,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function mapPosition(raw: any): AIPosition {
  return {
    id: raw.id,
    strategyId: raw.strategyId ?? raw.strategy_id,
    strategyName: raw.strategyName ?? raw.strategy_name ?? '',
    pair: raw.pair,
    side: raw.side,
    entryPrice: raw.entryPrice ?? raw.entry_price ?? 0,
    currentPrice: raw.currentPrice ?? raw.current_price ?? 0,
    size: raw.size ?? 0,
    leverage: raw.leverage ?? 1,
    margin: raw.margin ?? raw.size / (raw.leverage ?? 1),
    pnl: raw.pnl ?? 0,
    pnlPercent: raw.pnlPercent ?? raw.pnl_percent ?? 0,
    status: raw.status ?? 'open',
    stopLoss: raw.stopLoss ?? raw.stop_loss,
    takeProfit: raw.takeProfit ?? raw.take_profit,
    liquidationPrice: raw.liquidationPrice ?? raw.liquidation_price,
    openTime: raw.openTime ?? raw.open_time ?? Date.now(),
    closeTime: raw.closeTime ?? raw.close_time,
    chain: raw.chain,
    orderId: raw.orderId ?? raw.order_id,
    aiConfidence: raw.aiConfidence ?? raw.ai_confidence,
    aiReasoning: raw.aiReasoning ?? raw.ai_reasoning,
  };
}
