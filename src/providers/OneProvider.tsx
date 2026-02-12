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
import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { ThirdwebProvider as BaseThirdwebProvider } from 'thirdweb/react';
import { inAppWallet, smartWallet } from 'thirdweb/wallets';
import type { Chain } from 'thirdweb/chains';
import { base, ethereum, polygon, arbitrum, optimism } from 'thirdweb/chains';

import { initOneSDK, type OneConfig } from '../config';
import {
  OneEngineClient,
  createOneEngineClient,
  type EngineWalletBalance,
  type OnrampSessionRequest,
  type SwapQuote,
  type SwapQuoteRequest,
} from '../services/engine';
import type { User, Token, AIStrategy, AIOrder } from '../types';

// ===== Thirdweb Config Types =====

export interface ThirdwebAuthOptions {
  email?: boolean;
  phone?: boolean;
  google?: boolean;
  apple?: boolean;
  facebook?: boolean;
  discord?: boolean;
  passkey?: boolean;
  guest?: boolean;
}

export interface ThirdwebWalletConfig {
  appName?: string;
  appIcon?: string;
  defaultChain?: Chain;
  supportedChains?: Chain[];
  sponsorGas?: boolean;
  authOptions?: ThirdwebAuthOptions;
}

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
  // Address management
  address: string | null;
  setAddress: (address: string | null) => void;
  // Balance from Engine API
  balance: EngineWalletBalance | null;
  tokens: Token[];
  totalUsd: number;
  isLoading: boolean;
  error: string | null;
  fetchBalance: (chains?: number[]) => Promise<void>;
  refreshBalance: () => Promise<void>;
  // Thirdweb client for wallet connection
  thirdwebClient: ThirdwebClient | null;
  isThirdwebReady: boolean;
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
  // Direct thirdweb access
  thirdwebClient: ThirdwebClient | null;
}

const OneContext = createContext<OneContextValue | null>(null);

// ===== Default Thirdweb Configuration =====

const DEFAULT_CHAINS: Chain[] = [base, ethereum, polygon, arbitrum, optimism];

const DEFAULT_AUTH_OPTIONS: ThirdwebAuthOptions = {
  email: true,
  phone: false,
  google: true,
  apple: true,
  facebook: false,
  discord: false,
  passkey: true,
  guest: false,
};

// ===== Create Wallets Configuration =====

function createWalletConfig(config: ThirdwebWalletConfig) {
  const authOptions = { ...DEFAULT_AUTH_OPTIONS, ...config.authOptions };

  // Build auth options array
  const authMethods: string[] = [];
  if (authOptions.google) authMethods.push('google');
  if (authOptions.apple) authMethods.push('apple');
  if (authOptions.facebook) authMethods.push('facebook');
  if (authOptions.discord) authMethods.push('discord');
  if (authOptions.passkey) authMethods.push('passkey');

  // Create in-app wallet with email and social logins
  const inApp = inAppWallet({
    auth: {
      options: authMethods as any[],
    },
    metadata: config.appName ? {
      name: config.appName,
      image: config.appIcon ? { src: config.appIcon, width: 100, height: 100 } : undefined,
    } : undefined,
  });

  // If gas sponsorship is enabled, wrap in smart wallet
  if (config.sponsorGas) {
    const chain = config.defaultChain || base;
    return [
      smartWallet({
        chain,
        sponsorGas: true,
      }),
    ];
  }

  return [inApp];
}

// ===== Provider Props =====
interface OneProviderProps {
  children: ReactNode;
  config: OneConfig;
  thirdweb?: ThirdwebWalletConfig;
  autoFetchBalance?: boolean;
}

// ===== Provider Component =====
export function OneProvider({
  children,
  config,
  thirdweb: thirdwebConfig = {},
  autoFetchBalance = true,
}: OneProviderProps) {
  // Initialize SDK synchronously before creating engine client
  useMemo(() => {
    initOneSDK(config);
  }, [config]);

  const [isInitialized, setIsInitialized] = useState(true);
  const engine = useMemo(() => createOneEngineClient({
    baseUrl: config.oneEngineUrl,
    clientId: config.oneClientId,
    secretKey: config.oneSecretKey,
  }), [config]);

  // ===== Thirdweb State =====
  const [thirdwebClientId, setThirdwebClientId] = useState<string | null>(null);
  const [thirdwebLoading, setThirdwebLoading] = useState(true);
  const [thirdwebError, setThirdwebError] = useState<string | null>(null);

  // Fetch thirdweb clientId from Engine on mount
  useEffect(() => {
    const fetchClientConfig = async () => {
      try {
        const response = await fetch(`${config.oneEngineUrl}/api/v1/config/thirdweb`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.clientId) {
            setThirdwebClientId(data.data.clientId);
          } else {
            // Fallback to environment variable
            const envClientId = typeof window !== 'undefined'
              ? (window as any).__NEXT_PUBLIC_THIRDWEB_CLIENT_ID
              : process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
            if (envClientId) {
              setThirdwebClientId(envClientId);
            } else {
              setThirdwebError('Failed to load wallet configuration');
            }
          }
        } else {
          // Fallback to environment variable
          const envClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
          if (envClientId) {
            setThirdwebClientId(envClientId);
          } else {
            setThirdwebError('Wallet service unavailable');
          }
        }
      } catch (err) {
        // Fallback to environment variable on network error
        const envClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
        if (envClientId) {
          setThirdwebClientId(envClientId);
        } else {
          console.warn('Failed to fetch thirdweb config:', err);
          // Don't set error - thirdweb is optional
        }
      } finally {
        setThirdwebLoading(false);
      }
    };

    fetchClientConfig();
  }, [config.oneEngineUrl]);

  // Create thirdweb client once we have clientId
  const thirdwebClient = useMemo(() => {
    if (!thirdwebClientId) return null;
    return createThirdwebClient({ clientId: thirdwebClientId });
  }, [thirdwebClientId]);

  // Create wallet configuration
  const wallets = useMemo(() => createWalletConfig(thirdwebConfig), [thirdwebConfig]);

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
    thirdwebClient,

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
      thirdwebClient,
      isThirdwebReady: !thirdwebLoading && !!thirdwebClient,
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
    thirdwebClient,
    thirdwebLoading,
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

  // Wrap with ThirdwebProvider if client is available
  const content = (
    <OneContext.Provider value={contextValue}>
      {children}
    </OneContext.Provider>
  );

  // If thirdweb is ready, wrap with ThirdwebProvider
  if (thirdwebClient) {
    return (
      <BaseThirdwebProvider>
        {content}
      </BaseThirdwebProvider>
    );
  }

  return content;
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

export function useThirdwebClient(): ThirdwebClient | null {
  const { thirdwebClient } = useOne();
  return thirdwebClient;
}

// Export context for advanced usage
export { OneContext };

// Export thirdweb utilities for convenience
export { inAppWallet, smartWallet } from 'thirdweb/wallets';
export { base, ethereum, polygon, arbitrum, optimism } from 'thirdweb/chains';
export type { Chain } from 'thirdweb/chains';
export type { ThirdwebClient } from 'thirdweb';
