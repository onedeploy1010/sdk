/**
 * ONE SDK - React Native Entry Point
 *
 * This file exports SDK features optimized for React Native usage.
 * It excludes web-specific features and includes mobile-specific utilities.
 */

// ===== Configuration =====
export { initOneSDK, getConfig, CHAIN_CONFIGS, TOKEN_NAMES, COINGECKO_IDS } from './config';
export type { OneConfig } from './config';

// ===== Types =====
export * from './types';

// ===== ONE Engine Client =====
import { OneEngineClient as _OneEngineClient, createOneEngineClient } from './services/engine';
export { _OneEngineClient as OneEngineClient, createOneEngineClient };

export type {
  EngineAuthResponse,
  EngineWalletBalance,
  EngineTransactionRequest,
  EngineTransactionResponse,
  OnrampSessionRequest,
  OnrampSession,
  OnrampQuote,
  OnrampTransaction,
  SwapQuoteRequest,
  SwapQuote,
  SwapExecuteRequest,
  SwapResult,
} from './services/engine';

// ===== Price Service =====
export { PriceService, priceService } from './services/price';

// ===== Utilities =====
export {
  // Address
  shortenAddress,
  isValidAddress,
  checksumAddress,
  // Numbers
  formatNumber,
  formatUSD,
  formatPercent,
  formatTokenAmount,
  // Date/Time
  formatDate,
  formatDateTime,
  formatRelativeTime,
  // Validation
  isValidEmail,
  isValidPhone,
  // Strings
  capitalize,
  truncate,
  slugify,
  // Async
  sleep,
  retry,
  // Objects
  omit,
  pick,
  // Errors
  OneSDKError,
  isOneSDKError,
} from './utils';

// ===== AI Trading Components =====
// React Native components for AI trading integration
export {
  OneChainSelector,
  CHAIN_CONFIG,
} from './components/ai/OneChainSelector';
export type { OneChainSelectorProps } from './components/ai/OneChainSelector';

export { OneTierSelector } from './components/ai/OneTierSelector';
export type { OneTierSelectorProps, Tier } from './components/ai/OneTierSelector';

export {
  OneCycleSelector,
  DEFAULT_SHARE_RATES,
} from './components/ai/OneCycleSelector';
export type { OneCycleSelectorProps } from './components/ai/OneCycleSelector';

export {
  OnePairSelector,
  PAIR_ICONS,
} from './components/ai/OnePairSelector';
export type { OnePairSelectorProps } from './components/ai/OnePairSelector';

// ===== React Native Specific Utilities =====

/**
 * Storage adapter interface for React Native
 * Implement this with AsyncStorage or other storage solutions
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Create a cached engine client with persistent storage
 */
export function createCachedEngineClient(
  storage: StorageAdapter,
  options?: {
    baseUrl?: string;
    clientId?: string;
    secretKey?: string;
  }
) {
  const client = createOneEngineClient(options);

  // Wrapper with token persistence
  return {
    ...client,

    /**
     * Initialize with stored token
     */
    async initialize(): Promise<boolean> {
      const token = await storage.getItem('one_access_token');
      if (token) {
        client.setAccessToken(token);
        return true;
      }
      return false;
    },

    /**
     * Login and persist token
     */
    async login(email: string, otp: string) {
      const result = await client.verifyEmailOtp(email, otp);
      if (result.success && result.data?.accessToken) {
        await storage.setItem('one_access_token', result.data.accessToken);
        if (result.data.refreshToken) {
          await storage.setItem('one_refresh_token', result.data.refreshToken);
        }
      }
      return result;
    },

    /**
     * Logout and clear stored tokens
     */
    async logout() {
      await client.signOut();
      await storage.removeItem('one_access_token');
      await storage.removeItem('one_refresh_token');
      client.clearAccessToken();
    },

    /**
     * Refresh token from storage
     */
    async refreshFromStorage() {
      const refreshToken = await storage.getItem('one_refresh_token');
      if (refreshToken) {
        const result = await client.refreshToken(refreshToken);
        if (result.success && result.data?.accessToken) {
          await storage.setItem('one_access_token', result.data.accessToken);
          if (result.data.refreshToken) {
            await storage.setItem('one_refresh_token', result.data.refreshToken);
          }
          return true;
        }
      }
      return false;
    },

    // Expose underlying client
    getClient: () => client,
  };
}

/**
 * Deep linking handler for ONE SDK
 */
export interface DeepLinkHandler {
  /**
   * Parse deep link URL
   */
  parse(url: string): {
    type: 'onramp_callback' | 'wallet_connect' | 'payment' | 'unknown';
    params: Record<string, string>;
  };

  /**
   * Generate deep link URL
   */
  generate(type: string, params: Record<string, string>): string;
}

export function createDeepLinkHandler(scheme: string = 'onewallet'): DeepLinkHandler {
  return {
    parse(url: string) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.replace(/^\//, '');
        const params: Record<string, string> = {};

        urlObj.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        let type: 'onramp_callback' | 'wallet_connect' | 'payment' | 'unknown' = 'unknown';

        if (path.includes('onramp') || path.includes('callback')) {
          type = 'onramp_callback';
        } else if (path.includes('wc') || path.includes('walletconnect')) {
          type = 'wallet_connect';
        } else if (path.includes('pay') || path.includes('payment')) {
          type = 'payment';
        }

        return { type, params };
      } catch {
        return { type: 'unknown', params: {} };
      }
    },

    generate(type: string, params: Record<string, string>): string {
      const searchParams = new URLSearchParams(params);
      return `${scheme}://${type}?${searchParams.toString()}`;
    },
  };
}

/**
 * Biometric authentication helper types
 */
export interface BiometricConfig {
  promptMessage: string;
  cancelButtonText?: string;
  fallbackLabel?: string;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * QR Code scanning result types
 */
export interface QRScanResult {
  type: 'address' | 'wallet_connect' | 'payment_request' | 'unknown';
  data: string;
  parsed?: {
    address?: string;
    chainId?: number;
    amount?: string;
    token?: string;
    message?: string;
  };
}

/**
 * Parse QR code data for wallet operations
 */
export function parseQRCode(data: string): QRScanResult {
  // Ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(data)) {
    return {
      type: 'address',
      data,
      parsed: { address: data },
    };
  }

  // EIP-681 payment request (ethereum:0x...?value=...&token=...)
  if (data.startsWith('ethereum:')) {
    const match = data.match(/^ethereum:(0x[a-fA-F0-9]{40})(?:@(\d+))?(?:\?(.*))?$/);
    if (match) {
      const [, address, chainId, queryString] = match;
      const params = new URLSearchParams(queryString || '');
      return {
        type: 'payment_request',
        data,
        parsed: {
          address,
          chainId: chainId ? parseInt(chainId) : undefined,
          amount: params.get('value') || undefined,
          token: params.get('token') || undefined,
          message: params.get('message') || undefined,
        },
      };
    }
  }

  // WalletConnect URI
  if (data.startsWith('wc:')) {
    return {
      type: 'wallet_connect',
      data,
    };
  }

  return { type: 'unknown', data };
}

/**
 * Format crypto amount for display on mobile
 */
export function formatCryptoAmount(
  amount: number | string,
  symbol: string,
  options: {
    maxDecimals?: number;
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { maxDecimals = 6, showSymbol = true, compact = false } = options;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return showSymbol ? `0 ${symbol}` : '0';

  let formatted: string;

  if (compact && num >= 1000000) {
    formatted = (num / 1000000).toFixed(2) + 'M';
  } else if (compact && num >= 1000) {
    formatted = (num / 1000).toFixed(2) + 'K';
  } else if (num < 0.000001 && num > 0) {
    formatted = '<0.000001';
  } else {
    const decimals = num < 1 ? maxDecimals : Math.min(maxDecimals, 4);
    formatted = num.toFixed(decimals).replace(/\.?0+$/, '');
  }

  return showSymbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Generate share content for transactions
 */
export function generateShareContent(params: {
  type: 'receive' | 'payment_request' | 'transaction';
  address?: string;
  amount?: string;
  token?: string;
  txHash?: string;
  chainId?: number;
}): { title: string; message: string; url?: string } {
  const { type, address, amount, token, txHash, chainId } = params;

  switch (type) {
    case 'receive':
      return {
        title: 'My Wallet Address',
        message: `Send ${token || 'crypto'} to my wallet:\n${address}`,
        url: address ? `ethereum:${address}${chainId ? `@${chainId}` : ''}` : undefined,
      };

    case 'payment_request':
      return {
        title: 'Payment Request',
        message: `Please send ${amount} ${token} to:\n${address}`,
        url: `ethereum:${address}${chainId ? `@${chainId}` : ''}?value=${amount}${token ? `&token=${token}` : ''}`,
      };

    case 'transaction':
      return {
        title: 'Transaction Sent',
        message: `Transaction confirmed!\nHash: ${txHash}`,
        url: txHash ? getExplorerUrl(chainId || 1, txHash, 'tx') : undefined,
      };

    default:
      return { title: '', message: '' };
  }
}

/**
 * Get block explorer URL
 */
export function getExplorerUrl(
  chainId: number,
  hash: string,
  type: 'tx' | 'address' | 'token' = 'tx'
): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    8453: 'https://basescan.org',
    56: 'https://bscscan.com',
    43114: 'https://snowtrace.io',
  };

  const baseUrl = explorers[chainId] || explorers[1];
  return `${baseUrl}/${type}/${hash}`;
}
