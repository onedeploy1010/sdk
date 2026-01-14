'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { initOneSDK, type OneConfig } from '../config';
import {
  OneEngineClient,
  createOneEngineClient,
  type EngineAuthResponse,
  type EngineWalletBalance,
  type OnrampSession,
  type OnrampSessionRequest,
  type SwapQuote,
  type SwapQuoteRequest,
} from '../services/engine';
import type { User, Token, AIStrategy, AIOrder } from '../types';

// ===== Context Types =====

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface WalletContextValue {
  address: string | null;
  balance: EngineWalletBalance | null;
  tokens: Token[];
  totalUsd: number;
  isLoading: boolean;
  error: string | null;
  setAddress: (address: string | null) => void;
  fetchBalance: (chains?: number[]) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

interface OnrampContextValue {
  isOpen: boolean;
  widgetUrl: string | null;
  sessionId: string | null;
  openOnramp: (options?: Partial<OnrampSessionRequest>) => Promise<void>;
  closeOnramp: () => void;
  getQuote: (fiatCurrency: string, fiatAmount: number, cryptoCurrency: string) => Promise<any>;
}

interface SwapContextValue {
  getQuote: (request: SwapQuoteRequest) => Promise<SwapQuote | null>;
  executeSwap: (quoteId: string) => Promise<any>;
  getSupportedTokens: (chainId?: number) => Promise<Token[]>;
  getSupportedChains: () => Promise<{ id: number; name: string }[]>;
}

interface TradingContextValue {
  strategies: AIStrategy[];
  orders: AIOrder[];
  portfolioStats: {
    totalInvested: number;
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    activePositions: number;
  } | null;
  isLoading: boolean;
  fetchStrategies: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  createOrder: (strategyId: string, amount: number, currency: string) => Promise<any>;
}

interface OneContextValue {
  isInitialized: boolean;
  config: OneConfig | null;
  engine: OneEngineClient;
  auth: AuthContextValue;
  wallet: WalletContextValue;
  onramp: OnrampContextValue;
  swap: SwapContextValue;
  trading: TradingContextValue;
}

const OneContext = createContext<OneContextValue | null>(null);

// ===== Provider Props =====
interface OneProviderProps {
  children: ReactNode;
  config: OneConfig;
  autoFetchBalance?: boolean;
}

// ===== Provider Component =====
export function OneProvider({
  children,
  config,
  autoFetchBalance = true,
}: OneProviderProps) {
  // Initialize SDK synchronously before creating engine client
  // This must happen before useMemo so getConfig() works in the constructor
  useMemo(() => {
    initOneSDK(config);
  }, [config]);

  const [isInitialized, setIsInitialized] = useState(true);
  const engine = useMemo(() => createOneEngineClient({
    baseUrl: config.oneEngineUrl,
    clientId: config.oneClientId,
    secretKey: config.oneSecretKey,
  }), [config]);

  // ===== Auth State =====
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const sendOtp = useCallback(async (email: string) => {
    const result = await engine.sendEmailOtp(email);
    if (!result.success) {
      return { success: false, error: result.error?.message };
    }
    return { success: true };
  }, [engine]);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const result = await engine.verifyEmailOtp(email, otp);
    if (!result.success || !result.data) {
      return { success: false, error: result.error?.message };
    }

    const { user: authUser, accessToken: token } = result.data;
    setUser(authUser);
    setAccessToken(token);
    engine.setAccessToken(token);

    return { success: true };
  }, [engine]);

  const signOut = useCallback(async () => {
    await engine.signOut();
    setUser(null);
    setAccessToken(null);
    engine.clearAccessToken();
  }, [engine]);

  const refreshUser = useCallback(async () => {
    try {
      if (accessToken) {
        engine.setAccessToken(accessToken);
        const result = await engine.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }, [engine, accessToken]);

  useEffect(() => {
    refreshUser();
  }, []);

  // ===== Wallet State =====
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<EngineWalletBalance | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (chains?: number[]) => {
    if (!walletAddress) return;

    setWalletLoading(true);
    setWalletError(null);

    try {
      const result = await engine.getWalletBalance(walletAddress, chains);
      if (result.success && result.data) {
        setWalletBalance(result.data);
      } else {
        setWalletError(result.error?.message || 'Failed to fetch balance');
      }
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Failed to fetch balance');
    } finally {
      setWalletLoading(false);
    }
  }, [walletAddress, engine]);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (autoFetchBalance && walletAddress && isInitialized) {
      fetchBalance();
    }
  }, [walletAddress, autoFetchBalance, isInitialized, fetchBalance]);

  // ===== Onramp State =====
  const [onrampOpen, setOnrampOpen] = useState(false);
  const [onrampUrl, setOnrampUrl] = useState<string | null>(null);
  const [onrampSessionId, setOnrampSessionId] = useState<string | null>(null);

  const openOnramp = useCallback(async (options?: Partial<OnrampSessionRequest>) => {
    if (!walletAddress) return;

    const result = await engine.createOnrampSession({
      walletAddress,
      fiatCurrency: 'USD',
      cryptoCurrency: 'ETH',
      ...options,
    });

    if (result.success && result.data) {
      setOnrampUrl(result.data.widgetUrl);
      setOnrampSessionId(result.data.sessionId);
      setOnrampOpen(true);
    }
  }, [walletAddress, engine]);

  const closeOnramp = useCallback(() => {
    setOnrampOpen(false);
    setOnrampUrl(null);
  }, []);

  const getOnrampQuote = useCallback(async (
    fiatCurrency: string,
    fiatAmount: number,
    cryptoCurrency: string
  ) => {
    const result = await engine.getOnrampQuote(fiatCurrency, fiatAmount, cryptoCurrency);
    return result.success ? result.data : null;
  }, [engine]);

  // ===== Swap =====
  const getSwapQuote = useCallback(async (request: SwapQuoteRequest) => {
    const result = await engine.getSwapQuote(request);
    return result.success ? result.data || null : null;
  }, [engine]);

  const executeSwap = useCallback(async (quoteId: string) => {
    if (!walletAddress) return null;
    const result = await engine.executeSwap({ quoteId, walletAddress });
    return result.success ? result.data : null;
  }, [engine, walletAddress]);

  const getSupportedTokens = useCallback(async (chainId?: number) => {
    const result = await engine.getSupportedSwapTokens(chainId);
    return result.success && result.data ? result.data.tokens : [];
  }, [engine]);

  const getSupportedChains = useCallback(async () => {
    const result = await engine.getSupportedSwapChains();
    return result.success && result.data ? result.data.chains : [];
  }, [engine]);

  // ===== Trading State =====
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [orders, setOrders] = useState<AIOrder[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<TradingContextValue['portfolioStats']>(null);
  const [tradingLoading, setTradingLoading] = useState(false);

  const fetchStrategies = useCallback(async () => {
    setTradingLoading(true);
    try {
      const result = await engine.getStrategies();
      if (result.success && result.data) {
        setStrategies(result.data);
      }
    } finally {
      setTradingLoading(false);
    }
  }, [engine]);

  const fetchOrders = useCallback(async () => {
    const result = await engine.getUserOrders();
    if (result.success && result.data) {
      setOrders(result.data);
    }
  }, [engine]);

  const fetchPortfolio = useCallback(async () => {
    const result = await engine.getPortfolioStats();
    if (result.success && result.data) {
      setPortfolioStats(result.data);
    }
  }, [engine]);

  const createOrder = useCallback(async (
    strategyId: string,
    amount: number,
    currency: string
  ) => {
    const result = await engine.createOrder(strategyId, amount, currency);
    if (result.success) {
      await fetchOrders();
      await fetchPortfolio();
    }
    return result;
  }, [engine, fetchOrders, fetchPortfolio]);

  // ===== Context Value =====
  const contextValue: OneContextValue = useMemo(() => ({
    isInitialized,
    config: isInitialized ? config : null,
    engine,

    auth: {
      user,
      isAuthenticated: !!user,
      isLoading: authLoading,
      accessToken,
      sendOtp,
      verifyOtp,
      signOut,
      refreshUser,
    },

    wallet: {
      address: walletAddress,
      balance: walletBalance,
      tokens: walletBalance?.tokens || [],
      totalUsd: walletBalance?.totalUsd || 0,
      isLoading: walletLoading,
      error: walletError,
      setAddress: setWalletAddress,
      fetchBalance,
      refreshBalance,
    },

    onramp: {
      isOpen: onrampOpen,
      widgetUrl: onrampUrl,
      sessionId: onrampSessionId,
      openOnramp,
      closeOnramp,
      getQuote: getOnrampQuote,
    },

    swap: {
      getQuote: getSwapQuote,
      executeSwap,
      getSupportedTokens,
      getSupportedChains,
    },

    trading: {
      strategies,
      orders,
      portfolioStats,
      isLoading: tradingLoading,
      fetchStrategies,
      fetchOrders,
      fetchPortfolio,
      createOrder,
    },
  }), [
    isInitialized,
    config,
    engine,
    user,
    authLoading,
    accessToken,
    sendOtp,
    verifyOtp,
    signOut,
    refreshUser,
    walletAddress,
    walletBalance,
    walletLoading,
    walletError,
    fetchBalance,
    refreshBalance,
    onrampOpen,
    onrampUrl,
    onrampSessionId,
    openOnramp,
    closeOnramp,
    getOnrampQuote,
    getSwapQuote,
    executeSwap,
    getSupportedTokens,
    getSupportedChains,
    strategies,
    orders,
    portfolioStats,
    tradingLoading,
    fetchStrategies,
    fetchOrders,
    fetchPortfolio,
    createOrder,
  ]);

  return (
    <OneContext.Provider value={contextValue}>
      {children}
    </OneContext.Provider>
  );
}

// ===== Hooks =====
export function useOne(): OneContextValue {
  const context = useContext(OneContext);
  if (!context) {
    throw new Error('useOne must be used within a OneProvider');
  }
  return context;
}

export function useOneAuth() {
  const { auth } = useOne();
  return auth;
}

export function useOneWallet() {
  const { wallet } = useOne();
  return wallet;
}

export function useOneOnramp() {
  const { onramp } = useOne();
  return onramp;
}

export function useOneSwap() {
  const { swap } = useOne();
  return swap;
}

export function useOneTrading() {
  const { trading } = useOne();
  return trading;
}

export function useOneEngine() {
  const { engine } = useOne();
  return engine;
}

// Export context for advanced usage
export { OneContext };
