import { useState, useEffect, useCallback, useRef } from 'react';
import { createOneEngineClient } from '../services/engine';
import type { TokenPrice } from '../types';

interface UseTokenPriceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  engineUrl?: string;
  clientId?: string;
}

interface UseTokenPriceReturn {
  price: TokenPrice | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching token price via ONE Engine
 *
 * Note: If using OneProvider, prefer useOneEngine().getTokenPrices() instead.
 * This hook is for standalone usage outside of OneProvider.
 */
export function useTokenPrice(
  symbol: string,
  options: UseTokenPriceOptions = {}
): UseTokenPriceReturn {
  const { autoRefresh = false, refreshInterval = 30000, engineUrl, clientId } = options;

  const [price, setPrice] = useState<TokenPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef(createOneEngineClient({
    baseUrl: engineUrl,
    clientId: clientId,
  }));

  const fetchPrice = useCallback(async () => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await engineRef.current.getTokenPrices([symbol]);
      if (result.success && result.data && result.data[symbol]) {
        const priceData = result.data[symbol];
        setPrice({
          symbol,
          price: priceData.price,
          change24h: priceData.change24h,
          changePercent24h: priceData.change24h, // Same as change24h for percentage
          marketCap: priceData.marketCap,
          volume24h: 0, // Not provided by engine
          updatedAt: new Date().toISOString(),
        });
      } else {
        setError(result.error?.message || 'Failed to fetch price');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPrice]);

  return {
    price,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}

// Hook for multiple token prices
interface UseTokenPricesReturn {
  prices: Record<string, TokenPrice>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenPrices(
  symbols: string[],
  options: UseTokenPriceOptions = {}
): UseTokenPricesReturn {
  const { autoRefresh = false, refreshInterval = 30000, engineUrl, clientId } = options;

  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef(createOneEngineClient({
    baseUrl: engineUrl,
    clientId: clientId,
  }));

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await engineRef.current.getTokenPrices(symbols);
      if (result.success && result.data) {
        const priceMap: Record<string, TokenPrice> = {};
        for (const sym of symbols) {
          if (result.data[sym]) {
            priceMap[sym] = {
              symbol: sym,
              price: result.data[sym].price,
              change24h: result.data[sym].change24h,
              changePercent24h: result.data[sym].change24h,
              marketCap: result.data[sym].marketCap,
              volume24h: 0,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        setPrices(priceMap);
      } else {
        setError(result.error?.message || 'Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices,
  };
}
