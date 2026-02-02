// ══════════════════════════════════════════════════════════════════════════════
// ONE SDK - AI Trading Types & Constants
// Shared types for AI-powered crypto trading strategies
// ══════════════════════════════════════════════════════════════════════════════

export type StrategyCategory = 'conservative' | 'balanced' | 'aggressive' | 'hedge' | 'arbitrage' | 'trend' | 'grid' | 'dca';
export type OrderStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'pending_redemption' | 'redeemed';
export type TradeAction = 'buy' | 'sell' | 'long' | 'short' | 'close_long' | 'close_short';
export type TradeStatus = 'open' | 'closed' | 'liquidated' | 'cancelled';
export type FeeType = 'management' | 'performance' | 'withdrawal' | 'early_redemption_penalty';
export type OrderEventType = 'created' | 'activated' | 'paused' | 'resumed' | 'redemption_requested' | 'redeemed' | 'cancelled' | 'fee_deducted' | 'profit_realized';

export interface AIStrategyConfig {
  id: string;
  name: string;
  description: string | null;
  category: StrategyCategory;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  minInvestment: number;
  maxInvestment: number | null;
  lockPeriodDays: number;
  expectedApyMin: number | null;
  expectedApyMax: number | null;
  managementFeeRate: number;
  performanceFeeRate: number;
  supportedPairs: string[];
  supportedChains: string[];
  supportedCurrencies: string[];
  leverageMin: number;
  leverageMax: number;
  isActive: boolean;
}

export interface AIOrderCreateInput {
  strategyId: string;
  amount: number;
  currency: string;
  chain: string;
  lockPeriodDays: number;
}

export interface AIOrderSummary {
  orderId: string;
  strategyId: string;
  strategyName: string;
  amount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  status: OrderStatus;
  daysRemaining: number;
  lockProgress: number;
}

export interface AIPortfolioSummary {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  activeOrders: number;
  totalTrades: number;
  profitToday: number;
  profit7d: number;
  profit30d: number;
}

export interface AITradeLog {
  id: string;
  timestamp: string;
  action: TradeAction;
  pair: string;
  entryPrice: number;
  exitPrice: number | null;
  amount: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  status: TradeStatus;
  aiConfidence: number | null;
  aiReasoning: string | null;
}

export interface AIPenaltyCalculation {
  completionRate: number;
  penaltyRate: number;
  estimatedPenalty: number;
  estimatedRedemption: number;
  isEarlyWithdrawal: boolean;
}

export interface AIPerformanceChart {
  date: string;
  nav: number;
  dailyPnl: number;
  cumulativePnl: number;
}

export const PENALTY_TIERS = [
  { minProgress: 0.75, maxProgress: 1.0, rate: 0.50, label: '50%' },
  { minProgress: 0.50, maxProgress: 0.75, rate: 0.60, label: '60%' },
  { minProgress: 0.25, maxProgress: 0.50, rate: 0.70, label: '70%' },
  { minProgress: 0.00, maxProgress: 0.25, rate: 0.80, label: '80%' },
] as const;

export function calculateEarlyWithdrawalPenalty(
  investedAmount: number,
  profit: number,
  lockProgress: number,
): AIPenaltyCalculation {
  const totalValue = investedAmount + profit;
  const isEarlyWithdrawal = lockProgress < 1.0;
  let penaltyRate = 0;
  if (isEarlyWithdrawal) {
    if (lockProgress >= 0.75) penaltyRate = 0.50;
    else if (lockProgress >= 0.50) penaltyRate = 0.60;
    else if (lockProgress >= 0.25) penaltyRate = 0.70;
    else penaltyRate = 0.80;
  }
  const estimatedPenalty = totalValue * penaltyRate;
  const estimatedRedemption = totalValue - estimatedPenalty;
  return { completionRate: lockProgress, penaltyRate, estimatedPenalty, estimatedRedemption, isEarlyWithdrawal };
}

export const STRATEGY_CATEGORIES: Record<StrategyCategory, { labelKey: string; color: string; icon: string }> = {
  conservative: { labelKey: 'ai.category_conservative', color: '#10B981', icon: '\u{1F6E1}\u{FE0F}' },
  balanced: { labelKey: 'ai.category_balanced', color: '#3B82F6', icon: '\u{2696}\u{FE0F}' },
  aggressive: { labelKey: 'ai.category_aggressive', color: '#EF4444', icon: '\u{1F680}' },
  hedge: { labelKey: 'ai.category_hedge', color: '#8B5CF6', icon: '\u{1F512}' },
  arbitrage: { labelKey: 'ai.category_arbitrage', color: '#F59E0B', icon: '\u{26A1}' },
  trend: { labelKey: 'ai.category_trend', color: '#EC4899', icon: '\u{1F4C8}' },
  grid: { labelKey: 'ai.category_grid', color: '#6366F1', icon: '\u{25A6}' },
  dca: { labelKey: 'ai.category_dca', color: '#14B8A6', icon: '\u{1F4CA}' },
};

export const RISK_LEVELS: Record<number, { labelKey: string; color: string; bgColor: string }> = {
  1: { labelKey: 'ai.risk_very_low', color: '#10B981', bgColor: '#D1FAE5' },
  2: { labelKey: 'ai.risk_low', color: '#22C55E', bgColor: '#DCFCE7' },
  3: { labelKey: 'ai.risk_medium', color: '#F59E0B', bgColor: '#FEF3C7' },
  4: { labelKey: 'ai.risk_high', color: '#F97316', bgColor: '#FFEDD5' },
  5: { labelKey: 'ai.risk_very_high', color: '#EF4444', bgColor: '#FEE2E2' },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { labelKey: string; color: string; bgColor: string }> = {
  pending: { labelKey: 'ai.status_pending', color: '#F59E0B', bgColor: '#FEF3C7' },
  active: { labelKey: 'ai.status_active', color: '#10B981', bgColor: '#D1FAE5' },
  paused: { labelKey: 'ai.status_paused', color: '#6B7280', bgColor: '#F3F4F6' },
  completed: { labelKey: 'ai.status_completed', color: '#3B82F6', bgColor: '#DBEAFE' },
  cancelled: { labelKey: 'ai.status_cancelled', color: '#EF4444', bgColor: '#FEE2E2' },
  pending_redemption: { labelKey: 'ai.status_pending_redemption', color: '#8B5CF6', bgColor: '#EDE9FE' },
  redeemed: { labelKey: 'ai.status_redeemed', color: '#14B8A6', bgColor: '#CCFBF1' },
};
