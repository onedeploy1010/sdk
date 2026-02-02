// ===== User Types =====
export interface User {
  id: string;
  email: string;
  walletAddress: string | null;
  smartAccountAddress: string | null;
  kycStatus: KycStatus;
  kycLevel: KycLevel;
  membershipTier: MembershipTier;
  createdAt: string;
}

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type KycLevel = 0 | 1 | 2 | 3;
export type MembershipTier = 'basic' | 'premium' | 'pro';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  country: string | null;
  kycStatus: KycStatus;
  kycLevel: KycLevel;
  membershipTier: MembershipTier;
}

export interface UserSettings {
  userId: string;
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  transactions: boolean;
  marketing: boolean;
}

// ===== Token & Asset Types =====
export interface Token {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  balanceUsd?: number;
  price: number;
  value: number;
  change24h: number;
  priceChange24h?: number;
  chainId?: number;
  chain: string;
  chainName?: string;
  chainIcon?: string;
  contractAddress?: string;
  address?: string;
  decimals?: number;
}

export interface WalletBalance {
  totalUsd: number;
  change24h: number;
  changePercent24h: number;
  tokens: Token[];
}

export interface OnChainBalance {
  tokenAddress: string | null;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: string;
  balanceFormatted: string;
  chain: string;
  chainId: number;
}

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  priceChange24h?: number; // Alias for backwards compatibility
  marketCap?: number;
  volume24h?: number;
  updatedAt?: string;
}

// ===== Transaction Types =====
export type TransactionType = 'send' | 'receive' | 'swap' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'bridge';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'completed';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  symbol?: string;
  tokenSymbol?: string;
  tokenName?: string;
  amountUsd?: number;
  from?: string;
  to?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string | null;
  chainId?: number;
  chain?: string;
  timestamp: string;
  fee?: number;
  note?: string | null;
}

// ===== AI Quant Trading Types =====

export type StrategyCategory =
  | 'conservative'
  | 'balanced'
  | 'aggressive'
  | 'hedge'
  | 'arbitrage'
  | 'trend'
  | 'grid'
  | 'dca';

export type AIOrderStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'pending_redemption'
  | 'redeemed';

export type TradeAction =
  | 'buy'
  | 'sell'
  | 'long'
  | 'short'
  | 'close_long'
  | 'close_short';

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

export interface AIStrategy {
  id: string;
  name: string;
  description: string | null;
  category: StrategyCategory;
  riskLevel: number; // 1-10
  minInvestment: number;
  maxInvestment: number | null;
  lockPeriodDays: number;
  expectedApyMin: number | null;
  expectedApyMax: number | null;
  managementFeeRate: number;
  performanceFeeRate: number;
  supportedPairs: string[];
  supportedChains: string[];
  leverageMin: number;
  leverageMax: number;
  isActive: boolean;
  tvl: number;
  totalUsers: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  currentNav: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AIOrder {
  id: string;
  userId: string;
  strategyId: string;
  strategyName?: string;
  amount: number;
  currency: string;
  chain: string;
  status: AIOrderStatus;
  startDate: string;
  lockEndDate: string;
  lockPeriodDays: number;
  pauseCount: number;
  totalPauseDays: number;
  currentPauseStart: string | null;
  realizedProfit: number;
  unrealizedProfit: number;
  totalFeesPaid: number;
  currentNav: number | null;
  shareRatio: number;
  shares: number;
  redemptionRequestedAt: string | null;
  redemptionAmount: number | null;
  earlyWithdrawalPenaltyRate: number | null;
  penaltyAmount: number;
  txHashDeposit: string | null;
  txHashRedemption: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AITradeExecution {
  id: string;
  batchId: string;
  strategyId: string;
  tradeSeq: number;
  action: TradeAction;
  pair: string;
  entryPrice: number;
  exitPrice: number | null;
  amount: number;
  leverage: number;
  pnl: number;
  pnlPct: number;
  fee: number;
  status: 'open' | 'closed' | 'liquidated' | 'cancelled';
  openedAt: string;
  closedAt: string | null;
  aiConfidence: number | null;
  aiReasoning: string | null;
  externalOrderId: string | null;
  metadata?: Record<string, unknown>;
}

export interface AITradeAllocation {
  id: string;
  executionId: string;
  orderId: string;
  userId: string;
  allocatedAmount: number;
  allocatedPnl: number;
  allocatedFee: number;
  shareRatio: number;
  createdAt: string;
}

export interface AINavSnapshot {
  id: string;
  strategyId: string;
  snapshotDate: string;
  nav: number;
  dailyPnl: number;
  dailyPnlPct: number;
  cumulativePnl: number;
  cumulativePnlPct: number;
  totalAum: number;
  createdAt: string;
}

export interface AIPortfolioSummary {
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalFeesPaid: number;
  activeOrders: number;
  strategies: Array<{
    strategyId: string;
    strategyName: string;
    invested: number;
    currentValue: number;
    pnl: number;
    pnlPct: number;
  }>;
}

export interface AIRedemptionResult {
  success: boolean;
  redemptionAmount: number;
  penaltyRate: number;
  penaltyAmount: number;
  completionRate: number;
  finalAmount: number;
}

export interface AIMarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface CreateAIOrderRequest {
  strategyId: string;
  amount: number;
  currency?: string;
  chain?: string;
  lockPeriodDays?: number;
  txHashDeposit?: string;
}

export interface Position {
  id: string;
  strategyId: string;
  strategyName: string;
  status: 'active' | 'paused' | 'closed' | 'pending';
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  entryDate: string;
  exitDate?: string;
}

// ===== Card Types =====
export type CardStatus = 'pending' | 'active' | 'frozen' | 'cancelled';
export type CardTier = 'standard' | 'gold' | 'platinum' | 'black';

export interface Card {
  id: string;
  tier: CardTier;
  status: CardStatus;
  lastFour: string;
  expiryDate: string;
  balance?: number;
  spendLimit: number;
  spentThisMonth: number;
  cardNumber?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'declined';
}

// ===== Notification Types =====
export interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

// ===== API Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ===== Chain Types =====
export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  testnet: boolean;
}

// ===== NFT Types =====
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  chain: string;
  name: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  animationUrl?: string;
  tokenType: 'ERC721' | 'ERC1155';
  metadata?: Record<string, any>;
  attributes?: NFTAttribute[];
  owner: string;
  collection?: NFTCollection;
  floorPrice?: number;
  lastPrice?: number;
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: string;
  maxValue?: number;
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol?: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  chainId: number;
  totalSupply?: number;
  floorPrice?: number;
  verified?: boolean;
}

export interface NFTTransfer {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'burn';
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  transactionHash: string;
  timestamp: string;
  price?: number;
  currency?: string;
}

// ===== Contract Types =====
export interface Contract {
  id: string;
  address: string;
  chainId: number;
  name: string;
  symbol?: string;
  contractType: ContractType;
  abi?: any[];
  verified?: boolean;
  deployedAt?: string;
  deployer?: string;
}

export type ContractType = 'erc20' | 'erc721' | 'erc1155' | 'custom' | 'marketplace' | 'staking' | 'governance';

export interface ContractReadParams {
  contractAddress: string;
  chainId: number;
  functionName: string;
  args?: any[];
}

export interface ContractWriteParams {
  contractAddress: string;
  chainId: number;
  functionName: string;
  args?: any[];
  value?: string;
  gasLimit?: string;
}

export interface ContractDeployParams {
  chainId: number;
  contractType: string;
  name: string;
  symbol?: string;
  constructorArgs?: any[];
  metadata?: Record<string, any>;
}

// ===== Bill Payment Types =====
export interface BillProvider {
  id: string;
  name: string;
  category: BillCategory;
  icon?: string;
  countries: string[];
  minAmount: number;
  maxAmount: number;
  fees: number;
}

export type BillCategory = 'electricity' | 'water' | 'gas' | 'internet' | 'phone' | 'tv' | 'insurance' | 'tax' | 'other';

export interface BillPayment {
  id: string;
  providerId: string;
  providerName: string;
  category: BillCategory;
  accountNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== Offramp Types =====
export interface OfframpQuote {
  provider: string;
  cryptoCurrency: string;
  cryptoAmount: number;
  fiatCurrency: string;
  fiatAmount: number;
  rate: number;
  fees: {
    network: number;
    provider: number;
    total: number;
  };
  payoutMethod: string;
  estimatedTime: string;
}

export interface OfframpRequest {
  cryptoCurrency: string;
  cryptoAmount: number;
  fiatCurrency: string;
  payoutMethod: string;
  payoutDetails: Record<string, string>;
}

export interface OfframpTransaction {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatAmount: number;
  fiatCurrency: string;
  txHash?: string;
  payoutReference?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== Staking Types =====
export interface StakingPool {
  id: string;
  name: string;
  token: string;
  rewardToken: string;
  chainId: number;
  apy: number;
  totalStaked: number;
  minStake: number;
  lockPeriod: number;
  status: 'active' | 'paused' | 'ended';
}

export interface StakingPosition {
  id: string;
  poolId: string;
  poolName: string;
  stakedAmount: number;
  rewardsEarned: number;
  startDate: string;
  unlockDate?: string;
  status: 'active' | 'unlocked' | 'withdrawn';
}

// ===== Referral Types =====
export interface ReferralInfo {
  code: string;
  link: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Referral {
  id: string;
  referredUserId: string;
  status: 'pending' | 'active' | 'rewarded';
  earnings: number;
  createdAt: string;
}

// ===== Bridge Types =====
export interface BridgeQuote {
  quoteId: string;
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  estimatedTime: string;
  fees: {
    bridge: number;
    gas: number;
    total: number;
  };
  route: BridgeRoute[];
  expiresAt: string;
}

export interface BridgeRoute {
  protocol: string;
  fromChain: string;
  toChain: string;
  estimatedTime: string;
}

export interface BridgeTransaction {
  id: string;
  status: 'pending' | 'source_confirmed' | 'bridging' | 'completed' | 'failed';
  fromChainId: number;
  toChainId: number;
  fromAmount: string;
  toAmount?: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== Gas Types =====
export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCostWei: string;
  estimatedCostUsd: number;
}

export interface GasPrice {
  chainId: number;
  slow: { gasPrice: string; estimatedTime: string };
  standard: { gasPrice: string; estimatedTime: string };
  fast: { gasPrice: string; estimatedTime: string };
  baseFee?: string;
}

// ===== Wallet Import/Export Types =====
export interface WalletExport {
  address: string;
  encryptedPrivateKey?: string;
  mnemonic?: string;
  publicKey: string;
  chainId: number;
  type: 'eoa' | 'smart' | 'imported';
}

export interface WalletImportRequest {
  privateKey?: string;
  mnemonic?: string;
  chainId?: number;
  label?: string;
}

// ===== Session Types =====
export interface Session {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  deviceId?: string;
}

// ===== Analytics Types =====
export interface PortfolioHistory {
  date: string;
  totalValue: number;
  change: number;
  changePercent: number;
}

export interface AssetAllocation {
  category: string;
  value: number;
  percentage: number;
  tokens: { symbol: string; value: number; percentage: number }[];
}

export interface PortfolioAnalytics {
  totalValue: number;
  allTimeProfit: number;
  allTimeProfitPercent: number;
  bestPerformer: { symbol: string; change: number };
  worstPerformer: { symbol: string; change: number };
  history: PortfolioHistory[];
  allocation: AssetAllocation[];
}

// ===== Advanced Trading Types =====
export interface TradingCondition {
  type: 'stop_loss' | 'take_profit' | 'trailing_stop';
  triggerPrice: number;
  triggerPercent?: number;
  action: 'sell' | 'notify';
}

export interface LimitOrder {
  id: string;
  type: 'buy' | 'sell';
  tokenSymbol: string;
  amount: number;
  limitPrice: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  conditions?: TradingCondition[];
  createdAt: string;
  expiresAt?: string;
}

// ===== Event Types for SDK =====
export type SDKEventType =
  | 'auth:login'
  | 'auth:logout'
  | 'wallet:connected'
  | 'wallet:disconnected'
  | 'transaction:pending'
  | 'transaction:confirmed'
  | 'transaction:failed'
  | 'balance:updated'
  | 'price:updated'
  | 'notification:received';

export interface SDKEvent {
  type: SDKEventType;
  payload: any;
  timestamp: string;
}

// ===== Permission Types =====
export type Permission =
  | 'wallet:read'
  | 'wallet:write'
  | 'wallet:sign'
  | 'trade:read'
  | 'trade:execute'
  | 'profile:read'
  | 'profile:write'
  | 'admin:all';

export interface PermissionScope {
  permissions: Permission[];
  expiresAt?: string;
}

// ===== Webhook Types =====
export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'wallet.created'
  | 'transaction.pending'
  | 'transaction.confirmed'
  | 'transaction.failed'
  | 'payment.created'
  | 'payment.paid'
  | 'payment.failed'
  | 'position.opened'
  | 'position.closed'
  | 'order.filled'
  | 'strategy.signal';

export interface Webhook {
  id: string;
  projectId: string;
  url: string;
  events: WebhookEventType[];
  secret?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: unknown;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateWebhookInput {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEventType[];
  secret?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ===== Admin Types =====
export interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin';
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  walletCount: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AdminProject {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail?: string;
  apiKey: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStats {
  overview: {
    totalUsers: number;
    newUsers: number;
    totalWallets: number;
    totalTransactions: number;
    totalProjects: number;
    totalStrategies: number;
    activePositions: number;
    totalPayments: number;
    fiatVolume: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  chainVolume: Array<{ chainId: number; count: number }>;
  kycBreakdown: Record<string, number>;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminListOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RateLimitInfo {
  identifier: string;
  endpoint: string;
  count: number;
  windowStart: string;
  windowEnd: string;
}

// ===== StableFX Forex Types =====
export * from './forex';

// ===== AI Trading Extended Types =====
export * from './aiTrading';
