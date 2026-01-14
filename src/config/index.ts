/**
 * ONE SDK Configuration
 *
 * Chain data is fetched from ONE Engine API - no duplicates needed here.
 * Engine is the single source of truth for 200+ EVM chains.
 */

import type { ChainConfig } from '../types';

// ===== SDK Configuration =====
export interface OneConfig {
  // ONE Engine (required)
  oneEngineUrl: string;
  oneClientId: string;
  oneSecretKey?: string; // Only for backend usage

  // Optional: Direct Supabase access (for realtime subscriptions)
  supabaseUrl?: string;
  supabaseAnonKey?: string;

  // Deprecated: Use ONE Engine instead
  thirdwebClientId?: string;
}

// Default configuration values
const DEFAULT_ENGINE_URL = 'https://api.one23.io';
const DEFAULT_CLIENT_ID = 'one_pk_e8f647bfa643fdcfaa3a23f760488e49be09f929296eed4a6c399d437d907f60';

let config: OneConfig | null = null;

export function initOneSDK(options: Partial<OneConfig>): void {
  // Use defaults if not provided
  const engineUrl = options.oneEngineUrl || DEFAULT_ENGINE_URL;
  const clientId = options.oneClientId || DEFAULT_CLIENT_ID;

  config = {
    ...options,
    oneEngineUrl: engineUrl,
    oneClientId: clientId,
  } as OneConfig;
}

export function getConfig(): OneConfig {
  if (!config) {
    throw new Error('ONE SDK not initialized. Call initOneSDK() first.');
  }
  return config;
}

export function isInitialized(): boolean {
  return config !== null;
}

export function getEngineUrl(): string {
  return config?.oneEngineUrl || process.env.NEXT_PUBLIC_ONE_ENGINE_URL || DEFAULT_ENGINE_URL;
}

// ===== Chain Data (Fetched from Engine) =====

// Cache for chain data
let chainsCache: ChainConfig[] | null = null;
let chainsCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch chains from ONE Engine API
 * Engine is the source of truth for 200+ EVM chains
 */
export async function fetchChains(options?: {
  category?: 'mainnet' | 'l2' | 'testnet' | 'gaming' | 'recommended';
  smartWallet?: boolean;
  limit?: number;
}): Promise<ChainConfig[]> {
  const engineUrl = getEngineUrl();
  const params = new URLSearchParams();

  if (options?.category) params.set('category', options.category);
  if (options?.smartWallet) params.set('smartWallet', 'true');
  if (options?.limit) params.set('limit', options.limit.toString());

  const response = await fetch(`${engineUrl}/v1/chains?${params}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch chains');
  }

  // Transform Engine response to SDK ChainConfig format
  return data.data.chains.map((chain: any) => ({
    id: chain.id,
    name: chain.name,
    shortName: chain.shortName || chain.slug || chain.name.toLowerCase(),
    icon: getChainIcon(chain.id),
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: Array.isArray(chain.rpc) ? chain.rpc : [chain.rpc],
    blockExplorerUrls: chain.blockExplorer ? [chain.blockExplorer] : [],
    testnet: chain.testnet,
  }));
}

/**
 * Get all supported chains (cached)
 */
export async function getChains(): Promise<ChainConfig[]> {
  const now = Date.now();
  if (chainsCache && (now - chainsCacheTimestamp) < CACHE_TTL) {
    return chainsCache;
  }

  chainsCache = await fetchChains({ limit: 200 });
  chainsCacheTimestamp = now;
  return chainsCache;
}

/**
 * Get chain by ID
 */
export async function getChainById(chainId: number): Promise<ChainConfig | undefined> {
  const chains = await getChains();
  return chains.find(c => c.id === chainId);
}

/**
 * Get chain by name/shortName
 */
export async function getChainByName(name: string): Promise<ChainConfig | undefined> {
  const chains = await getChains();
  const lowerName = name.toLowerCase();
  return chains.find(
    c => c.name.toLowerCase() === lowerName || c.shortName.toLowerCase() === lowerName
  );
}

/**
 * Get recommended chains for UI display
 */
export async function getRecommendedChains(): Promise<ChainConfig[]> {
  return fetchChains({ category: 'recommended', limit: 10 });
}

/**
 * Get chains with smart wallet support
 */
export async function getSmartWalletChains(): Promise<ChainConfig[]> {
  return fetchChains({ smartWallet: true, limit: 50 });
}

// ===== Default Chain Constants =====
// These are commonly used chain IDs, but full data should be fetched from Engine

export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  AVALANCHE: 43114,
  ZKSYNC: 324,
  LINEA: 59144,
  SCROLL: 534352,
  BLAST: 81457,
  // Testnets
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export const DEFAULT_CHAIN_ID = CHAIN_IDS.BASE;

// ===== Chain Icons (Simple emoji fallback) =====
const CHAIN_ICONS: Record<number, string> = {
  1: '\u229F', // Ethereum
  137: '\uD83D\uDFE3', // Polygon
  56: '\uD83D\uDFE1', // BSC
  42161: '\uD83D\uDD35', // Arbitrum
  10: '\uD83D\uDD34', // Optimism
  8453: '\uD83D\uDD37', // Base
  43114: '\uD83D\uDD3A', // Avalanche
  324: '\u26A1', // zkSync
  59144: '\uD83D\uDD39', // Linea
  534352: '\uD83D\uDCDC', // Scroll
};

function getChainIcon(chainId: number): string {
  return CHAIN_ICONS[chainId] || '\uD83D\uDD17';
}

// ===== Token Names Mapping =====
// Common token symbols to human-readable names
export const TOKEN_NAMES: Record<string, string> = {
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  BNB: 'BNB',
  MATIC: 'Polygon',
  POL: 'Polygon',
  AVAX: 'Avalanche',
  USDT: 'Tether',
  USDC: 'USD Coin',
  DAI: 'Dai',
  WBTC: 'Wrapped Bitcoin',
  WETH: 'Wrapped Ether',
  ARB: 'Arbitrum',
  OP: 'Optimism',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
  AAVE: 'Aave',
  CRV: 'Curve',
  MKR: 'Maker',
  SNX: 'Synthetix',
  COMP: 'Compound',
  SUSHI: 'SushiSwap',
  YFI: 'Yearn Finance',
  SOL: 'Solana',
  DOT: 'Polkadot',
  ATOM: 'Cosmos',
  NEAR: 'Near Protocol',
};

// ===== CoinGecko ID Mapping =====
// For price lookups via CoinGecko API
export const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  POL: 'matic-network',
  AVAX: 'avalanche-2',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  WETH: 'weth',
  ARB: 'arbitrum',
  OP: 'optimism',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  SOL: 'solana',
};

// ===== Backwards Compatibility =====
// @deprecated - Use getChains() or fetch from Engine API
// These static configs are kept for backwards compatibility only

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    icon: '\u229F',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum.rpc.thirdweb.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    testnet: false,
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    icon: '\uD83D\uDFE3',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: ['https://polygon.rpc.thirdweb.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    testnet: false,
  },
  base: {
    id: 8453,
    name: 'Base',
    shortName: 'BASE',
    icon: '\uD83D\uDD37',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://base.rpc.thirdweb.com'],
    blockExplorerUrls: ['https://basescan.org'],
    testnet: false,
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'ARB',
    icon: '\uD83D\uDD35',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arbitrum.rpc.thirdweb.com'],
    blockExplorerUrls: ['https://arbiscan.io'],
    testnet: false,
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    icon: '\uD83D\uDD34',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://optimism.rpc.thirdweb.com'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    testnet: false,
  },
};

// @deprecated - Use getChains() to get all supported chains
export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS);

// @deprecated - Use getChainByName() instead
export function getChainConfig(chain: string): ChainConfig | undefined {
  return CHAIN_CONFIGS[chain.toLowerCase()];
}
