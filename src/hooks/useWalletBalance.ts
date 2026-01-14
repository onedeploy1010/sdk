import { useState, useEffect, useCallback, useRef } from 'react';
import { createOneEngineClient, type EngineWalletBalance } from '../services/engine';
import type { Token } from '../types';

interface UseWalletBalanceOptions {
  chains?: number[];
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  engineUrl?: string;
  clientId?: string;
}

interface UseWalletBalanceReturn {
  balance: EngineWalletBalance | null;
  tokens: Token[];
  totalUsd: number;
  change24h: number;
  changePercent24h: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching wallet balance via ONE Engine
 *
 * Note: If using OneProvider, prefer useOneWallet() instead for better integration.
 * This hook is for standalone usage outside of OneProvider.
 */
export function useWalletBalance(
  walletAddress: string | null,
  options: UseWalletBalanceOptions = {}
): UseWalletBalanceReturn {
  const {
    chains,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    engineUrl,
    clientId,
  } = options;

  const [balance, setBalance] = useState<EngineWalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create engine client once
  const engineRef = useRef(createOneEngineClient({
    baseUrl: engineUrl,
    clientId: clientId,
  }));

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await engineRef.current.getWalletBalance(walletAddress, chains);
      if (result.success && result.data) {
        setBalance(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch balance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, chains]);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !walletAddress) return;

    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBalance, walletAddress]);

  return {
    balance,
    tokens: balance?.tokens || [],
    totalUsd: balance?.totalUsd || 0,
    change24h: balance?.change24h || 0,
    changePercent24h: balance?.changePercent24h || 0,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
