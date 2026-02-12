/**
 * AI Trading Hooks for ONE SDK
 *
 * React hooks for AI quantitative trading features.
 * These hooks provide easy access to AI strategies, orders, and portfolio management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createOneEngineClient, OneEngineClient } from '../services/engine';
import type {
  AIStrategy,
  AIOrder,
  AIOrderStatus,
  AIPortfolioSummary,
  AITradeAllocation,
  AINavSnapshot,
  AIMarketData,
  CreateAIOrderRequest,
  StrategyCategory,
  ApiResponse,
} from '../types';

// Singleton client instance
let clientInstance: OneEngineClient | null = null;

function getClient(): OneEngineClient {
  if (!clientInstance) {
    clientInstance = createOneEngineClient();
  }
  return clientInstance;
}

/**
 * Set the access token for authenticated requests
 */
export function setAITradingAccessToken(token: string) {
  getClient().setAccessToken(token);
}

/**
 * Clear the access token
 */
export function clearAITradingAccessToken() {
  getClient().clearAccessToken();
}

// ============================================
// AI Strategies Hooks
// ============================================

export interface UseAIStrategiesOptions {
  category?: StrategyCategory;
  riskLevel?: number;
  minTvl?: number;
  isActive?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAIStrategiesResult {
  strategies: AIStrategy[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage AI trading strategies
 */
export function useAIStrategies(options: UseAIStrategiesOptions = {}): UseAIStrategiesResult {
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { category, riskLevel, minTvl, isActive, autoRefresh = false, refreshInterval = 60000 } = options;

  const fetchStrategies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAIStrategies({ category, riskLevel, minTvl, isActive });
      if (result.success && result.data?.strategies) {
        setStrategies(result.data.strategies);
      } else {
        setError(result.error?.message || 'Failed to fetch strategies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [category, riskLevel, minTvl, isActive]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStrategies, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStrategies]);

  return { strategies, isLoading, error, refresh: fetchStrategies };
}

/**
 * Hook to fetch a single AI strategy with performance data
 */
export interface UseAIStrategyResult {
  strategy: AIStrategy | null;
  performance: AINavSnapshot[];
  marketData: AIMarketData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAIStrategy(
  strategyId: string | undefined,
  include: ('performance' | 'market' | 'trades')[] = ['performance', 'market']
): UseAIStrategyResult {
  const [strategy, setStrategy] = useState<AIStrategy | null>(null);
  const [performance, setPerformance] = useState<AINavSnapshot[]>([]);
  const [marketData, setMarketData] = useState<AIMarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategy = useCallback(async () => {
    if (!strategyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAIStrategy(strategyId, include);
      if (result.success && result.data) {
        setStrategy(result.data.strategy);
        setPerformance(result.data.performance || []);
        setMarketData(result.data.marketData || []);
      } else {
        setError(result.error?.message || 'Failed to fetch strategy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [strategyId, include.join(',')]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  return { strategy, performance, marketData, isLoading, error, refresh: fetchStrategy };
}

// ============================================
// AI Orders Hooks
// ============================================

export interface UseAIOrdersOptions {
  strategyId?: string;
  status?: AIOrderStatus;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAIOrdersResult {
  orders: AIOrder[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createOrder: (request: CreateAIOrderRequest) => Promise<ApiResponse<{ order: AIOrder }>>;
  pauseOrder: (orderId: string) => Promise<ApiResponse<{ order: AIOrder; message: string }>>;
  resumeOrder: (orderId: string) => Promise<ApiResponse<{ order: AIOrder; message: string }>>;
  redeemOrder: (orderId: string) => Promise<ApiResponse<any>>;
}

/**
 * Hook to manage AI trading orders
 */
export function useAIOrders(options: UseAIOrdersOptions = {}): UseAIOrdersResult {
  const [orders, setOrders] = useState<AIOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { strategyId, status, autoRefresh = true, refreshInterval = 30000 } = options;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAIOrders({ strategyId, status });
      if (result.success && result.data?.orders) {
        setOrders(result.data.orders);
      } else {
        setError(result.error?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [strategyId, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchOrders]);

  const createOrder = useCallback(async (request: CreateAIOrderRequest) => {
    const result = await getClient().createAIOrder(request);
    if (result.success) {
      await fetchOrders(); // Refresh orders list
    }
    return result;
  }, [fetchOrders]);

  const pauseOrder = useCallback(async (orderId: string) => {
    const result = await getClient().pauseAIOrder(orderId);
    if (result.success) {
      await fetchOrders();
    }
    return result;
  }, [fetchOrders]);

  const resumeOrder = useCallback(async (orderId: string) => {
    const result = await getClient().resumeAIOrder(orderId);
    if (result.success) {
      await fetchOrders();
    }
    return result;
  }, [fetchOrders]);

  const redeemOrder = useCallback(async (orderId: string) => {
    const result = await getClient().redeemAIOrder(orderId);
    if (result.success) {
      await fetchOrders();
    }
    return result;
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refresh: fetchOrders,
    createOrder,
    pauseOrder,
    resumeOrder,
    redeemOrder,
  };
}

// ============================================
// AI Portfolio Hooks
// ============================================

export interface UseAIPortfolioResult {
  portfolio: AIPortfolioSummary | null;
  allocations: AITradeAllocation[];
  activeOrders: AIOrder[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch AI trading portfolio summary
 */
export function useAIPortfolio(autoRefresh = true): UseAIPortfolioResult {
  const [portfolio, setPortfolio] = useState<AIPortfolioSummary | null>(null);
  const [allocations, setAllocations] = useState<AITradeAllocation[]>([]);
  const [activeOrders, setActiveOrders] = useState<AIOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAIPortfolio(['allocations', 'orders']);
      if (result.success && result.data) {
        setPortfolio(result.data.portfolio);
        setAllocations(result.data.allocations || []);
        setActiveOrders(result.data.orders || []);
      } else {
        setError(result.error?.message || 'Failed to fetch portfolio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchPortfolio, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchPortfolio]);

  return { portfolio, allocations, activeOrders, isLoading, error, refresh: fetchPortfolio };
}

// ============================================
// AI Market Data Hook
// ============================================

export interface UseAIMarketDataResult {
  prices: Record<string, { price: number; change24h: number }>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch real-time market data for AI trading pairs
 */
export function useAIMarketData(
  symbols: string[] = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX'],
  autoRefresh = true
): UseAIMarketDataResult {
  const [prices, setPrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getTokenPrices(symbols);
      if (result.success && result.data) {
        setPrices(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchPrices, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchPrices]);

  return { prices, isLoading, error, refresh: fetchPrices };
}

// ============================================
// Combined AI Trading Hook
// ============================================

export interface UseAITradingResult {
  // Strategies
  strategies: AIStrategy[];
  strategiesLoading: boolean;

  // Orders
  orders: AIOrder[];
  ordersLoading: boolean;

  // Portfolio
  portfolio: AIPortfolioSummary | null;
  portfolioLoading: boolean;

  // Market Data
  prices: Record<string, { price: number; change24h: number }>;

  // Actions
  createOrder: (request: CreateAIOrderRequest) => Promise<ApiResponse<{ order: AIOrder }>>;
  pauseOrder: (orderId: string) => Promise<ApiResponse<{ order: AIOrder; message: string }>>;
  resumeOrder: (orderId: string) => Promise<ApiResponse<{ order: AIOrder; message: string }>>;
  redeemOrder: (orderId: string) => Promise<ApiResponse<any>>;

  // Refresh
  refreshAll: () => Promise<void>;

  // Error
  error: string | null;
}

/**
 * Combined hook for all AI trading functionality
 */
export function useAITrading(): UseAITradingResult {
  const strategiesResult = useAIStrategies({ autoRefresh: true });
  const ordersResult = useAIOrders({ autoRefresh: true });
  const portfolioResult = useAIPortfolio(true);
  const marketResult = useAIMarketData();

  const refreshAll = useCallback(async () => {
    await Promise.all([
      strategiesResult.refresh(),
      ordersResult.refresh(),
      portfolioResult.refresh(),
      marketResult.refresh(),
    ]);
  }, [strategiesResult.refresh, ordersResult.refresh, portfolioResult.refresh, marketResult.refresh]);

  const error = useMemo(() => {
    return strategiesResult.error || ordersResult.error || portfolioResult.error || marketResult.error;
  }, [strategiesResult.error, ordersResult.error, portfolioResult.error, marketResult.error]);

  return {
    strategies: strategiesResult.strategies,
    strategiesLoading: strategiesResult.isLoading,
    orders: ordersResult.orders,
    ordersLoading: ordersResult.isLoading,
    portfolio: portfolioResult.portfolio,
    portfolioLoading: portfolioResult.isLoading,
    prices: marketResult.prices,
    createOrder: ordersResult.createOrder,
    pauseOrder: ordersResult.pauseOrder,
    resumeOrder: ordersResult.resumeOrder,
    redeemOrder: ordersResult.redeemOrder,
    refreshAll,
    error,
  };
}

// ============================================
// AI Agents Hooks
// ============================================

export interface AIAgent {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  category: string;
  risk_level: number;
  icon: string;
  color: string;
  tiers: Array<{ tier: number; amount: number; label: string; label_zh: string }>;
  supported_cycles: number[];
  default_cycle: number;
  supported_pairs: string[];
  supported_chains: string[];
  is_active: boolean;
  preview?: {
    tier: { tier: number; amount: number; label: string };
    cycle: number;
    dailyLots: number;
    stabilityScore: number;
    roiRange: { min: number; max: number; userMin: number; userMax: number };
    shareRate: number;
    profitEstimate: { monthlyMin: number; monthlyMax: number; cycleMin: number; cycleMax: number };
  };
}

export interface AIAgentParams {
  dailyLots: number;
  effectiveCapital: number;
  stabilityScore: number;
  roiRange: { min: number; max: number; userMin: number; userMax: number };
  shareRate: number;
  profitEstimate: { monthlyMin: number; monthlyMax: number; cycleMin: number; cycleMax: number };
}

export interface UseAIAgentsResult {
  agents: AIAgent[];
  shareRates: Record<number, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch all AI agents with their configurations
 */
export function useAIAgents(includeInactive = false): UseAIAgentsResult {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [shareRates, setShareRates] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAgentConfigs({ includeInactive });
      if (result.success && result.data) {
        setAgents(result.data.agents || []);
        setShareRates(result.data.shareRates || {});
      } else {
        setError(result.error?.message || 'Failed to fetch agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, shareRates, isLoading, error, refresh: fetchAgents };
}

export interface UseAIAgentResult {
  agent: AIAgent | null;
  params: AIAgentParams | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  calculateParams: (amount: number, cycleDays: number) => Promise<AIAgentParams | null>;
}

/**
 * Hook to fetch a single AI agent with detailed parameters
 */
export function useAIAgent(agentId: string | undefined): UseAIAgentResult {
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [params, setParams] = useState<AIAgentParams | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!agentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getClient().getAgentConfigs({ agentId });
      if (result.success && result.data?.agent) {
        setAgent(result.data.agent);
      } else {
        setError(result.error?.message || 'Agent not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const calculateParams = useCallback(async (amount: number, cycleDays: number): Promise<AIAgentParams | null> => {
    if (!agentId) return null;

    try {
      const result = await getClient().calculateAgentParams({ agentId, amount, cycleDays });
      if (result.success && result.data) {
        setParams(result.data);
        return result.data;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate params');
      return null;
    }
  }, [agentId]);

  return { agent, params, isLoading, error, refresh: fetchAgent, calculateParams };
}

export interface UseAIAgentSubscriptionResult {
  subscribe: (agentId: string, amount: number, cycleDays: number, txHash?: string) => Promise<ApiResponse<{ order: AIOrder }>>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to subscribe to an AI agent strategy
 */
export function useAIAgentSubscription(): UseAIAgentSubscriptionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (
    agentId: string,
    amount: number,
    cycleDays: number,
    txHash?: string
  ): Promise<ApiResponse<{ order: AIOrder }>> => {
    setIsLoading(true);
    setError(null);
    try {
      // Create order for the agent strategy
      const result = await getClient().createAIOrder({
        strategyId: agentId,
        amount,
        lockPeriodDays: cycleDays,
        txHashDeposit: txHash,
      });
      if (!result.success) {
        setError(result.error?.message || 'Failed to subscribe');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Subscription failed';
      setError(errorMsg);
      return { success: false, error: { code: 'SUBSCRIPTION_ERROR', message: errorMsg } };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { subscribe, isLoading, error };
}
