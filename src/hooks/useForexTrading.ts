/**
 * ONE SDK - Forex Trading Hooks
 * Provides React hooks for StableFX on-chain forex trading integration
 * Can be used by any ecosystem partner
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  ForexPool,
  ForexPoolType,
  ForexInvestment,
  ForexLogEntry,
  ForexPoolTransaction,
  ForexPoolDailySnapshot,
  ForexTradeRecord,
} from '../types/forex';
import {
  FOREX_POOL_DEFAULTS,
  FOREX_CYCLE_OPTIONS,
  FOREX_AGENT,
  FOREX_CAPITAL_SPLIT,
  computePoolAllocations,
  estimateForexProfit,
} from '../types/forex';

// ── Configuration ────────────────────────────────────────────────────────────

let _forexAccessToken: string | null = null;
let _forexEngineUrl: string = 'https://api.one23.io';

/** Set the access token for authenticated forex API calls */
export function setForexAccessToken(token: string): void {
  _forexAccessToken = token;
}

/** Clear the forex access token */
export function clearForexAccessToken(): void {
  _forexAccessToken = null;
}

/** Configure the engine URL for forex API calls */
export function setForexEngineUrl(url: string): void {
  _forexEngineUrl = url;
}

// ── Internal API Helper ──────────────────────────────────────────────────────

async function forexApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (_forexAccessToken) {
      headers['Authorization'] = `Bearer ${_forexAccessToken}`;
    }
    const res = await fetch(`${_forexEngineUrl}${path}`, { ...options, headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

// ── useForexPools ────────────────────────────────────────────────────────────

export interface UseForexPoolsResult {
  pools: ForexPool[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useForexPools(options?: { refreshInterval?: number }): UseForexPoolsResult {
  const [pools, setPools] = useState<ForexPool[]>(FOREX_POOL_DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await forexApi<{ pools: any[] }>('/api/forex/pools');
      if (data?.pools) {
        setPools(data.pools.map((p: any) => ({
          id: p.type ?? p.id,
          nameKey: `forex.pool_${p.type ?? p.id}`,
          descriptionKey: `forex.pool_${p.type ?? p.id}_desc`,
          allocation: p.allocation ?? (p.type === 'clearing' ? 0.50 : p.type === 'hedging' ? 0.30 : 0.20),
          totalSize: p.totalSize ?? p.total_size ?? 0,
          utilization: p.utilization ?? 0,
          color: p.type === 'clearing' ? '#3B82F6' : p.type === 'hedging' ? '#F59E0B' : '#10B981',
          apy7d: p.apy7d ?? 0,
          apy30d: p.apy30d ?? 0,
          netFlow24h: p.netFlow24h ?? 0,
          txCount24h: p.txCount24h ?? 0,
          txCountTotal: p.txCountTotal ?? 0,
          totalDeposits: p.totalDeposits ?? 0,
          totalWithdrawals: p.totalWithdrawals ?? 0,
          profitDistributed: p.profitDistributed ?? 0,
          lastUpdated: p.lastUpdated ?? Date.now(),
        })));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
    if (options?.refreshInterval) {
      const timer = setInterval(fetchPools, options.refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchPools, options?.refreshInterval]);

  return { pools, isLoading, error, refresh: fetchPools };
}

// ── useForexInvestments ──────────────────────────────────────────────────────

export interface UseForexInvestmentsResult {
  investments: ForexInvestment[];
  isLoading: boolean;
  error: string | null;
  createInvestment: (params: { amount: number; selectedPairs: string[]; cycleDays: number }) => Promise<ForexInvestment | null>;
  redeemInvestment: (investmentId: string) => Promise<boolean>;
  refresh: () => void;
  portfolioSummary: {
    totalInvested: number;
    totalValue: number;
    totalProfit: number;
    activeCount: number;
  };
}

export function useForexInvestments(options?: { refreshInterval?: number }): UseForexInvestmentsResult {
  const [investments, setInvestments] = useState<ForexInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await forexApi<{ investments: any[] }>('/api/forex/investments');
      if (data?.investments) {
        setInvestments(data.investments.map(mapInvestment));
      }
      setError(null);
    } catch {
      setError('Failed to fetch investments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvestment = useCallback(async (params: {
    amount: number; selectedPairs: string[]; cycleDays: number;
  }): Promise<ForexInvestment | null> => {
    setIsLoading(true);
    try {
      const data = await forexApi<{ investment: any }>('/api/forex/investments', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (data?.investment) {
        const inv = mapInvestment(data.investment);
        setInvestments(prev => [inv, ...prev]);
        return inv;
      }
      // Local fallback
      const inv = createLocalInvestment(params);
      setInvestments(prev => [inv, ...prev]);
      return inv;
    } catch {
      const inv = createLocalInvestment(params);
      setInvestments(prev => [inv, ...prev]);
      return inv;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const redeemInvestment = useCallback(async (investmentId: string): Promise<boolean> => {
    try {
      await forexApi(`/api/forex/investments/${investmentId}/redeem`, { method: 'POST' });
      setInvestments(prev => prev.map(inv =>
        inv.id === investmentId ? { ...inv, status: 'redeemed' as const } : inv
      ));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    fetchInvestments();
    if (options?.refreshInterval) {
      const timer = setInterval(fetchInvestments, options.refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchInvestments, options?.refreshInterval]);

  const portfolioSummary = useMemo(() => {
    const active = investments.filter(i => i.status === 'active');
    return {
      totalInvested: active.reduce((s, i) => s + i.amount, 0),
      totalValue: active.reduce((s, i) => s + i.currentValue, 0),
      totalProfit: active.reduce((s, i) => s + i.profit, 0),
      activeCount: active.length,
    };
  }, [investments]);

  return { investments, isLoading, error, createInvestment, redeemInvestment, refresh: fetchInvestments, portfolioSummary };
}

// ── useForexSimulation ───────────────────────────────────────────────────────

export interface UseForexSimulationResult {
  logs: ForexLogEntry[];
  poolTransactions: ForexPoolTransaction[];
  isRunning: boolean;
  stats: { totalPnl: number; totalTrades: number; totalPips: number; totalLots: number };
  start: () => void;
  stop: () => void;
  clearLogs: () => void;
}

export function useForexSimulation(options?: { maxLogs?: number }): UseForexSimulationResult {
  const maxLogs = options?.maxLogs ?? 500;
  const [logs, setLogs] = useState<ForexLogEntry[]>([]);
  const [poolTxs, setPoolTxs] = useState<ForexPoolTransaction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ totalPnl: 0, totalTrades: 0, totalPips: 0, totalLots: 0 });
  const engineRef = useRef<any>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      try {
        const { forexSimulationEngine } = require('../services/forex/ForexSimulationEngine');
        engineRef.current = forexSimulationEngine;
      } catch { /* not available */ }
    }
    return engineRef.current;
  }, []);

  const start = useCallback(() => {
    const engine = getEngine();
    if (!engine) return;
    if (!engine.isRunning()) engine.start();
    setIsRunning(true);
  }, [getEngine]);

  const stop = useCallback(() => {
    const engine = getEngine();
    if (engine) engine.stop();
    setIsRunning(false);
  }, [getEngine]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setPoolTxs([]);
  }, []);

  useEffect(() => {
    const engine = getEngine();
    if (!engine) return;

    const unsubLog = engine.onLog((entry: ForexLogEntry) => {
      setLogs(prev => {
        const next = [...prev, entry];
        return next.length > maxLogs ? next.slice(-maxLogs) : next;
      });
      const s = engine.getStats();
      setStats({ totalPnl: s.totalPnl, totalTrades: s.totalTrades, totalPips: s.totalPips, totalLots: s.totalLots });
    });

    const unsubTx = engine.onPoolTransaction((tx: ForexPoolTransaction) => {
      setPoolTxs(prev => [...prev.slice(-999), tx]);
    });

    return () => {
      unsubLog();
      unsubTx();
    };
  }, [getEngine, maxLogs]);

  return { logs, poolTransactions: poolTxs, isRunning, stats, start, stop, clearLogs };
}

// ── useForexPoolData ─────────────────────────────────────────────────────────

export interface UseForexPoolDataResult {
  snapshots: Record<ForexPoolType, ForexPoolDailySnapshot[]>;
  transactions: ForexPoolTransaction[];
  isInitialized: boolean;
  initialize: () => void;
}

export function useForexPoolData(): UseForexPoolDataResult {
  const [snapshots, setSnapshots] = useState<Record<ForexPoolType, ForexPoolDailySnapshot[]>>({ clearing: [], hedging: [], insurance: [] });
  const [transactions, setTransactions] = useState<ForexPoolTransaction[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(() => {
    if (isInitialized) return;
    try {
      const { ForexPoolDataGenerator } = require('../services/forex/ForexPoolDataGenerator');
      const gen = ForexPoolDataGenerator.getInstance();
      setSnapshots(gen.generateAllSnapshots());
      setTransactions(gen.generateAllTransactions());
      setIsInitialized(true);
    } catch { /* not available */ }
  }, [isInitialized]);

  return { snapshots, transactions, isInitialized, initialize };
}

// ── Combined useForexTrading ─────────────────────────────────────────────────

export interface UseForexTradingResult {
  pools: UseForexPoolsResult;
  investments: UseForexInvestmentsResult;
  simulation: UseForexSimulationResult;
  poolData: UseForexPoolDataResult;
  // Convenience re-exports
  capitalSplit: typeof FOREX_CAPITAL_SPLIT;
  agent: typeof FOREX_AGENT;
  currencyPairs: typeof import('../types/forex').FOREX_CURRENCY_PAIRS;
  cycleOptions: typeof import('../types/forex').FOREX_CYCLE_OPTIONS;
  computePoolAllocations: typeof computePoolAllocations;
  estimateProfit: typeof estimateForexProfit;
}

export function useForexTrading(options?: {
  poolRefreshInterval?: number;
  investmentRefreshInterval?: number;
}): UseForexTradingResult {
  const pools = useForexPools({ refreshInterval: options?.poolRefreshInterval });
  const investments = useForexInvestments({ refreshInterval: options?.investmentRefreshInterval });
  const simulation = useForexSimulation();
  const poolData = useForexPoolData();

  return {
    pools,
    investments,
    simulation,
    poolData,
    capitalSplit: FOREX_CAPITAL_SPLIT,
    agent: FOREX_AGENT,
    currencyPairs: require('../types/forex').FOREX_CURRENCY_PAIRS,
    cycleOptions: require('../types/forex').FOREX_CYCLE_OPTIONS,
    computePoolAllocations,
    estimateProfit: estimateForexProfit,
  };
}

// ── Internal Helpers ─────────────────────────────────────────────────────────

function mapInvestment(raw: any): ForexInvestment {
  const cycleDays = raw.cycleDays ?? raw.cycle_days ?? 90;
  const cycleOption = FOREX_CYCLE_OPTIONS.find(c => c.days === cycleDays) || FOREX_CYCLE_OPTIONS[2];
  const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : (raw.amount ?? 0);
  const allocs = computePoolAllocations(amount);

  return {
    id: raw.id,
    userId: raw.userId ?? raw.user_id,
    amount,
    currentValue: raw.currentValue ?? raw.current_value ?? amount,
    profit: raw.profit ?? 0,
    status: raw.status ?? 'active',
    selectedPairs: raw.selectedPairs ?? raw.selected_pairs ?? [],
    cycleDays,
    cycleOption,
    feeRate: raw.feeRate ?? cycleOption.feeRate,
    commissionRate: raw.commissionRate ?? cycleOption.commissionRate,
    startDate: raw.startDate ?? raw.start_date ?? new Date().toISOString(),
    endDate: raw.endDate ?? raw.end_date ?? '',
    tradingCapital: raw.tradingCapital ?? allocs.tradingCapital,
    totalPoolReserves: raw.totalPoolReserves ?? allocs.totalPoolReserves,
    poolAllocations: raw.poolAllocations ?? {
      clearing: allocs.clearing,
      hedging: allocs.hedging,
      insurance: allocs.insurance,
    },
    tradeWeight: raw.tradeWeight ?? 0,
    totalLots: raw.totalLots ?? 0,
    totalPips: raw.totalPips ?? 0,
    totalTrades: raw.totalTrades ?? 0,
    positions: raw.positions ?? [],
    tradeHistory: raw.tradeHistory ?? [],
    redeemedAt: raw.redeemedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function createLocalInvestment(params: { amount: number; selectedPairs: string[]; cycleDays: number }): ForexInvestment {
  const { amount, selectedPairs, cycleDays } = params;
  const cycleOption = FOREX_CYCLE_OPTIONS.find(c => c.days === cycleDays) || FOREX_CYCLE_OPTIONS[2];
  const allocs = computePoolAllocations(amount);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + cycleDays);

  return {
    id: `fx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount,
    currentValue: amount,
    profit: 0,
    status: 'active',
    selectedPairs,
    cycleDays,
    cycleOption,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    tradingCapital: allocs.tradingCapital,
    totalPoolReserves: allocs.totalPoolReserves,
    poolAllocations: { clearing: allocs.clearing, hedging: allocs.hedging, insurance: allocs.insurance },
    tradeWeight: 0,
    totalLots: 0,
    totalPips: 0,
    totalTrades: 0,
    positions: [],
    tradeHistory: [],
  };
}
