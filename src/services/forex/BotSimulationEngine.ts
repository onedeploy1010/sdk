// BotSimulationEngine.ts - Core simulation engine for trading bot console
// Runs independent simulation loops for each strategy bot with distinct personalities

// ── Types ──────────────────────────────────────────────────────────────────────

export type BotLogType =
  | 'SCAN'
  | 'INDICATOR'
  | 'NEWS'
  | 'SIGNAL'
  | 'ANALYSIS'
  | 'DECISION'
  | 'ORDER'
  | 'FILLED'
  | 'PNL'
  | 'RISK'
  | 'SYSTEM'
  | 'STRATEGY'    // Strategy reasoning and context
  | 'THINKING';   // AI thinking process

export interface BotLogEntry {
  id: string;
  timestamp: number;
  strategyId: string;
  strategyName: string;
  type: BotLogType;
  message: string;
  data?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema: { short: number; long: number; crossover: 'golden' | 'death' | 'none' };
  bollinger: { upper: number; middle: number; lower: number; width: number; position: number };
  volume: { current: number; average: number; ratio: number };
}

export interface BotState {
  strategyId: string;
  strategyName: string;
  isRunning: boolean;
  currentPair: string;
  currentPrice: number;
  indicators: IndicatorSnapshot;
  openPositions: OpenPosition[];
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  lastSignal: string;
  lastSignalConfidence: number;
}

interface OpenPosition {
  id: string;
  pair: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
}

export interface StrategyPersonality {
  id: string;
  name: string;
  shortName: string;
  color: string;
  scanIntervalMin: number;
  scanIntervalMax: number;
  tradeFrequency: number;
  positionSizeMin: number;
  positionSizeMax: number;
  leverageMin: number;
  leverageMax: number;
  primaryIndicators: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  preferredPairs: string[];
  rsiBias: number;
  // Yield configuration
  tier: InvestmentTier;
  dailyYieldMin: number;  // Min daily interest rate (%)
  dailyYieldMax: number;  // Max daily interest rate (%)
  description: string;
  category: StrategyCategory;
}

export type StrategyCategory =
  | 'conservative'    // 保守型 - 稳健收益
  | 'balanced'        // 平衡型 - 风险收益均衡
  | 'growth'          // 成长型 - 较高收益
  | 'aggressive'      // 激进型 - 高风险高收益
  | 'quantitative';   // 量化型 - AI驱动

export type InvestmentTier = 'starter' | 'basic' | 'standard' | 'premium' | 'elite' | 'vip';

// ── Investment Tier Configuration ─────────────────────────────────────────────

export interface TierConfig {
  id: InvestmentTier;
  name: string;
  nameCn: string;
  minInvestment: number;
  maxInvestment: number;
  color: string;
  icon: string;
}

export const INVESTMENT_TIERS: Record<InvestmentTier, TierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    nameCn: '入门版',
    minInvestment: 100,
    maxInvestment: 999,
    color: '#6B7280',
    icon: '🌱',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    nameCn: '基础版',
    minInvestment: 1000,
    maxInvestment: 4999,
    color: '#3B82F6',
    icon: '📊',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    nameCn: '标准版',
    minInvestment: 5000,
    maxInvestment: 19999,
    color: '#10B981',
    icon: '💎',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    nameCn: '高级版',
    minInvestment: 20000,
    maxInvestment: 49999,
    color: '#8B5CF6',
    icon: '👑',
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    nameCn: '精英版',
    minInvestment: 50000,
    maxInvestment: 99999,
    color: '#F59E0B',
    icon: '🏆',
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    nameCn: 'VIP专属',
    minInvestment: 100000,
    maxInvestment: Infinity,
    color: '#EF4444',
    icon: '🔥',
  },
};

// ── Investment Cycle Configuration ────────────────────────────────────────────

export interface CycleConfig {
  id: string;
  days: number;
  name: string;
  nameCn: string;
  profitSharePercent: number;  // Platform takes this %, user gets (100 - this)%
  bonusMultiplier: number;     // Bonus yield multiplier for longer cycles
  earlyWithdrawPenalty: number; // Penalty % for early withdrawal
}

export const INVESTMENT_CYCLES: CycleConfig[] = [
  {
    id: 'flexible',
    days: 0,
    name: 'Flexible',
    nameCn: '灵活期',
    profitSharePercent: 30,    // Platform 30%, User 70%
    bonusMultiplier: 1.0,
    earlyWithdrawPenalty: 0,
  },
  {
    id: 'week',
    days: 7,
    name: '7 Days',
    nameCn: '7天期',
    profitSharePercent: 25,    // Platform 25%, User 75%
    bonusMultiplier: 1.1,
    earlyWithdrawPenalty: 5,
  },
  {
    id: 'biweek',
    days: 14,
    name: '14 Days',
    nameCn: '14天期',
    profitSharePercent: 22,    // Platform 22%, User 78%
    bonusMultiplier: 1.2,
    earlyWithdrawPenalty: 8,
  },
  {
    id: 'month',
    days: 30,
    name: '30 Days',
    nameCn: '30天期',
    profitSharePercent: 20,    // Platform 20%, User 80%
    bonusMultiplier: 1.35,
    earlyWithdrawPenalty: 10,
  },
  {
    id: 'quarter',
    days: 90,
    name: '90 Days',
    nameCn: '90天期',
    profitSharePercent: 15,    // Platform 15%, User 85%
    bonusMultiplier: 1.5,
    earlyWithdrawPenalty: 15,
  },
  {
    id: 'halfyear',
    days: 180,
    name: '180 Days',
    nameCn: '180天期',
    profitSharePercent: 12,    // Platform 12%, User 88%
    bonusMultiplier: 1.8,
    earlyWithdrawPenalty: 20,
  },
  {
    id: 'year',
    days: 365,
    name: '365 Days',
    nameCn: '365天期',
    profitSharePercent: 10,    // Platform 10%, User 90%
    bonusMultiplier: 2.0,
    earlyWithdrawPenalty: 25,
  },
];

// ── Yield Calculator ──────────────────────────────────────────────────────────

export function calculateDailyYield(
  strategy: StrategyPersonality,
  tier: InvestmentTier,
  cycle: CycleConfig
): { grossYield: number; netYield: number; platformFee: number } {
  // Base yield from strategy
  const baseYield = (strategy.dailyYieldMin + strategy.dailyYieldMax) / 2;

  // Tier bonus (higher tiers get slightly better rates)
  const tierBonuses: Record<InvestmentTier, number> = {
    starter: 0,
    basic: 0.02,
    standard: 0.05,
    premium: 0.08,
    elite: 0.12,
    vip: 0.15,
  };

  // Calculate gross yield with bonuses
  const grossYield = baseYield * cycle.bonusMultiplier * (1 + tierBonuses[tier]);

  // Calculate platform fee and net yield
  const platformFee = grossYield * (cycle.profitSharePercent / 100);
  const netYield = grossYield - platformFee;

  return { grossYield, netYield, platformFee };
}

export function estimateReturns(
  principal: number,
  strategy: StrategyPersonality,
  tier: InvestmentTier,
  cycle: CycleConfig
): {
  dailyReturn: number;
  totalReturn: number;
  finalAmount: number;
  platformProfit: number;
  userProfit: number;
  apr: number;
} {
  const { netYield, platformFee } = calculateDailyYield(strategy, tier, cycle);
  const days = cycle.days || 30; // Default to 30 days for flexible

  const dailyReturn = principal * (netYield / 100);
  const totalReturn = dailyReturn * days;
  const finalAmount = principal + totalReturn;
  const platformProfit = principal * (platformFee / 100) * days;
  const userProfit = totalReturn;
  const apr = netYield * 365;

  return { dailyReturn, totalReturn, finalAmount, platformProfit, userProfit, apr };
}

type LogCallback = (entry: BotLogEntry) => void;

// ── Strategy Personalities ─────────────────────────────────────────────────────

export const STRATEGY_PERSONALITIES: StrategyPersonality[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSERVATIVE STRATEGIES (保守型) - Low risk, stable returns
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'stable-yield-01',
    name: 'Stable Yield',
    shortName: 'STB',
    color: '#6B7280',
    scanIntervalMin: 120000,
    scanIntervalMax: 180000,
    tradeFrequency: 0.15,
    positionSizeMin: 5,
    positionSizeMax: 15,
    leverageMin: 1,
    leverageMax: 3,
    primaryIndicators: ['Bollinger', 'Volume'],
    riskTolerance: 'low',
    preferredPairs: ['BTC/USDT', 'ETH/USDT'],
    rsiBias: 45,
    tier: 'starter',
    dailyYieldMin: 0.15,
    dailyYieldMax: 0.25,
    description: '稳健收益策略，低风险低波动，适合新手入门',
    category: 'conservative',
  },
  {
    id: 'conservative-shield-01',
    name: 'Conservative Shield',
    shortName: 'CON',
    color: '#10B981',
    scanIntervalMin: 90000,
    scanIntervalMax: 150000,
    tradeFrequency: 0.25,
    positionSizeMin: 10,
    positionSizeMax: 20,
    leverageMin: 2,
    leverageMax: 5,
    primaryIndicators: ['Bollinger', 'Volume', 'RSI'],
    riskTolerance: 'low',
    preferredPairs: ['BTC/USDT', 'ETH/USDT'],
    rsiBias: 45,
    tier: 'basic',
    dailyYieldMin: 0.25,
    dailyYieldMax: 0.40,
    description: '保守防御策略，注重资金安全，稳定收益',
    category: 'conservative',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BALANCED STRATEGIES (平衡型) - Moderate risk, balanced returns
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'balanced-alpha-01',
    name: 'Balanced Alpha',
    shortName: 'BAL',
    color: '#3B82F6',
    scanIntervalMin: 75000,
    scanIntervalMax: 120000,
    tradeFrequency: 0.4,
    positionSizeMin: 15,
    positionSizeMax: 35,
    leverageMin: 3,
    leverageMax: 10,
    primaryIndicators: ['RSI', 'MACD'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    rsiBias: 50,
    tier: 'standard',
    dailyYieldMin: 0.40,
    dailyYieldMax: 0.65,
    description: '平衡型策略，风险收益均衡，适合稳健投资者',
    category: 'balanced',
  },
  {
    id: 'smart-rebalance-01',
    name: 'Smart Rebalance',
    shortName: 'SRB',
    color: '#06B6D4',
    scanIntervalMin: 80000,
    scanIntervalMax: 130000,
    tradeFrequency: 0.35,
    positionSizeMin: 12,
    positionSizeMax: 30,
    leverageMin: 3,
    leverageMax: 8,
    primaryIndicators: ['RSI', 'EMA', 'Volume'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'],
    rsiBias: 50,
    tier: 'standard',
    dailyYieldMin: 0.45,
    dailyYieldMax: 0.70,
    description: '智能再平衡策略，动态调整持仓，优化收益',
    category: 'balanced',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROWTH STRATEGIES (成长型) - Higher risk, higher returns
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'growth-momentum-01',
    name: 'Growth Momentum',
    shortName: 'GRO',
    color: '#8B5CF6',
    scanIntervalMin: 70000,
    scanIntervalMax: 110000,
    tradeFrequency: 0.45,
    positionSizeMin: 20,
    positionSizeMax: 40,
    leverageMin: 5,
    leverageMax: 12,
    primaryIndicators: ['RSI', 'MACD', 'EMA'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT'],
    rsiBias: 52,
    tier: 'premium',
    dailyYieldMin: 0.60,
    dailyYieldMax: 0.95,
    description: '成长动量策略，追求较高收益，适合有经验投资者',
    category: 'growth',
  },
  {
    id: 'trend-hunter-01',
    name: 'Trend Hunter',
    shortName: 'TRH',
    color: '#EC4899',
    scanIntervalMin: 65000,
    scanIntervalMax: 100000,
    tradeFrequency: 0.48,
    positionSizeMin: 22,
    positionSizeMax: 42,
    leverageMin: 5,
    leverageMax: 15,
    primaryIndicators: ['EMA', 'MACD', 'Volume', 'Bollinger'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT', 'OP/USDT'],
    rsiBias: 53,
    tier: 'premium',
    dailyYieldMin: 0.65,
    dailyYieldMax: 1.00,
    description: '趋势猎手策略，捕捉市场趋势，追求超额收益',
    category: 'growth',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AGGRESSIVE STRATEGIES (激进型) - High risk, high returns
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'aggressive-momentum-01',
    name: 'Aggressive Momentum',
    shortName: 'AGG',
    color: '#EF4444',
    scanIntervalMin: 60000,
    scanIntervalMax: 100000,
    tradeFrequency: 0.5,
    positionSizeMin: 25,
    positionSizeMax: 50,
    leverageMin: 5,
    leverageMax: 20,
    primaryIndicators: ['RSI', 'MACD', 'EMA', 'Volume'],
    riskTolerance: 'high',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'AVAX/USDT'],
    rsiBias: 55,
    tier: 'elite',
    dailyYieldMin: 0.85,
    dailyYieldMax: 1.40,
    description: '激进动量策略，高风险高收益，适合风险承受能力强的投资者',
    category: 'aggressive',
  },
  {
    id: 'leverage-maximizer-01',
    name: 'Leverage Maximizer',
    shortName: 'LEV',
    color: '#F97316',
    scanIntervalMin: 55000,
    scanIntervalMax: 90000,
    tradeFrequency: 0.55,
    positionSizeMin: 30,
    positionSizeMax: 55,
    leverageMin: 10,
    leverageMax: 25,
    primaryIndicators: ['RSI', 'MACD', 'EMA', 'Volume', 'Bollinger'],
    riskTolerance: 'high',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'AVAX/USDT', 'ARB/USDT'],
    rsiBias: 55,
    tier: 'elite',
    dailyYieldMin: 1.00,
    dailyYieldMax: 1.80,
    description: '杠杆最大化策略，追求极致收益，需要专业投资经验',
    category: 'aggressive',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUANTITATIVE STRATEGIES (量化型) - AI-driven, advanced algorithms
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ai-quant-alpha-01',
    name: 'AI Quant Alpha',
    shortName: 'AQA',
    color: '#A855F7',
    scanIntervalMin: 70000,
    scanIntervalMax: 110000,
    tradeFrequency: 0.42,
    positionSizeMin: 18,
    positionSizeMax: 38,
    leverageMin: 4,
    leverageMax: 12,
    primaryIndicators: ['RSI', 'MACD', 'EMA', 'Volume', 'Bollinger'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'],
    rsiBias: 51,
    tier: 'premium',
    dailyYieldMin: 0.70,
    dailyYieldMax: 1.10,
    description: 'AI量化Alpha策略，机器学习驱动，智能风控',
    category: 'quantitative',
  },
  {
    id: 'neural-trader-01',
    name: 'Neural Trader',
    shortName: 'NRT',
    color: '#14B8A6',
    scanIntervalMin: 70000,
    scanIntervalMax: 105000,
    tradeFrequency: 0.44,
    positionSizeMin: 20,
    positionSizeMax: 40,
    leverageMin: 5,
    leverageMax: 15,
    primaryIndicators: ['RSI', 'MACD', 'EMA', 'Volume', 'Bollinger'],
    riskTolerance: 'medium',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'LINK/USDT'],
    rsiBias: 52,
    tier: 'elite',
    dailyYieldMin: 0.80,
    dailyYieldMax: 1.25,
    description: '神经网络交易策略，深度学习模型，自适应市场',
    category: 'quantitative',
  },
  {
    id: 'quantum-edge-01',
    name: 'Quantum Edge',
    shortName: 'QTE',
    color: '#6366F1',
    scanIntervalMin: 60000,
    scanIntervalMax: 100000,
    tradeFrequency: 0.5,
    positionSizeMin: 25,
    positionSizeMax: 50,
    leverageMin: 8,
    leverageMax: 20,
    primaryIndicators: ['RSI', 'MACD', 'EMA', 'Volume', 'Bollinger'],
    riskTolerance: 'high',
    preferredPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVAX/USDT', 'ARB/USDT', 'OP/USDT'],
    rsiBias: 54,
    tier: 'vip',
    dailyYieldMin: 1.20,
    dailyYieldMax: 2.00,
    description: 'VIP量子优势策略，顶级AI算法，极致收益追求',
    category: 'quantitative',
  },
];

// ── Trading pairs with base prices ─────────────────────────────────────────────

const PAIR_PRICES: Record<string, number> = {
  'BTC/USDT': 67500,
  'ETH/USDT': 3450,
  'BNB/USDT': 605,
  'SOL/USDT': 178,
  'XRP/USDT': 0.62,
  'DOGE/USDT': 0.165,
  'ADA/USDT': 0.45,
  'AVAX/USDT': 38.5,
  'ARB/USDT': 1.18,
  'MATIC/USDT': 0.72,
  'LINK/USDT': 14.5,
  'UNI/USDT': 7.8,
  'AAVE/USDT': 92,
  'OP/USDT': 2.45,
  'APT/USDT': 8.9,
  'INJ/USDT': 24.5,
  'TIA/USDT': 11.2,
  'SUI/USDT': 1.65,
  'DOT/USDT': 7.2,
  'ATOM/USDT': 9.8,
  'FIL/USDT': 5.6,
  'LTC/USDT': 72,
  'NEAR/USDT': 5.1,
  'FTM/USDT': 0.42,
};

const CHAIN_INFO: Record<string, { name: string; shortName: string; icon: string }> = {
  ethereum: { name: 'Ethereum', shortName: 'ETH', icon: 'Ξ' },
  arbitrum: { name: 'Arbitrum', shortName: 'ARB', icon: '◆' },
  bsc: { name: 'BSC', shortName: 'BSC', icon: '◆' },
  base: { name: 'Base', shortName: 'BASE', icon: '●' },
  polygon: { name: 'Polygon', shortName: 'POLY', icon: '⬡' },
  optimism: { name: 'Optimism', shortName: 'OP', icon: '◉' },
  avalanche: { name: 'Avalanche', shortName: 'AVAX', icon: '▲' },
  linea: { name: 'Linea', shortName: 'LINEA', icon: '═' },
  zksync: { name: 'zkSync', shortName: 'ZK', icon: '⬢' },
  scroll: { name: 'Scroll', shortName: 'SCRL', icon: '◎' },
};

const NEWS_HEADLINES = [
  'Fed signals potential rate pause, crypto markets react positively',
  'Major institutional investor increases BTC allocation by 15%',
  'On-chain data shows whale accumulation pattern forming',
  'DeFi TVL reaches new monthly high across major protocols',
  'Exchange outflows surge as holders move to cold storage',
  'Options market signals increased volatility expected this week',
  'Mining difficulty adjustment approaching, hash rate stable',
  'Regulatory clarity in EU boosts market sentiment',
  'Stablecoin supply expanding, potential bullish indicator',
  'Social sentiment score shifts to extreme greed zone',
  'Cross-chain bridge volume hits record daily high',
  'Layer 2 adoption metrics show 40% MoM growth',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

let idCounter = 0;
function genId(): string {
  return `log_${Date.now()}_${++idCounter}`;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(5);
}

// ── Engine ─────────────────────────────────────────────────────────────────────

class BotSimulationEngine {
  private listeners: LogCallback[] = [];
  private botTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private botStates: Map<string, BotState> = new Map();
  private priceState: Map<string, number> = new Map();
  private indicatorState: Map<string, IndicatorSnapshot> = new Map();
  private running = false;
  private userPairs: string[] = [];
  private userChains: string[] = [];

  constructor() {
    // Initialize prices with some jitter
    for (const [pair, base] of Object.entries(PAIR_PRICES)) {
      this.priceState.set(pair, base * (1 + rand(-0.02, 0.02)));
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  getStrategies(): StrategyPersonality[] {
    return STRATEGY_PERSONALITIES;
  }

  start(strategyIds?: string[], userPairs?: string[], userChains?: string[]): void {
    this.running = true;
    // Convert pair IDs (e.g. 'BTC') to full symbols (e.g. 'BTC/USDT') if needed
    this.userPairs = (userPairs || [])
      .map(p => p.includes('/') ? p : `${p}/USDT`)
      .filter(p => p in PAIR_PRICES);
    this.userChains = (userChains || []).filter(c => c in CHAIN_INFO);
    const strategies = strategyIds
      ? STRATEGY_PERSONALITIES.filter(s => strategyIds.includes(s.id))
      : STRATEGY_PERSONALITIES;

    for (const strategy of strategies) {
      this.initBotState(strategy);
      this.scheduleCycle(strategy);
    }
  }

  stop(strategyIds?: string[]): void {
    const ids = strategyIds || Array.from(this.botTimers.keys());
    for (const id of ids) {
      const timer = this.botTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.botTimers.delete(id);
      }
    }
    if (!strategyIds) {
      this.running = false;
    }
  }

  onLog(callback: LogCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  getBotState(strategyId: string): BotState | undefined {
    return this.botStates.get(strategyId);
  }

  getAllBotStates(): Map<string, BotState> {
    return this.botStates;
  }

  isRunning(): boolean {
    return this.running;
  }

  emitBootSequence(): void {
    // Pre-initialize all bot states immediately so UI shows correct count
    for (const strategy of STRATEGY_PERSONALITIES) {
      const pair = pick(strategy.preferredPairs);
      const price = this.priceState.get(pair) || PAIR_PRICES[pair] || 50000;
      const indicators = this.generateIndicators(strategy, price);
      this.indicatorState.set(strategy.id, indicators);
      this.botStates.set(strategy.id, {
        strategyId: strategy.id,
        strategyName: strategy.name,
        isRunning: true, // Mark as running during boot
        currentPair: pair,
        currentPrice: price,
        indicators,
        openPositions: [],
        totalPnl: 0,
        totalTrades: 0,
        winRate: 0.5,
        lastSignal: 'HOLD',
        lastSignalConfidence: 0,
      });
    }

    const bootMessages: Array<{ msg: string; delay: number }> = [
      { msg: 'Initializing ONE Trading Engine v3.2.1...', delay: 0 },
      { msg: 'Loading market data feeds...', delay: 500 },
      { msg: 'Connecting to exchange WebSocket streams...', delay: 1200 },
      { msg: 'Calibrating indicator engines (RSI, MACD, EMA, Bollinger)...', delay: 2000 },
      { msg: `Loading ${STRATEGY_PERSONALITIES.length} strategy personalities...`, delay: 2800 },
      { msg: 'Risk management module initialized (max drawdown: 15%)', delay: 3600 },
      { msg: 'Portfolio allocation engine ready', delay: 4200 },
      { msg: '=== All systems online. Starting trading cycles ===', delay: 5000 },
    ];

    for (const { msg, delay } of bootMessages) {
      setTimeout(() => {
        this.emit({
          id: genId(),
          timestamp: Date.now(),
          strategyId: 'system',
          strategyName: 'SYSTEM',
          type: 'SYSTEM',
          message: msg,
          importance: 'medium',
        });
      }, delay);
    }
  }

  destroy(): void {
    this.stop();
    this.listeners = [];
    this.botStates.clear();
    this.priceState.clear();
    this.indicatorState.clear();
    this.userPairs = [];
    this.userChains = [];
  }

  // ── Private Methods ────────────────────────────────────────────────────────

  private emit(entry: BotLogEntry): void {
    for (const listener of this.listeners) {
      listener(entry);
    }
  }

  private getActivePairs(strategy: StrategyPersonality): string[] {
    return this.userPairs.length > 0 ? this.userPairs : strategy.preferredPairs;
  }

  private getActiveChain(): string {
    const chains = this.userChains.length > 0
      ? this.userChains
      : ['ethereum', 'arbitrum', 'bsc'];
    return pick(chains);
  }

  private getChainLabel(chainId: string): string {
    const info = CHAIN_INFO[chainId];
    return info ? info.shortName : chainId;
  }

  private initBotState(strategy: StrategyPersonality): void {
    const activePairs = this.getActivePairs(strategy);
    const pair = pick(activePairs);
    const price = this.priceState.get(pair) || PAIR_PRICES[pair] || 50000;
    const indicators = this.generateIndicators(strategy, price);
    this.indicatorState.set(strategy.id, indicators);

    this.botStates.set(strategy.id, {
      strategyId: strategy.id,
      strategyName: strategy.name,
      isRunning: true,
      currentPair: pair,
      currentPrice: price,
      indicators,
      openPositions: [],
      totalPnl: rand(-50, 200),
      totalTrades: randInt(5, 25),
      winRate: rand(0.48, 0.68),
      lastSignal: 'HOLD',
      lastSignalConfidence: 0,
    });
  }

  private scheduleCycle(strategy: StrategyPersonality): void {
    if (!this.running) return;
    const interval = rand(strategy.scanIntervalMin, strategy.scanIntervalMax);
    const timer = setTimeout(() => {
      if (this.running) {
        this.runBotCycle(strategy);
        this.scheduleCycle(strategy);
      }
    }, interval);
    this.botTimers.set(strategy.id, timer);
  }

  private async runBotCycle(strategy: StrategyPersonality): Promise<void> {
    const state = this.botStates.get(strategy.id);
    if (!state) return;

    const activePairs = this.getActivePairs(strategy);
    const pair = pick(activePairs);
    const price = this.simulatePrice(pair);
    const indicators = this.generateIndicators(strategy, price);
    this.indicatorState.set(strategy.id, indicators);

    state.currentPair = pair;
    state.currentPrice = price;
    state.indicators = indicators;

    const entries: Array<{ entry: Omit<BotLogEntry, 'id' | 'timestamp'>; delay: number }> = [];
    let delay = 0;

    // 1. SCAN - Always (slower delay)
    const chain = this.getActiveChain();
    const chainLabel = this.getChainLabel(chain);
    entries.push({
      entry: {
        strategyId: strategy.id,
        strategyName: strategy.shortName,
        type: 'SCAN',
        message: `Scanning ${pair} on ${chainLabel} | Price: $${formatPrice(price)}`,
        data: { pair, chain, chainLabel },
        importance: 'low',
      },
      delay,
    });
    delay += rand(4000, 6000);  // 4-6s after SCAN (slower)

    // 2. THINKING - AI reasoning process (new)
    const thinkingMessages = this.generateThinkingProcess(strategy, pair, price);
    for (const thinking of thinkingMessages) {
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'THINKING',
          message: thinking,
          importance: 'low',
        },
        delay,
      });
      delay += rand(3000, 5000);  // 3-5s between thoughts (slower)
    }

    // 3. INDICATOR - Always (slower delay)
    const indicatorParts = [];
    if (strategy.primaryIndicators.includes('RSI') || strategy.primaryIndicators.includes('MACD')) {
      indicatorParts.push(`RSI: ${indicators.rsi.toFixed(1)}`);
    }
    if (strategy.primaryIndicators.includes('MACD') || strategy.primaryIndicators.includes('RSI')) {
      indicatorParts.push(`MACD: ${indicators.macd.histogram > 0 ? '+' : ''}${indicators.macd.histogram.toFixed(3)}`);
    }
    if (strategy.primaryIndicators.includes('EMA')) {
      indicatorParts.push(`EMA: ${indicators.ema.short.toFixed(1)}/${indicators.ema.long.toFixed(1)}`);
      if (indicators.ema.crossover !== 'none') {
        indicatorParts.push(`[${indicators.ema.crossover.toUpperCase()} CROSS]`);
      }
    }
    if (strategy.primaryIndicators.includes('Bollinger')) {
      indicatorParts.push(`BB: ${indicators.bollinger.position.toFixed(1)}% width=${indicators.bollinger.width.toFixed(2)}`);
    }
    if (strategy.primaryIndicators.includes('Volume')) {
      indicatorParts.push(`Vol: ${indicators.volume.ratio.toFixed(2)}x avg`);
    }

    entries.push({
      entry: {
        strategyId: strategy.id,
        strategyName: strategy.shortName,
        type: 'INDICATOR',
        message: indicatorParts.join(' | '),
        data: { indicators },
        importance: 'low',
      },
      delay,
    });
    delay += rand(4000, 6000);  // 4-6s after INDICATOR (slower)

    // 4. NEWS - 8% chance (less frequent)
    if (Math.random() < 0.08) {
      const sentiment = Math.random() > 0.4 ? 'Bullish' : 'Bearish';
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'NEWS',
          message: `[${sentiment}] ${pick(NEWS_HEADLINES)}`,
          importance: 'medium',
        },
        delay,
      });
      delay += rand(5000, 8000);  // 5-8s after NEWS (slower)
    }

    // 5. ANALYSIS - 30% chance (less frequent)
    if (Math.random() < 0.30) {
      const analysis = this.generateAnalysis(strategy, indicators, pair);
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'ANALYSIS',
          message: analysis,
          importance: 'medium',
        },
        delay,
      });
      delay += rand(5000, 8000);  // 5-8s after ANALYSIS (slower)
    }

    // 6-10. Signal evaluation and potential trade
    const signal = this.evaluateSignal(strategy, indicators);
    state.lastSignal = signal.direction;
    state.lastSignalConfidence = signal.confidence;

    if (signal.direction !== 'HOLD') {
      // 6. STRATEGY - Show strategy reasoning context (NEW)
      const strategyContext = this.generateStrategyContext(strategy, signal, indicators, pair);
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'STRATEGY',
          message: strategyContext,
          data: {
            strategy: strategy.name,
            riskTolerance: strategy.riskTolerance,
            primaryIndicators: strategy.primaryIndicators,
            signal: signal.direction,
            confidence: signal.confidence,
          },
          importance: 'high',
        },
        delay,
      });
      delay += rand(5000, 8000);  // 5-8s after STRATEGY (slower)

      // 7. SIGNAL
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'SIGNAL',
          message: `${signal.direction} signal detected | Confidence: ${(signal.confidence * 100).toFixed(1)}% | ${signal.reason}`,
          data: { signal },
          importance: 'high',
        },
        delay,
      });
      delay += rand(5000, 7000);  // 5-7s after SIGNAL (slower)

      // 8. DECISION
      const decision = this.makeTradeDecision(strategy, signal, state);
      if (decision.execute) {
        entries.push({
          entry: {
            strategyId: strategy.id,
            strategyName: strategy.shortName,
            type: 'DECISION',
            message: `Execute ${signal.direction} | Size: ${decision.positionSize.toFixed(1)}% | Leverage: ${decision.leverage}x | Risk/Reward: 1:${decision.riskReward.toFixed(1)}`,
            data: {
              strategyName: strategy.name,
              strategyId: strategy.id,
              riskTolerance: strategy.riskTolerance,
              signalReason: signal.reason,
              confidence: signal.confidence,
            },
            importance: 'high',
          },
          delay,
        });
        delay += rand(2500, 4000);  // 2.5-4s after DECISION

        // 9. ORDER
        const orderId = `ORD_${Date.now().toString(36).toUpperCase()}`;
        const orderPrice = signal.direction === 'LONG'
          ? price * (1 - rand(0.0001, 0.0005))
          : price * (1 + rand(0.0001, 0.0005));

        entries.push({
          entry: {
            strategyId: strategy.id,
            strategyName: strategy.shortName,
            type: 'ORDER',
            message: `Submitting ${signal.direction} order | ${pair} @ $${formatPrice(orderPrice)} on ${chainLabel} | ID: ${orderId}`,
            data: {
              orderId,
              pair,
              side: signal.direction,
              price: orderPrice,
              leverage: decision.leverage,
              chain,
              chainLabel,
              strategyName: strategy.name,
              strategyContext: strategyContext,
              signalReason: signal.reason,
            },
            importance: 'high',
          },
          delay,
        });
        delay += rand(4000, 7000);  // 4-7s for order execution

        // 10. FILLED
        const fillPrice = orderPrice * (1 + rand(-0.0003, 0.0003));
        const slippage = Math.abs(fillPrice - orderPrice) / orderPrice * 100;
        entries.push({
          entry: {
            strategyId: strategy.id,
            strategyName: strategy.shortName,
            type: 'FILLED',
            message: `Order FILLED | ${pair} ${signal.direction} @ $${formatPrice(fillPrice)} on ${chainLabel} | Slippage: ${slippage.toFixed(4)}% | ID: ${orderId}`,
            data: {
              orderId,
              fillPrice,
              slippage,
              chain,
              chainLabel,
              strategyName: strategy.name,
              executedBy: strategy.id,
            },
            importance: 'high',
          },
          delay,
        });

        // Update state with new position
        const position: OpenPosition = {
          id: orderId,
          pair,
          side: signal.direction as 'LONG' | 'SHORT',
          entryPrice: fillPrice,
          currentPrice: price,
          size: decision.positionSize,
          leverage: decision.leverage,
          pnl: 0,
          pnlPercent: 0,
        };
        state.openPositions = [...state.openPositions.slice(-2), position];
        state.totalTrades++;
      } else {
        entries.push({
          entry: {
            strategyId: strategy.id,
            strategyName: strategy.shortName,
            type: 'DECISION',
            message: `SKIP - ${decision.reason}`,
            importance: 'medium',
          },
          delay,
        });
      }
    }

    // 11. PNL - Update open positions
    if (state.openPositions.length > 0 && Math.random() < 0.5) {
      delay += rand(3500, 5500);  // 3.5-5.5s before PNL
      let totalPositionPnl = 0;
      const pnlParts: string[] = [];

      for (const pos of state.openPositions) {
        pos.currentPrice = this.simulatePrice(pos.pair);
        const priceDiff = pos.side === 'LONG'
          ? (pos.currentPrice - pos.entryPrice) / pos.entryPrice
          : (pos.entryPrice - pos.currentPrice) / pos.entryPrice;
        pos.pnlPercent = priceDiff * pos.leverage * 100;
        pos.pnl = priceDiff * pos.leverage * pos.size;
        totalPositionPnl += pos.pnl;
        pnlParts.push(`${pos.pair} ${pos.side}: ${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}%`);
      }

      state.totalPnl += totalPositionPnl * rand(0.01, 0.05);

      // Sometimes close a position
      if (state.openPositions.length > 1 && Math.random() < 0.3) {
        const closed = state.openPositions.shift()!;
        const finalPnl = closed.pnlPercent;
        if (finalPnl > 0) {
          state.winRate = state.winRate * 0.95 + 0.05;
        } else {
          state.winRate = state.winRate * 0.95;
        }
        state.winRate = clamp(state.winRate, 0.35, 0.75);
        pnlParts.push(`CLOSED ${closed.pair}: ${finalPnl >= 0 ? '+' : ''}${finalPnl.toFixed(2)}%`);
      }

      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'PNL',
          message: pnlParts.join(' | '),
          data: { totalPnl: state.totalPnl, positions: state.openPositions.length },
          importance: 'medium',
        },
        delay,
      });
    }

    // 12. RISK - Periodic check
    if (Math.random() < 0.2) {
      delay += rand(3000, 5000);  // 3-5s before RISK
      const exposure = state.openPositions.reduce((sum, p) => sum + p.size * p.leverage, 0);
      const maxDrawdown = rand(2, 12);
      entries.push({
        entry: {
          strategyId: strategy.id,
          strategyName: strategy.shortName,
          type: 'RISK',
          message: `Portfolio exposure: ${exposure.toFixed(1)}% | Max drawdown: ${maxDrawdown.toFixed(1)}% | Open positions: ${state.openPositions.length} | Win rate: ${(state.winRate * 100).toFixed(1)}%`,
          importance: exposure > 80 ? 'high' : 'low',
        },
        delay,
      });
    }

    // Emit entries with delays
    for (const { entry, delay: d } of entries) {
      setTimeout(() => {
        if (this.running) {
          this.emit({
            ...entry,
            id: genId(),
            timestamp: Date.now(),
          });
        }
      }, d);
    }
  }

  private simulatePrice(pair: string): number {
    const current = this.priceState.get(pair) || PAIR_PRICES[pair] || 50000;
    const volatility = pair.includes('DOGE') ? 0.005 : pair.includes('BTC') ? 0.002 : 0.003;
    const drift = rand(-volatility, volatility);
    const newPrice = current * (1 + drift);
    this.priceState.set(pair, newPrice);
    return newPrice;
  }

  private generateIndicators(strategy: StrategyPersonality, price: number): IndicatorSnapshot {
    const prev = this.indicatorState.get(strategy.id);
    const prevRsi = prev?.rsi ?? strategy.rsiBias;

    // RSI: mean-reverting around bias
    const rsiMean = strategy.rsiBias;
    const rsiDrift = rand(-8, 8);
    const rsiReversion = (rsiMean - prevRsi) * 0.15;
    const rsi = clamp(prevRsi + rsiDrift + rsiReversion, 8, 95);

    // MACD: correlated with RSI
    const macdBias = rsi > 65 ? 0.3 : rsi < 35 ? -0.3 : 0;
    const prevHist = prev?.macd.histogram ?? 0;
    const histogram = clamp(prevHist * 0.7 + rand(-0.5, 0.5) + macdBias, -2, 2);
    const macdValue = histogram * rand(0.8, 1.5);
    const macdSignal = macdValue - histogram;

    // EMA: occasional crossovers
    const prevShort = prev?.ema.short ?? price;
    const prevLong = prev?.ema.long ?? price;
    const emaShort = prevShort * 0.9 + price * 0.1;
    const emaLong = prevLong * 0.95 + price * 0.05;
    let crossover: 'golden' | 'death' | 'none' = 'none';
    if (prevShort <= prevLong && emaShort > emaLong) crossover = 'golden';
    else if (prevShort >= prevLong && emaShort < emaLong) crossover = 'death';

    // Bollinger
    const bbMiddle = price;
    const bbWidth = price * rand(0.01, 0.04);
    const bbUpper = bbMiddle + bbWidth;
    const bbLower = bbMiddle - bbWidth;
    const bbPosition = ((price - bbLower) / (bbUpper - bbLower)) * 100;

    // Volume
    const volRatio = rand(0.3, 2.5);
    const volCurrent = rand(100000, 5000000);

    return {
      rsi,
      macd: { value: macdValue, signal: macdSignal, histogram },
      ema: { short: emaShort, long: emaLong, crossover },
      bollinger: { upper: bbUpper, middle: bbMiddle, lower: bbLower, width: bbWidth / price, position: bbPosition },
      volume: { current: volCurrent, average: volCurrent / volRatio, ratio: volRatio },
    };
  }

  private generateThinkingProcess(strategy: StrategyPersonality, pair: string, price: number): string[] {
    const thoughts: string[] = [];
    const pairBase = pair.split('/')[0];

    // Generate 1-3 thinking steps
    const thinkingTemplates = [
      `Analyzing ${pairBase} market structure...`,
      `Checking ${strategy.primaryIndicators.join(', ')} confluence...`,
      `Evaluating risk parameters for ${strategy.riskTolerance} tolerance...`,
      `Scanning order book depth at $${formatPrice(price)}...`,
      `Cross-referencing with historical patterns...`,
      `Calculating optimal entry zone...`,
      `Assessing market sentiment indicators...`,
      `Monitoring whale activity on ${pairBase}...`,
      `Comparing momentum across timeframes...`,
      `Validating support/resistance levels...`,
    ];

    const numThoughts = randInt(1, 3);
    const shuffled = [...thinkingTemplates].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numThoughts; i++) {
      thoughts.push(shuffled[i]);
    }

    return thoughts;
  }

  private generateStrategyContext(
    strategy: StrategyPersonality,
    signal: { direction: string; confidence: number; reason: string },
    indicators: IndicatorSnapshot,
    pair: string
  ): string {
    const contexts = [];

    // Strategy personality context
    contexts.push(`[${strategy.name}]`);

    // Risk context
    const riskLevel = strategy.riskTolerance === 'high' ? 'aggressive' : strategy.riskTolerance === 'low' ? 'conservative' : 'balanced';
    contexts.push(`Risk: ${riskLevel}`);

    // Key indicator that triggered
    if (indicators.rsi < 35 || indicators.rsi > 65) {
      contexts.push(`RSI ${indicators.rsi < 35 ? 'oversold' : 'overbought'} (${indicators.rsi.toFixed(1)})`);
    }
    if (indicators.ema.crossover !== 'none') {
      contexts.push(`EMA ${indicators.ema.crossover} cross`);
    }
    if (Math.abs(indicators.macd.histogram) > 0.3) {
      contexts.push(`MACD ${indicators.macd.histogram > 0 ? 'bullish' : 'bearish'} momentum`);
    }

    // Confidence interpretation
    const confLevel = signal.confidence > 0.7 ? 'HIGH' : signal.confidence > 0.5 ? 'MEDIUM' : 'LOW';
    contexts.push(`Confidence: ${confLevel}`);

    return contexts.join(' | ');
  }

  private generateAnalysis(strategy: StrategyPersonality, indicators: IndicatorSnapshot, pair: string): string {
    const analyses = [];

    if (indicators.rsi > 70) {
      analyses.push(`RSI at ${indicators.rsi.toFixed(1)} - overbought territory, watching for reversal`);
    } else if (indicators.rsi < 30) {
      analyses.push(`RSI at ${indicators.rsi.toFixed(1)} - oversold, potential bounce setup`);
    } else if (indicators.rsi > 55) {
      analyses.push(`RSI trending bullish at ${indicators.rsi.toFixed(1)}`);
    } else {
      analyses.push(`RSI neutral at ${indicators.rsi.toFixed(1)}, no clear direction`);
    }

    if (indicators.macd.histogram > 0.5) {
      analyses.push('MACD histogram expanding positive - momentum building');
    } else if (indicators.macd.histogram < -0.5) {
      analyses.push('MACD histogram expanding negative - bearish pressure');
    }

    if (indicators.ema.crossover === 'golden') {
      analyses.push('EMA golden cross detected - strong bullish signal');
    } else if (indicators.ema.crossover === 'death') {
      analyses.push('EMA death cross detected - bearish warning');
    }

    if (indicators.bollinger.position > 90) {
      analyses.push(`Price near upper Bollinger band (${indicators.bollinger.position.toFixed(0)}%) - potential resistance`);
    } else if (indicators.bollinger.position < 10) {
      analyses.push(`Price near lower Bollinger band (${indicators.bollinger.position.toFixed(0)}%) - potential support`);
    }

    if (indicators.volume.ratio > 1.8) {
      analyses.push(`Volume spike ${indicators.volume.ratio.toFixed(1)}x average - high activity`);
    }

    return analyses.length > 0 ? analyses.join(' | ') : `${pair} consolidating - waiting for clearer setup`;
  }

  private evaluateSignal(
    strategy: StrategyPersonality,
    indicators: IndicatorSnapshot,
  ): { direction: 'LONG' | 'SHORT' | 'HOLD'; confidence: number; reason: string } {
    let bullScore = 0;
    let bearScore = 0;
    const reasons: string[] = [];

    // RSI
    if (indicators.rsi < 30) { bullScore += 2; reasons.push('RSI oversold'); }
    else if (indicators.rsi < 40) { bullScore += 1; reasons.push('RSI low'); }
    else if (indicators.rsi > 70) { bearScore += 2; reasons.push('RSI overbought'); }
    else if (indicators.rsi > 60) { bearScore += 1; reasons.push('RSI high'); }

    // MACD
    if (indicators.macd.histogram > 0.3) { bullScore += 1.5; reasons.push('MACD bullish'); }
    else if (indicators.macd.histogram < -0.3) { bearScore += 1.5; reasons.push('MACD bearish'); }

    // EMA
    if (indicators.ema.crossover === 'golden') { bullScore += 2.5; reasons.push('Golden cross'); }
    else if (indicators.ema.crossover === 'death') { bearScore += 2.5; reasons.push('Death cross'); }
    else if (indicators.ema.short > indicators.ema.long) { bullScore += 0.5; }
    else { bearScore += 0.5; }

    // Bollinger
    if (indicators.bollinger.position < 15) { bullScore += 1; reasons.push('BB support'); }
    else if (indicators.bollinger.position > 85) { bearScore += 1; reasons.push('BB resistance'); }

    // Volume confirmation
    if (indicators.volume.ratio > 1.5) {
      if (bullScore > bearScore) bullScore += 1;
      else bearScore += 1;
      reasons.push('Volume confirms');
    }

    const netScore = bullScore - bearScore;
    const confidence = Math.min(Math.abs(netScore) / 6, 0.95);
    const threshold = strategy.riskTolerance === 'high' ? 1.5 : strategy.riskTolerance === 'medium' ? 2.0 : 2.5;

    // Apply trade frequency filter
    if (Math.random() > strategy.tradeFrequency) {
      return { direction: 'HOLD', confidence: 0, reason: 'Cycle skip' };
    }

    if (netScore > threshold) {
      return { direction: 'LONG', confidence, reason: reasons.slice(0, 3).join(', ') };
    } else if (netScore < -threshold) {
      return { direction: 'SHORT', confidence, reason: reasons.slice(0, 3).join(', ') };
    }

    return { direction: 'HOLD', confidence: 0, reason: 'No clear signal' };
  }

  private makeTradeDecision(
    strategy: StrategyPersonality,
    signal: { direction: string; confidence: number },
    state: BotState,
  ): { execute: boolean; positionSize: number; leverage: number; riskReward: number; reason: string } {
    // Check position limits
    if (state.openPositions.length >= 3) {
      return { execute: false, positionSize: 0, leverage: 0, riskReward: 0, reason: 'Max positions reached (3)' };
    }

    // Confidence threshold
    const minConfidence = strategy.riskTolerance === 'high' ? 0.3 : strategy.riskTolerance === 'medium' ? 0.45 : 0.6;
    if (signal.confidence < minConfidence) {
      return { execute: false, positionSize: 0, leverage: 0, riskReward: 0, reason: `Confidence too low (${(signal.confidence * 100).toFixed(0)}% < ${(minConfidence * 100).toFixed(0)}%)` };
    }

    const positionSize = rand(strategy.positionSizeMin, strategy.positionSizeMax);
    const leverage = randInt(strategy.leverageMin, strategy.leverageMax);
    const riskReward = rand(1.2, 3.5);

    return { execute: true, positionSize, leverage, riskReward, reason: '' };
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────────

export const botSimulationEngine = new BotSimulationEngine();
