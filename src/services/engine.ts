/**
 * ONE Engine Client - The unified API gateway for all ONE Ecosystem services
 *
 * All wallet operations, onramp, swap, trading go through ONE Engine.
 * Thirdweb/Onramper/etc are internal to ONE Engine and hidden from clients.
 */

import { getConfig } from '../config';
import type {
  ApiResponse,
  User,
  Token,
  WalletBalance,
  Transaction,
  AIStrategy,
  AIOrder,
  AIOrderStatus,
  AITradeExecution,
  AITradeAllocation,
  AINavSnapshot,
  AIPortfolioSummary,
  AIRedemptionResult,
  AIMarketData,
  CreateAIOrderRequest,
  StrategyCategory,
  NFT,
  NFTCollection,
  Contract,
  ContractReadParams,
  ContractWriteParams,
  ContractDeployParams,
  BillProvider,
  BillPayment,
  OfframpQuote,
  OfframpRequest,
  OfframpTransaction,
  StakingPool,
  StakingPosition,
  ReferralInfo,
  Referral,
  UserProfile,
  UserSettings,
  Notification,
  BridgeQuote,
  BridgeTransaction,
  GasEstimate,
  GasPrice,
  WalletImportRequest,
  PortfolioAnalytics,
  LimitOrder,
  TradingCondition,
  Webhook,
  WebhookDelivery,
  CreateWebhookInput,
  UpdateWebhookInput,
  AdminUser,
  AdminProject,
  SystemStats,
  PaginatedResult,
  AdminListOptions,
  SystemLog,
  RateLimitInfo,
} from '../types';

// ===== Auth Types =====
export interface EngineAuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// ===== Wallet Types =====
export interface EngineWalletBalance {
  address: string;
  totalUsd: number;
  change24h: number;
  changePercent24h: number;
  tokens: Token[];
}

export interface EngineTransactionRequest {
  to: string;
  amount: string;
  tokenSymbol: string;
  chainId: number;
  memo?: string;
}

export interface EngineTransactionResponse {
  txId: string;
  status: 'queued' | 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  explorerUrl?: string;
}

// ===== Onramp Types =====
export interface OnrampSessionRequest {
  walletAddress: string;
  fiatCurrency?: string;
  fiatAmount?: number;
  cryptoCurrency?: string;
  cryptoNetwork?: string;
  paymentMethod?: string;
  redirectUrl?: string;
}

export interface OnrampSession {
  sessionId: string;
  widgetUrl: string;
  expiresAt: string;
}

export interface OnrampQuote {
  provider: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  rate: number;
  fees: {
    network: number;
    provider: number;
    total: number;
  };
  paymentMethod: string;
  estimatedTime: string;
}

export interface OnrampTransaction {
  id: string;
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount?: number;
  cryptoCurrency: string;
  walletAddress: string;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== Swap Types =====
export interface SwapQuoteRequest {
  fromToken: string;
  fromAmount: string;
  fromChainId: number;
  toToken: string;
  toChainId: number;
  walletAddress: string;
  slippage?: number;
}

export interface SwapQuote {
  quoteId: string;
  fromToken: string;
  fromAmount: string;
  fromChainId: number;
  toToken: string;
  toAmount: string;
  toChainId: number;
  rate: number;
  priceImpact: number;
  estimatedGas: string;
  estimatedTime: string;
  fees: {
    gas: number;
    protocol: number;
    total: number;
  };
  expiresAt: string;
}

export interface SwapExecuteRequest {
  quoteId: string;
  walletAddress: string;
  signature?: string; // For backend wallets
}

export interface SwapResult {
  swapId: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  txHash?: string;
  fromAmount: string;
  toAmount?: string;
}

// ===== Main Client =====
export class OneEngineClient {
  private baseUrl: string;
  private clientId: string;
  private secretKey?: string;
  private accessToken?: string;

  constructor(options?: {
    baseUrl?: string;
    clientId?: string;
    secretKey?: string;
  }) {
    const config = getConfig();
    this.baseUrl = options?.baseUrl || config.oneEngineUrl;
    this.clientId = options?.clientId || config.oneClientId || '';
    this.secretKey = options?.secretKey || config.oneSecretKey;
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Clear access token
   */
  clearAccessToken() {
    this.accessToken = undefined;
  }

  private getHeaders(includeSecret = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-id': this.clientId,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (includeSecret && this.secretKey) {
      headers['x-secret-key'] = this.secretKey;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeSecret = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(includeSecret),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || `HTTP_${response.status}`,
            message: data.error?.message || 'Request failed',
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // ===============================
  // AUTH ENDPOINTS
  // ===============================

  /**
   * Send OTP to email for authentication
   */
  async sendEmailOtp(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/v1/auth/otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Verify OTP and get access token
   */
  async verifyEmailOtp(email: string, otp: string): Promise<ApiResponse<EngineAuthResponse>> {
    return this.request('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  /**
   * Authenticate with wallet signature
   */
  async authWithWallet(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<ApiResponse<EngineAuthResponse>> {
    return this.request('/api/v1/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<EngineAuthResponse>> {
    return this.request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/api/v1/auth/me', { method: 'GET' });
  }

  /**
   * Sign out
   */
  async signOut(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/api/v1/auth/logout', { method: 'POST' });
  }

  // ===============================
  // WALLET/ASSETS ENDPOINTS
  // ===============================

  /**
   * Get wallet balance across all chains
   */
  async getWalletBalance(
    walletAddress: string,
    chains?: number[]
  ): Promise<ApiResponse<EngineWalletBalance>> {
    const params = new URLSearchParams({ address: walletAddress });
    if (chains?.length && chains.length > 0) {
      params.set('chainId', chains[0].toString()); // Engine expects single chainId
    }
    return this.request(`/api/v1/assets?${params}`, { method: 'GET' });
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(
    walletAddress: string
  ): Promise<ApiResponse<{ totalValue: number; change24h: number; tokens: Token[] }>> {
    const params = new URLSearchParams({ address: walletAddress });
    return this.request(`/api/v1/assets/portfolio?${params}`, { method: 'GET' });
  }

  /**
   * Get user's wallets
   */
  async getUserWallets(
    chainId?: number
  ): Promise<ApiResponse<{ wallets: any[]; total: number }>> {
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.request(`/api/v1/wallet${params}`, { method: 'GET' });
  }

  /**
   * Create a new wallet
   */
  async createWallet(
    chainId: number = 8453,
    type: 'smart' | 'eoa' | 'multisig' = 'smart'
  ): Promise<ApiResponse<{ wallet: any; smartAccountAddress: string; personalAddress: string }>> {
    return this.request('/api/v1/wallet', {
      method: 'POST',
      body: JSON.stringify({ chainId, type }),
    });
  }

  /**
   * Get wallet transactions (placeholder - needs endpoint)
   */
  async getWalletTransactions(
    walletAddress: string,
    options?: { limit?: number; offset?: number; chainId?: number }
  ): Promise<ApiResponse<{ transactions: Transaction[]; total: number }>> {
    const params = new URLSearchParams({ address: walletAddress });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.chainId) params.set('chainId', options.chainId.toString());
    return this.request(`/api/v1/assets/transactions?${params}`, { method: 'GET' });
  }

  /**
   * Send native token or ERC20
   */
  async sendTransaction(
    request: EngineTransactionRequest
  ): Promise<ApiResponse<EngineTransactionResponse>> {
    return this.request('/api/v1/wallet/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<ApiResponse<EngineTransactionResponse>> {
    return this.request(`/api/v1/wallet/transaction/${txId}`, { method: 'GET' });
  }

  // ===============================
  // ONRAMP ENDPOINTS (Fiat-to-Crypto)
  // ===============================

  /**
   * Get onramp quote
   */
  async getOnrampQuote(
    fiatCurrency: string,
    fiatAmount: number,
    cryptoCurrency: string,
    paymentMethod?: string
  ): Promise<ApiResponse<OnrampQuote[]>> {
    const params = new URLSearchParams({
      fiatCurrency,
      fiatAmount: fiatAmount.toString(),
      cryptoCurrency,
    });
    if (paymentMethod) params.set('paymentMethod', paymentMethod);
    return this.request(`/api/v1/fiat/onramp/quote?${params}`, { method: 'GET' });
  }

  /**
   * Create onramp session (returns widget URL)
   */
  async createOnrampSession(
    request: OnrampSessionRequest
  ): Promise<ApiResponse<OnrampSession>> {
    return this.request('/api/v1/fiat/onramp', {
      method: 'POST',
      body: JSON.stringify({
        fiatCurrency: request.fiatCurrency || 'USD',
        fiatAmount: request.fiatAmount || 100,
        cryptoCurrency: request.cryptoCurrency || 'ETH',
        walletAddress: request.walletAddress,
        chainId: 8453, // Default to Base
      }),
    });
  }

  /**
   * Get onramp session status
   */
  async getOnrampStatus(sessionId: string): Promise<ApiResponse<OnrampTransaction>> {
    return this.request(`/api/v1/fiat/onramp/${sessionId}`, { method: 'GET' });
  }

  /**
   * Get supported currencies (fiat + crypto)
   */
  async getSupportedCurrencies(): Promise<ApiResponse<{ fiatCurrencies: string[]; cryptoCurrencies: string[] }>> {
    return this.request('/api/v1/fiat/onramp', { method: 'GET' });
  }

  /**
   * Get supported fiat currencies
   */
  async getSupportedFiatCurrencies(): Promise<ApiResponse<string[]>> {
    const result = await this.getSupportedCurrencies();
    if (result.success && result.data) {
      return { success: true, data: result.data.fiatCurrencies };
    }
    return { success: false, error: result.error };
  }

  /**
   * Get supported payment methods
   */
  async getSupportedPaymentMethods(country?: string): Promise<ApiResponse<string[]>> {
    // Placeholder - engine doesn't have this endpoint yet
    return { success: true, data: ['card', 'bank_transfer', 'apple_pay', 'google_pay'] };
  }

  // ===============================
  // SWAP ENDPOINTS
  // ===============================

  /**
   * Get swap quote
   */
  async getSwapQuote(request: SwapQuoteRequest): Promise<ApiResponse<SwapQuote>> {
    return this.request('/api/v1/swap/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Execute swap
   */
  async executeSwap(request: SwapExecuteRequest): Promise<ApiResponse<SwapResult>> {
    return this.request('/api/v1/swap/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<ApiResponse<SwapResult>> {
    return this.request(`/api/v1/swap/${swapId}`, { method: 'GET' });
  }

  /**
   * Get supported tokens for swap
   */
  async getSupportedSwapTokens(chainId?: number): Promise<ApiResponse<{ tokens: Token[] }>> {
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.request(`/api/v1/swap/tokens${params}`, { method: 'GET' });
  }

  /**
   * Get supported chains for swap
   */
  async getSupportedSwapChains(): Promise<ApiResponse<{ chains: { id: number; name: string }[] }>> {
    return this.request('/api/v1/swap/chains', { method: 'GET' });
  }

  // ===============================
  // AI TRADING/QUANT ENDPOINTS
  // ===============================

  /**
   * Get available AI trading strategies
   */
  async getStrategies(): Promise<ApiResponse<AIStrategy[]>> {
    return this.request('/api/v1/quant/strategies', { method: 'GET' });
  }

  /**
   * Get strategy details
   */
  async getStrategy(strategyId: string): Promise<ApiResponse<AIStrategy>> {
    return this.request(`/api/v1/quant/strategies/${strategyId}`, { method: 'GET' });
  }

  /**
   * Get user's positions
   */
  async getPositions(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/quant/positions', { method: 'GET' });
  }

  /**
   * Create investment order
   */
  async createOrder(
    strategyId: string,
    amount: number,
    currency: string
  ): Promise<ApiResponse<AIOrder>> {
    return this.request('/api/v1/trading/orders', {
      method: 'POST',
      body: JSON.stringify({ strategyId, amount, currency }),
    });
  }

  /**
   * Get user's orders
   */
  async getUserOrders(): Promise<ApiResponse<AIOrder[]>> {
    return this.request('/api/v1/trading/orders', { method: 'GET' });
  }

  /**
   * Get user's portfolio stats from positions
   */
  async getPortfolioStats(): Promise<ApiResponse<{
    totalInvested: number;
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    activePositions: number;
  }>> {
    // Derive from positions
    const positionsResult = await this.getPositions();
    if (positionsResult.success && positionsResult.data) {
      const positions = positionsResult.data;
      const totalInvested = positions.reduce((sum, p) => sum + (p.investedAmount || 0), 0);
      const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
      const totalPnl = totalValue - totalInvested;
      const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
      return {
        success: true,
        data: {
          totalInvested,
          totalValue,
          totalPnl,
          totalPnlPercent,
          activePositions: positions.filter((p: any) => p.status === 'active').length,
        },
      };
    }
    return {
      success: true,
      data: { totalInvested: 0, totalValue: 0, totalPnl: 0, totalPnlPercent: 0, activePositions: 0 },
    };
  }

  // ===============================
  // MARKET/PRICE ENDPOINTS
  // ===============================

  /**
   * Get token prices
   */
  async getTokenPrices(symbols: string[]): Promise<ApiResponse<Record<string, {
    price: number;
    change24h: number;
    marketCap?: number;
  }>>> {
    // Convert symbols to Bybit format (add USDT suffix if needed)
    const bybitSymbols = symbols.map(s => {
      const upper = s.toUpperCase();
      if (upper.endsWith('USDT')) return upper;
      return `${upper}USDT`;
    });

    const result = await this.request<{ markets: any[] }>(
      `/api/v1/trading/market?symbols=${bybitSymbols.join(',')}`,
      { method: 'GET' }
    );

    if (result.success && result.data?.markets) {
      const prices: Record<string, { price: number; change24h: number; marketCap?: number }> = {};
      for (const market of result.data.markets) {
        const symbol = market.symbol?.replace('USDT', '') || '';
        prices[symbol] = {
          price: parseFloat(market.lastPrice) || 0,
          change24h: parseFloat(market.price24hPcnt) * 100 || 0,
          marketCap: undefined, // Bybit doesn't provide this
        };
      }
      return { success: true, data: prices };
    }
    return { success: false, error: result.error };
  }

  /**
   * Get market data overview
   */
  async getMarketData(): Promise<ApiResponse<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    markets: any[];
  }>> {
    const result = await this.request<{ markets: any[] }>('/api/v1/trading/market', { method: 'GET' });
    if (result.success && result.data?.markets) {
      return {
        success: true,
        data: {
          totalMarketCap: 0, // Would need separate API
          totalVolume24h: result.data.markets.reduce((sum, m) => sum + (parseFloat(m.volume24h) || 0), 0),
          btcDominance: 0, // Would need separate API
          markets: result.data.markets,
        },
      };
    }
    return { success: false, error: result.error };
  }

  // ===============================
  // NFT ENDPOINTS
  // ===============================

  /**
   * Get user's NFTs
   */
  async getUserNFTs(
    walletAddress: string,
    options?: { chainId?: number; limit?: number; offset?: number }
  ): Promise<ApiResponse<{ nfts: NFT[]; total: number }>> {
    const params = new URLSearchParams({ address: walletAddress });
    if (options?.chainId) params.set('chainId', options.chainId.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    return this.request(`/api/v1/assets/nfts?${params}`, { method: 'GET' });
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<ApiResponse<NFT>> {
    return this.request(`/api/v1/assets/nfts/${contractAddress}/${tokenId}?chainId=${chainId}`, { method: 'GET' });
  }

  /**
   * Get NFT collection
   */
  async getNFTCollection(
    contractAddress: string,
    chainId: number
  ): Promise<ApiResponse<NFTCollection>> {
    return this.request(`/api/v1/assets/nfts/collection/${contractAddress}?chainId=${chainId}`, { method: 'GET' });
  }

  /**
   * Transfer NFT
   */
  async transferNFT(params: {
    contractAddress: string;
    tokenId: string;
    chainId: number;
    to: string;
    tokenType?: 'ERC721' | 'ERC1155';
    amount?: number; // For ERC1155
  }): Promise<ApiResponse<{ txHash: string; status: string }>> {
    return this.request('/api/v1/assets/nfts/transfer', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ===============================
  // CONTRACT ENDPOINTS
  // ===============================

  /**
   * Get user's contracts
   */
  async getUserContracts(
    options?: { chainId?: number; limit?: number; offset?: number }
  ): Promise<ApiResponse<{ contracts: Contract[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.chainId) params.set('chainId', options.chainId.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    return this.request(`/api/v1/contracts?${params}`, { method: 'GET' });
  }

  /**
   * Get contract details
   */
  async getContractDetails(
    address: string,
    chainId: number
  ): Promise<ApiResponse<Contract>> {
    return this.request(`/api/v1/contracts/${address}?chainId=${chainId}`, { method: 'GET' });
  }

  /**
   * Read contract (call view function)
   */
  async readContract(params: ContractReadParams): Promise<ApiResponse<any>> {
    return this.request('/api/v1/contracts/read', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Write to contract (execute transaction)
   */
  async writeContract(params: ContractWriteParams): Promise<ApiResponse<{
    txHash: string;
    status: string;
  }>> {
    return this.request('/api/v1/contracts/write', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Deploy contract
   */
  async deployContract(params: ContractDeployParams): Promise<ApiResponse<{
    address: string;
    txHash: string;
    contract: Contract;
  }>> {
    return this.request('/api/v1/contracts/deploy', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ===============================
  // OFFRAMP ENDPOINTS (Crypto-to-Fiat)
  // ===============================

  /**
   * Get offramp quote
   */
  async getOfframpQuote(
    cryptoCurrency: string,
    cryptoAmount: number,
    fiatCurrency: string,
    payoutMethod?: string
  ): Promise<ApiResponse<OfframpQuote[]>> {
    const params = new URLSearchParams({
      cryptoCurrency,
      cryptoAmount: cryptoAmount.toString(),
      fiatCurrency,
    });
    if (payoutMethod) params.set('payoutMethod', payoutMethod);
    return this.request(`/api/v1/fiat/offramp/quote?${params}`, { method: 'GET' });
  }

  /**
   * Create offramp transaction
   */
  async createOfframpTransaction(request: OfframpRequest): Promise<ApiResponse<OfframpTransaction>> {
    return this.request('/api/v1/fiat/offramp', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get offramp transaction status
   */
  async getOfframpStatus(transactionId: string): Promise<ApiResponse<OfframpTransaction>> {
    return this.request(`/api/v1/fiat/offramp/${transactionId}`, { method: 'GET' });
  }

  /**
   * Get supported payout methods
   */
  async getSupportedPayoutMethods(country?: string): Promise<ApiResponse<string[]>> {
    const params = country ? `?country=${country}` : '';
    return this.request(`/api/v1/fiat/offramp/methods${params}`, { method: 'GET' });
  }

  // ===============================
  // BILL PAYMENT ENDPOINTS
  // ===============================

  /**
   * Get bill providers
   */
  async getBillProviders(
    country?: string,
    category?: string
  ): Promise<ApiResponse<BillProvider[]>> {
    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (category) params.set('category', category);
    return this.request(`/api/v1/bills/providers?${params}`, { method: 'GET' });
  }

  /**
   * Get bill details/validate account
   */
  async validateBillAccount(
    providerId: string,
    accountNumber: string
  ): Promise<ApiResponse<{
    valid: boolean;
    accountName?: string;
    minAmount?: number;
    maxAmount?: number;
    dueAmount?: number;
  }>> {
    return this.request('/api/v1/bills/validate', {
      method: 'POST',
      body: JSON.stringify({ providerId, accountNumber }),
    });
  }

  /**
   * Pay bill
   */
  async payBill(params: {
    providerId: string;
    accountNumber: string;
    amount: number;
    currency: string;
  }): Promise<ApiResponse<BillPayment>> {
    return this.request('/api/v1/bills/pay', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get bill payment history
   */
  async getBillHistory(
    options?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<{ payments: BillPayment[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    return this.request(`/api/v1/bills/history?${params}`, { method: 'GET' });
  }

  // ===============================
  // STAKING ENDPOINTS
  // ===============================

  /**
   * Get staking pools
   */
  async getStakingPools(
    chainId?: number
  ): Promise<ApiResponse<StakingPool[]>> {
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.request(`/api/v1/staking/pools${params}`, { method: 'GET' });
  }

  /**
   * Get user's staking positions
   */
  async getStakingPositions(): Promise<ApiResponse<StakingPosition[]>> {
    return this.request('/api/v1/staking/positions', { method: 'GET' });
  }

  /**
   * Stake tokens
   */
  async stake(params: {
    poolId: string;
    amount: number;
  }): Promise<ApiResponse<{ positionId: string; txHash: string }>> {
    return this.request('/api/v1/staking/stake', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Unstake tokens
   */
  async unstake(params: {
    positionId: string;
    amount?: number; // Optional for partial unstake
  }): Promise<ApiResponse<{ txHash: string }>> {
    return this.request('/api/v1/staking/unstake', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Claim staking rewards
   */
  async claimStakingRewards(positionId: string): Promise<ApiResponse<{ txHash: string; amount: number }>> {
    return this.request('/api/v1/staking/claim', {
      method: 'POST',
      body: JSON.stringify({ positionId }),
    });
  }

  // ===============================
  // USER PROFILE ENDPOINTS
  // ===============================

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/v1/user/profile', { method: 'GET' });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/v1/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request('/api/v1/user/settings', { method: 'GET' });
  }

  /**
   * Update user settings
   */
  async updateUserSettings(updates: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.request('/api/v1/user/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ===============================
  // NOTIFICATION ENDPOINTS
  // ===============================

  /**
   * Get notifications
   */
  async getNotifications(
    options?: { unreadOnly?: boolean; limit?: number; offset?: number }
  ): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number }>> {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.set('unreadOnly', 'true');
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    return this.request(`/api/v1/notifications?${params}`, { method: 'GET' });
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.request('/api/v1/notifications/read-all', { method: 'POST' });
  }

  // ===============================
  // REFERRAL ENDPOINTS
  // ===============================

  /**
   * Get referral info
   */
  async getReferralInfo(): Promise<ApiResponse<ReferralInfo>> {
    return this.request('/api/v1/referral', { method: 'GET' });
  }

  /**
   * Get referred users
   */
  async getReferrals(): Promise<ApiResponse<Referral[]>> {
    return this.request('/api/v1/referral/list', { method: 'GET' });
  }

  /**
   * Apply referral code
   */
  async applyReferralCode(code: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request('/api/v1/referral/apply', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /**
   * Claim referral rewards
   */
  async claimReferralRewards(): Promise<ApiResponse<{ amount: number; txHash?: string }>> {
    return this.request('/api/v1/referral/claim', { method: 'POST' });
  }

  // ===============================
  // KYC ENDPOINTS
  // ===============================

  /**
   * Get KYC status
   */
  async getKycStatus(): Promise<ApiResponse<{
    status: 'none' | 'pending' | 'verified' | 'rejected';
    level: number;
    limits: { daily: number; monthly: number };
    rejectionReason?: string;
  }>> {
    return this.request('/api/v1/kyc/status', { method: 'GET' });
  }

  /**
   * Start KYC verification
   */
  async startKycVerification(level: number): Promise<ApiResponse<{
    verificationUrl: string;
    sessionId: string;
  }>> {
    return this.request('/api/v1/kyc/start', {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  }

  /**
   * Submit KYC documents
   */
  async submitKycDocuments(params: {
    documentType: 'passport' | 'id_card' | 'drivers_license';
    frontImage: string; // base64
    backImage?: string; // base64
    selfieImage: string; // base64
  }): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request('/api/v1/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ===============================
  // BRIDGE ENDPOINTS
  // ===============================

  /**
   * Get bridge quote
   */
  async getBridgeQuote(params: {
    fromChainId: number;
    toChainId: number;
    fromToken: string;
    toToken: string;
    amount: string;
    walletAddress: string;
  }): Promise<ApiResponse<BridgeQuote>> {
    return this.request('/api/v1/bridge/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Execute bridge transaction
   */
  async executeBridge(params: {
    quoteId: string;
    walletAddress: string;
  }): Promise<ApiResponse<BridgeTransaction>> {
    return this.request('/api/v1/bridge/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get bridge transaction status
   */
  async getBridgeStatus(bridgeId: string): Promise<ApiResponse<BridgeTransaction>> {
    return this.request(`/api/v1/bridge/${bridgeId}`, { method: 'GET' });
  }

  /**
   * Get supported bridge routes
   */
  async getSupportedBridgeRoutes(): Promise<ApiResponse<{
    routes: { fromChainId: number; toChainId: number; tokens: string[] }[];
  }>> {
    return this.request('/api/v1/bridge/routes', { method: 'GET' });
  }

  // ===============================
  // GAS ENDPOINTS
  // ===============================

  /**
   * Get gas estimate for transaction
   */
  async getGasEstimate(params: {
    chainId: number;
    to: string;
    data?: string;
    value?: string;
  }): Promise<ApiResponse<GasEstimate>> {
    return this.request('/api/v1/gas/estimate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get current gas prices for chain
   */
  async getGasPrice(chainId: number): Promise<ApiResponse<GasPrice>> {
    return this.request(`/api/v1/gas/price?chainId=${chainId}`, { method: 'GET' });
  }

  // ===============================
  // WALLET IMPORT/EXPORT ENDPOINTS
  // ===============================

  /**
   * Import wallet from private key or mnemonic
   */
  async importWallet(request: WalletImportRequest): Promise<ApiResponse<{
    wallet: any;
    address: string;
    smartAccountAddress?: string;
  }>> {
    return this.request('/api/v1/wallet/import', {
      method: 'POST',
      body: JSON.stringify(request),
    }, true); // Include secret key for secure import
  }

  /**
   * Export wallet (get encrypted private key)
   * Requires additional authentication
   */
  async exportWallet(walletId: string, pin: string): Promise<ApiResponse<{
    encryptedPrivateKey: string;
    address: string;
  }>> {
    return this.request('/api/v1/wallet/export', {
      method: 'POST',
      body: JSON.stringify({ walletId, pin }),
    }, true);
  }

  /**
   * Generate new mnemonic phrase
   */
  async generateMnemonic(): Promise<ApiResponse<{ mnemonic: string; address: string }>> {
    return this.request('/api/v1/wallet/generate-mnemonic', { method: 'POST' }, true);
  }

  /**
   * Validate mnemonic phrase
   */
  async validateMnemonic(mnemonic: string): Promise<ApiResponse<{ valid: boolean; address?: string }>> {
    return this.request('/api/v1/wallet/validate-mnemonic', {
      method: 'POST',
      body: JSON.stringify({ mnemonic }),
    });
  }

  // ===============================
  // PORTFOLIO ANALYTICS ENDPOINTS
  // ===============================

  /**
   * Get portfolio analytics with historical data
   */
  async getPortfolioAnalytics(
    walletAddress: string,
    period: '24h' | '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
  ): Promise<ApiResponse<PortfolioAnalytics>> {
    const params = new URLSearchParams({ address: walletAddress, period });
    return this.request(`/api/v1/analytics/portfolio?${params}`, { method: 'GET' });
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(
    walletAddress: string,
    period: '24h' | '7d' | '30d' | '90d' = '30d'
  ): Promise<ApiResponse<{
    totalTransactions: number;
    totalVolume: number;
    avgTransactionValue: number;
    byType: Record<string, number>;
    byChain: Record<string, number>;
  }>> {
    const params = new URLSearchParams({ address: walletAddress, period });
    return this.request(`/api/v1/analytics/transactions?${params}`, { method: 'GET' });
  }

  // ===============================
  // ADVANCED TRADING ENDPOINTS
  // ===============================

  /**
   * Create limit order
   */
  async createLimitOrder(params: {
    tokenSymbol: string;
    type: 'buy' | 'sell';
    amount: number;
    limitPrice: number;
    chainId: number;
    expiresIn?: number; // seconds
    conditions?: TradingCondition[];
  }): Promise<ApiResponse<LimitOrder>> {
    return this.request('/api/v1/trading/limit-orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get user's limit orders
   */
  async getLimitOrders(status?: 'pending' | 'filled' | 'cancelled'): Promise<ApiResponse<LimitOrder[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/trading/limit-orders${params}`, { method: 'GET' });
  }

  /**
   * Cancel limit order
   */
  async cancelLimitOrder(orderId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/v1/trading/limit-orders/${orderId}`, { method: 'DELETE' });
  }

  /**
   * Set price alert
   */
  async setPriceAlert(params: {
    tokenSymbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    notification: 'push' | 'email' | 'both';
  }): Promise<ApiResponse<{ alertId: string }>> {
    return this.request('/api/v1/trading/alerts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get price alerts
   */
  async getPriceAlerts(): Promise<ApiResponse<{
    id: string;
    tokenSymbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    status: 'active' | 'triggered' | 'cancelled';
    createdAt: string;
    triggeredAt?: string;
  }[]>> {
    return this.request('/api/v1/trading/alerts', { method: 'GET' });
  }

  /**
   * Delete price alert
   */
  async deletePriceAlert(alertId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/v1/trading/alerts/${alertId}`, { method: 'DELETE' });
  }

  // ===============================
  // SESSION MANAGEMENT
  // ===============================

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<ApiResponse<{
    sessions: {
      id: string;
      deviceName: string;
      ipAddress: string;
      lastActive: string;
      current: boolean;
    }[];
  }>> {
    return this.request('/api/v1/auth/sessions', { method: 'GET' });
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<ApiResponse<{ revokedCount: number }>> {
    return this.request('/api/v1/auth/sessions/revoke-all', { method: 'POST' });
  }

  // ========== Webhooks ==========

  /**
   * List webhooks for the project
   */
  async listWebhooks(options?: { isActive?: boolean }): Promise<ApiResponse<{ webhooks: Webhook[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.isActive !== undefined) params.set('isActive', String(options.isActive));
    const query = params.toString();
    return this.request(`/api/v1/webhooks${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<ApiResponse<{ webhook: Webhook }>> {
    return this.request(`/api/v1/webhooks/${webhookId}`, { method: 'GET' });
  }

  /**
   * Create a webhook
   */
  async createWebhook(input: CreateWebhookInput): Promise<ApiResponse<{ webhook: Webhook }>> {
    return this.request('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a webhook
   */
  async updateWebhook(webhookId: string, input: UpdateWebhookInput): Promise<ApiResponse<{ webhook: Webhook }>> {
    return this.request(`/api/v1/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/api/v1/webhooks/${webhookId}`, { method: 'DELETE' });
  }

  /**
   * Get webhook deliveries
   */
  async getWebhookDeliveries(
    webhookId: string,
    options?: { status?: 'pending' | 'success' | 'failed'; limit?: number; offset?: number }
  ): Promise<ApiResponse<{ deliveries: WebhookDelivery[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const query = params.toString();
    return this.request(`/api/v1/webhooks/${webhookId}/deliveries${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Test a webhook
   */
  async testWebhook(webhookId: string): Promise<ApiResponse<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }>> {
    return this.request(`/api/v1/webhooks/${webhookId}/test`, { method: 'POST' });
  }

  // ========== Admin (requires admin role) ==========

  /**
   * List all users (admin only)
   */
  async adminListUsers(options?: AdminListOptions & {
    role?: 'user' | 'admin';
    kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
    isActive?: boolean;
  }): Promise<ApiResponse<PaginatedResult<AdminUser>>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.search) params.set('search', options.search);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options?.role) params.set('role', options.role);
    if (options?.kycStatus) params.set('kycStatus', options.kycStatus);
    if (options?.isActive !== undefined) params.set('isActive', String(options.isActive));
    const query = params.toString();
    return this.request(`/api/v1/admin/users${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get user by ID (admin only)
   */
  async adminGetUser(userId: string): Promise<ApiResponse<{ user: AdminUser }>> {
    return this.request(`/api/v1/admin/users/${userId}`, { method: 'GET' });
  }

  /**
   * Update user (admin only)
   */
  async adminUpdateUser(userId: string, data: {
    role?: 'user' | 'admin';
    isActive?: boolean;
    kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  }): Promise<ApiResponse<{ user: AdminUser }>> {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * List all projects (admin only)
   */
  async adminListProjects(options?: AdminListOptions & {
    isActive?: boolean;
  }): Promise<ApiResponse<PaginatedResult<AdminProject>>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.search) params.set('search', options.search);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options?.isActive !== undefined) params.set('isActive', String(options.isActive));
    const query = params.toString();
    return this.request(`/api/v1/admin/projects${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get project by ID (admin only)
   */
  async adminGetProject(projectId: string): Promise<ApiResponse<{ project: AdminProject }>> {
    return this.request(`/api/v1/admin/projects/${projectId}`, { method: 'GET' });
  }

  /**
   * Update project (admin only)
   */
  async adminUpdateProject(projectId: string, data: {
    name?: string;
    isActive?: boolean;
    settings?: Record<string, unknown>;
  }): Promise<ApiResponse<{ project: AdminProject }>> {
    return this.request(`/api/v1/admin/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Regenerate project API key (admin only)
   */
  async adminRegenerateApiKey(projectId: string): Promise<ApiResponse<{ apiKey: string }>> {
    return this.request(`/api/v1/admin/projects/${projectId}/regenerate-key`, { method: 'POST' });
  }

  /**
   * Get system statistics (admin only)
   */
  async adminGetStats(days?: number): Promise<ApiResponse<SystemStats>> {
    const query = days ? `?days=${days}` : '';
    return this.request(`/api/v1/admin/stats${query}`, { method: 'GET' });
  }

  /**
   * Get system logs (admin only)
   */
  async adminGetLogs(options?: {
    level?: 'info' | 'warn' | 'error';
    service?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ logs: SystemLog[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.level) params.set('level', options.level);
    if (options?.service) params.set('service', options.service);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);
    const query = params.toString();
    return this.request(`/api/v1/admin/logs${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get rate limit status (admin only)
   */
  async adminGetRateLimits(options?: {
    identifier?: string;
    limit?: number;
  }): Promise<ApiResponse<{ limits: RateLimitInfo[] }>> {
    const params = new URLSearchParams();
    if (options?.identifier) params.set('identifier', options.identifier);
    if (options?.limit) params.set('limit', String(options.limit));
    const query = params.toString();
    return this.request(`/api/v1/admin/rate-limits${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Clear rate limits for an identifier (admin only)
   */
  async adminClearRateLimits(identifier: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/v1/admin/rate-limits/${identifier}`, { method: 'DELETE' });
  }

  // ========== AI Agent Configuration ==========

  /**
   * Get all AI agent configurations
   * This returns the full agent setup including tiers, cycles, and trading parameters
   */
  async getAgentConfigs(options?: {
    includeInactive?: boolean;
    agentId?: string;
  }): Promise<ApiResponse<{
    agents?: Array<{
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
      preview: {
        tier: { tier: number; amount: number; label: string };
        cycle: number;
        dailyLots: number;
        stabilityScore: number;
        roiRange: { min: number; max: number; userMin: number; userMax: number };
        shareRate: number;
        profitEstimate: { monthlyMin: number; monthlyMax: number; cycleMin: number; cycleMax: number };
      };
    }>;
    agent?: any;
    shareRates?: Record<number, number>;
  }>> {
    const params = new URLSearchParams();
    if (options?.includeInactive) params.set('includeInactive', 'true');
    if (options?.agentId) params.set('agentId', options.agentId);
    const query = params.toString();
    return this.request(`/api/v1/agents${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Calculate subscription parameters for an agent
   */
  async calculateAgentParams(params: {
    agentId: string;
    amount: number;
    cycleDays: number;
  }): Promise<ApiResponse<{
    dailyLots: number;
    effectiveCapital: number;
    stabilityScore: number;
    roiRange: { min: number; max: number; userMin: number; userMax: number };
    shareRate: number;
    profitEstimate: { monthlyMin: number; monthlyMax: number; cycleMin: number; cycleMax: number };
  }>> {
    return this.request('/api/v1/agents/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get supported trading pairs from agents
   */
  async getTradingPairs(): Promise<ApiResponse<{
    pairs: string[];
    byAgent: Record<string, string[]>;
  }>> {
    const result = await this.getAgentConfigs();
    if (result.success && result.data?.agents) {
      const allPairs = new Set<string>();
      const byAgent: Record<string, string[]> = {};
      for (const agent of result.data.agents) {
        byAgent[agent.id] = agent.supported_pairs;
        agent.supported_pairs.forEach(p => allPairs.add(p));
      }
      return { success: true, data: { pairs: Array.from(allPairs), byAgent } };
    }
    return { success: false, error: result.error };
  }

  // ========== AI Quant Trading ==========

  /**
   * Get all AI trading strategies
   */
  async getAIStrategies(filters?: {
    category?: StrategyCategory;
    riskLevel?: number;
    minTvl?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<{ strategies: AIStrategy[] }>> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.riskLevel) params.set('risk_level', String(filters.riskLevel));
    if (filters?.minTvl) params.set('min_tvl', String(filters.minTvl));
    if (filters?.isActive !== undefined) params.set('is_active', String(filters.isActive));
    const query = params.toString();
    return this.request(`/api/v1/ai-quant/strategies${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get AI strategy details
   */
  async getAIStrategy(strategyId: string, include?: ('performance' | 'market' | 'trades')[]): Promise<ApiResponse<{
    strategy: AIStrategy;
    performance?: AINavSnapshot[];
    marketData?: AIMarketData[];
    trades?: AITradeExecution[];
  }>> {
    const params = new URLSearchParams();
    if (include?.length) params.set('include', include.join(','));
    const query = params.toString();
    return this.request(`/api/v1/ai-quant/strategies/${strategyId}${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get strategy performance history
   */
  async getAIStrategyPerformance(strategyId: string, days = 30): Promise<ApiResponse<{ performance: AINavSnapshot[] }>> {
    return this.request(`/api/v1/ai-quant/strategies/${strategyId}?include=performance&days=${days}`, { method: 'GET' });
  }

  /**
   * Get real-time market data for strategy pairs
   */
  async getAIStrategyMarketData(strategyId: string): Promise<ApiResponse<{ marketData: AIMarketData[] }>> {
    return this.request(`/api/v1/ai-quant/strategies/${strategyId}?include=market`, { method: 'GET' });
  }

  /**
   * Create AI trading order
   */
  async createAIOrder(request: CreateAIOrderRequest): Promise<ApiResponse<{ order: AIOrder }>> {
    return this.request('/api/v1/ai-quant/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get user's AI orders
   */
  async getAIOrders(filters?: {
    strategyId?: string;
    status?: AIOrderStatus;
  }): Promise<ApiResponse<{ orders: AIOrder[] }>> {
    const params = new URLSearchParams();
    if (filters?.strategyId) params.set('strategy_id', filters.strategyId);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return this.request(`/api/v1/ai-quant/orders${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get AI order details
   */
  async getAIOrder(orderId: string): Promise<ApiResponse<{
    order: AIOrder;
    strategy: AIStrategy;
  }>> {
    return this.request(`/api/v1/ai-quant/orders/${orderId}`, { method: 'GET' });
  }

  /**
   * Pause AI order
   */
  async pauseAIOrder(orderId: string): Promise<ApiResponse<{ order: AIOrder; message: string }>> {
    return this.request(`/api/v1/ai-quant/orders/${orderId}/pause`, { method: 'POST' });
  }

  /**
   * Resume AI order
   */
  async resumeAIOrder(orderId: string): Promise<ApiResponse<{ order: AIOrder; message: string }>> {
    return this.request(`/api/v1/ai-quant/orders/${orderId}/resume`, { method: 'POST' });
  }

  /**
   * Request redemption for AI order
   */
  async redeemAIOrder(orderId: string): Promise<ApiResponse<{
    success: boolean;
    redemption: AIRedemptionResult;
    message: string;
  }>> {
    return this.request(`/api/v1/ai-quant/orders/${orderId}/redeem`, { method: 'POST' });
  }

  /**
   * Get AI portfolio summary
   */
  async getAIPortfolio(include?: ('allocations' | 'orders')[]): Promise<ApiResponse<{
    portfolio: AIPortfolioSummary;
    allocations?: AITradeAllocation[];
    orders?: AIOrder[];
  }>> {
    const params = new URLSearchParams();
    if (include?.length) params.set('include', include.join(','));
    const query = params.toString();
    return this.request(`/api/v1/ai-quant/portfolio${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Get user's trade allocations
   */
  async getAITradeAllocations(limit = 50): Promise<ApiResponse<{ allocations: AITradeAllocation[] }>> {
    return this.request(`/api/v1/ai-quant/portfolio?include=allocations&limit=${limit}`, { method: 'GET' });
  }

  /**
   * Get trade history for a strategy
   */
  async getAITradeHistory(strategyId: string, limit = 50): Promise<ApiResponse<{ trades: AITradeExecution[] }>> {
    return this.request(`/api/v1/ai-quant/strategies/${strategyId}?include=trades&limit=${limit}`, { method: 'GET' });
  }

  /**
   * Execute AI signals for a strategy (admin only)
   */
  async executeAISignals(strategyId: string): Promise<ApiResponse<{
    executions: AITradeExecution[];
    count: number;
    message: string;
  }>> {
    return this.request('/api/v1/ai-quant/execute', {
      method: 'POST',
      body: JSON.stringify({ strategyId }),
    });
  }

  // ========== Free Price APIs (No API Key Required) ==========

  /**
   * Get cryptocurrency prices (FREE - uses CoinGecko/Binance/CoinCap)
   */
  async getCryptoPrices(symbols: string[]): Promise<ApiResponse<{
    prices: Array<{
      symbol: string;
      price: number;
      change24h: number;
      changePercent24h: number;
      high24h: number;
      low24h: number;
      volume24h: number;
      marketCap?: number;
      lastUpdated: string;
    }>;
  }>> {
    return this.request(`/api/v1/prices?symbols=${symbols.join(',')}`, { method: 'GET' });
  }

  /**
   * Get single cryptocurrency price (FREE)
   */
  async getCryptoPrice(symbol: string): Promise<ApiResponse<{
    price: {
      symbol: string;
      price: number;
      change24h: number;
      changePercent24h: number;
      high24h: number;
      low24h: number;
      volume24h: number;
      marketCap?: number;
      lastUpdated: string;
    };
  }>> {
    return this.request(`/api/v1/prices/${symbol}`, { method: 'GET' });
  }

  /**
   * Get OHLCV candles for charting (FREE - from Binance)
   */
  async getCryptoCandles(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit = 100
  ): Promise<ApiResponse<{
    symbol: string;
    interval: string;
    candles: Array<{
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  }>> {
    return this.request(`/api/v1/prices/${symbol}?candles=true&interval=${interval}&limit=${limit}`, { method: 'GET' });
  }

  /**
   * Get top cryptocurrencies by market cap (FREE)
   */
  async getTopCryptos(limit = 20): Promise<ApiResponse<{
    prices: Array<{
      symbol: string;
      price: number;
      change24h: number;
      changePercent24h: number;
      high24h: number;
      low24h: number;
      volume24h: number;
      marketCap?: number;
      lastUpdated: string;
    }>;
  }>> {
    return this.request(`/api/v1/prices?type=top&limit=${limit}`, { method: 'GET' });
  }

  /**
   * Get crypto market overview (FREE)
   */
  async getCryptoMarketOverview(): Promise<ApiResponse<{
    overview: {
      totalMarketCap: number;
      totalVolume24h: number;
      btcDominance: number;
      marketCapChange24h: number;
      activeCryptocurrencies: number;
    };
  }>> {
    return this.request('/api/v1/prices?type=overview', { method: 'GET' });
  }

  // ========== Project Management ==========

  /**
   * Get user's projects
   */
  async getProjects(options?: {
    isActive?: boolean;
  }): Promise<ApiResponse<{ projects: AdminProject[]; total: number }>> {
    const params = new URLSearchParams();
    if (options?.isActive !== undefined) params.set('isActive', String(options.isActive));
    const query = params.toString();
    return this.request(`/api/v1/projects${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  /**
   * Create a new project for ecosystem partners
   */
  async createProject(params: {
    name: string;
    slug: string;
    settings?: Record<string, unknown>;
  }): Promise<ApiResponse<{ project: AdminProject }>> {
    return this.request('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<ApiResponse<{ project: AdminProject }>> {
    return this.request(`/api/v1/projects/${projectId}`, { method: 'GET' });
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, updates: {
    name?: string;
    isActive?: boolean;
    settings?: Record<string, unknown>;
  }): Promise<ApiResponse<{ project: AdminProject }>> {
    return this.request(`/api/v1/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get project features status
   */
  async getProjectFeatures(projectId: string): Promise<ApiResponse<{
    features: Record<string, {
      enabled: boolean;
      name: string;
      description: string;
      description_zh: string;
    }>;
    availableFeatures: string[];
  }>> {
    return this.request(`/api/v1/projects/${projectId}/features`, { method: 'GET' });
  }

  /**
   * Enable/disable features for a project
   */
  async updateProjectFeatures(projectId: string, features: {
    wallet?: boolean;
    swap?: boolean;
    contracts?: boolean;
    fiat?: boolean;
    payments?: boolean;
    quant?: boolean;
    ai?: boolean;
    x402?: boolean;
  }): Promise<ApiResponse<{ project: AdminProject; message: string }>> {
    return this.request(`/api/v1/projects/${projectId}/features`, {
      method: 'PATCH',
      body: JSON.stringify(features),
    });
  }

  /**
   * Regenerate project API key
   */
  async regenerateProjectApiKey(projectId: string): Promise<ApiResponse<{ apiKey: string }>> {
    return this.request(`/api/v1/projects/${projectId}/api-key`, { method: 'POST' });
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
  }
}

// Factory function
export function createOneEngineClient(options?: {
  baseUrl?: string;
  clientId?: string;
  secretKey?: string;
}): OneEngineClient {
  return new OneEngineClient(options);
}
