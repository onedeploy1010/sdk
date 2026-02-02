// ══════════════════════════════════════════════════════════════════════════════
// ONE SDK - StableFX On-Chain Forex Types & Constants
// Shared types for stablecoin foreign exchange pool trading
// ══════════════════════════════════════════════════════════════════════════════

// ── Capital Split ────────────────────────────────────────────────────────────

export const FOREX_CAPITAL_SPLIT = {
  poolReserves: 0.50,
  tradingCapital: 0.50,
} as const;

export function computePoolAllocations(amount: number): {
  tradingCapital: number;
  totalPoolReserves: number;
  clearing: number;
  hedging: number;
  insurance: number;
} {
  const totalPoolReserves = amount * FOREX_CAPITAL_SPLIT.poolReserves;
  const tradingCapital = amount * FOREX_CAPITAL_SPLIT.tradingCapital;
  return {
    tradingCapital,
    totalPoolReserves,
    clearing: totalPoolReserves * 0.50,
    hedging: totalPoolReserves * 0.30,
    insurance: totalPoolReserves * 0.20,
  };
}

// ── Cycle Options ────────────────────────────────────────────────────────────

export interface ForexCycleOption {
  days: number;
  feeRate: number;
  commissionRate: number;
  label: string;
}

export const FOREX_CYCLE_OPTIONS: ForexCycleOption[] = [
  { days: 30,  feeRate: 0.10, commissionRate: 0.60, label: '30D' },
  { days: 60,  feeRate: 0.08, commissionRate: 0.70, label: '60D' },
  { days: 90,  feeRate: 0.07, commissionRate: 0.75, label: '90D' },
  { days: 180, feeRate: 0.05, commissionRate: 0.85, label: '180D' },
  { days: 360, feeRate: 0.03, commissionRate: 0.90, label: '360D' },
];

// ── Currency Pairs ───────────────────────────────────────────────────────────

export interface ForexCurrencyPair {
  id: string;
  base: string;
  quote: string;
  symbol: string;
  flag: string;
  name: string;
  basePrice: number;
  pipSize: number;
  spreadPips: number;
}

export const FOREX_CURRENCY_PAIRS: ForexCurrencyPair[] = [
  { id: 'USDC_EURC', base: 'USDC', quote: 'EURC', symbol: 'USDC/EURC', flag: '\u{1F1EA}\u{1F1FA}', name: 'Euro', basePrice: 0.9230, pipSize: 0.0001, spreadPips: 1.2 },
  { id: 'USDC_GBPC', base: 'USDC', quote: 'GBPC', symbol: 'USDC/GBPC', flag: '\u{1F1EC}\u{1F1E7}', name: 'British Pound', basePrice: 0.7890, pipSize: 0.0001, spreadPips: 1.5 },
  { id: 'USDC_JPYC', base: 'USDC', quote: 'JPYC', symbol: 'USDC/JPYC', flag: '\u{1F1EF}\u{1F1F5}', name: 'Japanese Yen', basePrice: 154.50, pipSize: 0.01, spreadPips: 1.0 },
  { id: 'USDC_AUDC', base: 'USDC', quote: 'AUDC', symbol: 'USDC/AUDC', flag: '\u{1F1E6}\u{1F1FA}', name: 'Australian Dollar', basePrice: 1.5380, pipSize: 0.0001, spreadPips: 1.8 },
  { id: 'USDC_CADC', base: 'USDC', quote: 'CADC', symbol: 'USDC/CADC', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canadian Dollar', basePrice: 1.3640, pipSize: 0.0001, spreadPips: 1.5 },
  { id: 'USDC_CHFC', base: 'USDC', quote: 'CHFC', symbol: 'USDC/CHFC', flag: '\u{1F1E8}\u{1F1ED}', name: 'Swiss Franc', basePrice: 0.8750, pipSize: 0.0001, spreadPips: 1.3 },
];

// ── Pools ────────────────────────────────────────────────────────────────────

export type ForexPoolType = 'clearing' | 'hedging' | 'insurance';

export interface ForexPool {
  id: ForexPoolType;
  nameKey: string;
  descriptionKey: string;
  allocation: number;
  totalSize: number;
  utilization: number;
  color: string;
  apy7d: number;
  apy30d: number;
  netFlow24h: number;
  txCount24h: number;
  txCountTotal: number;
  totalDeposits: number;
  totalWithdrawals: number;
  profitDistributed: number;
  lastUpdated: number;
}

export const FOREX_POOL_DEFAULTS: ForexPool[] = [
  { id: 'clearing',  nameKey: 'forex.pool_clearing',  descriptionKey: 'forex.pool_clearing_desc',  allocation: 0.50, totalSize: 12500000, utilization: 0.78, color: '#3B82F6', apy7d: 12.8, apy30d: 11.5, netFlow24h: 185000, txCount24h: 42, txCountTotal: 12840, totalDeposits: 45200000, totalWithdrawals: 32700000, profitDistributed: 1850000, lastUpdated: Date.now() },
  { id: 'hedging',   nameKey: 'forex.pool_hedging',   descriptionKey: 'forex.pool_hedging_desc',   allocation: 0.30, totalSize: 7500000,  utilization: 0.65, color: '#F59E0B', apy7d: 8.1, apy30d: 7.6, netFlow24h: 72000, txCount24h: 24, txCountTotal: 7620, totalDeposits: 28500000, totalWithdrawals: 21000000, profitDistributed: 980000, lastUpdated: Date.now() },
  { id: 'insurance', nameKey: 'forex.pool_insurance', descriptionKey: 'forex.pool_insurance_desc', allocation: 0.20, totalSize: 5000000,  utilization: 0.42, color: '#10B981', apy7d: 4.8, apy30d: 4.5, netFlow24h: 35000, txCount24h: 14, txCountTotal: 4280, totalDeposits: 15800000, totalWithdrawals: 10800000, profitDistributed: 520000, lastUpdated: Date.now() },
];

// ── Pool Transactions ────────────────────────────────────────────────────────

export type ForexPoolTransactionType =
  | 'deposit' | 'withdrawal' | 'profit_distribution'
  | 'loss_absorption' | 'inter_pool_transfer' | 'fee_collection' | 'reserve_rebalance';

export interface ForexPoolTransaction {
  id: string;
  poolId: ForexPoolType;
  type: ForexPoolTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  description: string;
}

// ── Pool Daily Snapshots ────────────────────────────────────────────────────

export interface ForexPoolDailySnapshot {
  poolId: ForexPoolType;
  date: string;
  openBalance: number;
  closeBalance: number;
  deposits: number;
  withdrawals: number;
  netFlow: number;
  dailyPnl: number;
  dailyPnlPct: number;
  cumulativePnl: number;
  utilization: number;
  txCount: number;
  activeUsers: number;
}

// ── Positions ────────────────────────────────────────────────────────────────

export interface ForexPosition {
  id: string;
  pairId: string;
  side: 'BUY' | 'SELL';
  lots: number;
  pips: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  openTime: number;
}

// ── Investment ───────────────────────────────────────────────────────────────

export interface ForexInvestment {
  id: string;
  userId?: string;
  amount: number;
  currentValue: number;
  profit: number;
  status: 'active' | 'completed' | 'pending' | 'redeemed' | 'cancelled';
  selectedPairs: string[];
  cycleDays: number;
  cycleOption: ForexCycleOption;
  feeRate?: number;
  commissionRate?: number;
  startDate: string;
  endDate: string;
  tradingCapital: number;
  totalPoolReserves: number;
  poolAllocations: {
    clearing: number;
    hedging: number;
    insurance: number;
  };
  tradeWeight: number;
  totalLots: number;
  totalPips: number;
  totalTrades: number;
  positions: ForexPosition[];
  tradeHistory: ForexTradeRecord[];
  redeemedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Trade Records ────────────────────────────────────────────────────────────

export type ForexTradeStatus = 'RFQ' | 'QUOTED' | 'MATCHED' | 'SETTLED' | 'FAILED';

export interface ForexTradeRecord {
  id: string;
  timestamp: number;
  pairId: string;
  pairSymbol: string;
  side: 'BUY' | 'SELL';
  rfqPrice: number;
  quotePrice: number;
  matchPrice: number;
  settlePrice: number;
  lots: number;
  pips: number;
  pnl: number;
  status: ForexTradeStatus;
  pvpSettled: boolean;
  clearingFee?: number;
  hedgingCost?: number;
  insuranceReserve?: number;
  txHash?: string;
  blockNumber?: number;
  cycleDay?: number;
  cumulativePnl?: number;
}

// ── Console Log Types ────────────────────────────────────────────────────────

export type ForexLogType =
  | 'RFQ' | 'QUOTE' | 'MATCH' | 'SETTLE' | 'PVP'
  | 'HEDGE' | 'CLEAR' | 'POSITION' | 'PNL' | 'SYSTEM';

export interface ForexLogEntry {
  id: string;
  timestamp: number;
  type: ForexLogType;
  message: string;
  data?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
  pairId?: string;
}

// ── Agent ────────────────────────────────────────────────────────────────────

export interface ForexAgent {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  supportedPairs: string[];
  dailyRoiMin: number;
  dailyRoiMax: number;
  totalManaged: number;
  totalUsers: number;
  winRate: number;
}

export const FOREX_AGENT: ForexAgent = {
  id: 'stablefx-01',
  nameKey: 'forex.agent_name',
  descriptionKey: 'forex.agent_description',
  icon: '\u{1F4B1}',
  color: '#0EA5E9',
  supportedPairs: FOREX_CURRENCY_PAIRS.map(p => p.id),
  dailyRoiMin: 0.002,
  dailyRoiMax: 0.005,
  totalManaged: 25000000,
  totalUsers: 3847,
  winRate: 72.5,
};

// ── Profit Calculation ───────────────────────────────────────────────────────

export function calculateForexNetProfit(
  grossProfit: number,
  cycleOption: ForexCycleOption,
): { feeAmount: number; postFeeProfit: number; netProfit: number } {
  const feeAmount = grossProfit * cycleOption.feeRate;
  const postFeeProfit = grossProfit - feeAmount;
  const netProfit = postFeeProfit * cycleOption.commissionRate;
  return { feeAmount, postFeeProfit, netProfit };
}

export function estimateForexProfit(
  amount: number,
  cycleDays: number,
  agent: ForexAgent = FOREX_AGENT,
): { grossProfit: number; feeAmount: number; netProfit: number; dailyRate: number } {
  const cycleOption = FOREX_CYCLE_OPTIONS.find(c => c.days === cycleDays) || FOREX_CYCLE_OPTIONS[0];
  const estimatedApy = ((agent.dailyRoiMin + agent.dailyRoiMax) / 2) * 365 * 100;
  const dailyRate = estimatedApy / 100 / 365;
  const grossProfit = amount * dailyRate * cycleDays;
  const { feeAmount, netProfit } = calculateForexNetProfit(grossProfit, cycleOption);
  return { grossProfit, feeAmount, netProfit, dailyRate };
}
