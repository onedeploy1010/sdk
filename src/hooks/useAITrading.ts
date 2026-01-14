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
