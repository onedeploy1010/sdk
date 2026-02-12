// ══════════════════════════════════════════════════════════════════════════════
// ONE SDK - Trading Console Types & Constants
// Shared types for real-time trading console components
// ══════════════════════════════════════════════════════════════════════════════

import type { BotLogEntry, BotState, StrategyPersonality } from '../services/forex/BotSimulationEngine';
import type { ForexLogEntry, ForexPoolTransaction, ForexLogType } from './forex';

// ── Re-exports for convenience ────────────────────────────────────────────────

export type { BotLogEntry, BotLogType, BotState, IndicatorSnapshot, StrategyPersonality } from '../services/forex/BotSimulationEngine';

// ── Console Log Types ─────────────────────────────────────────────────────────

export type AILogType =
  | 'SCAN' | 'THINKING' | 'INDICATOR' | 'ANALYSIS' | 'SIGNAL'
  | 'STRATEGY' | 'DECISION' | 'ORDER' | 'FILLED' | 'PNL'
  | 'RISK' | 'NEWS' | 'SYSTEM';

export const AI_LOG_COLORS: Record<AILogType, string> = {
  SCAN: '#06B6D4',       // Cyan
  THINKING: '#A855F7',   // Purple
  INDICATOR: '#3B82F6',  // Blue
  ANALYSIS: '#6366F1',   // Indigo
  SIGNAL: '#F59E0B',     // Amber
  STRATEGY: '#D946EF',   // Fuchsia
  DECISION: '#F97316',   // Orange
  ORDER: '#EC4899',      // Pink
  FILLED: '#10B981',     // Green
  PNL: '#22C55E',        // Emerald
  RISK: '#EF4444',       // Red
  NEWS: '#14B8A6',       // Teal
  SYSTEM: '#9CA3AF',     // Gray
};

// Forex log type colors (for ForexSimulationEngine logs)
export const FOREX_LOG_COLORS: Record<ForexLogType, string> = {
  RFQ: '#06B6D4',       // Cyan
  QUOTE: '#8B5CF6',     // Purple
  MATCH: '#10B981',     // Green
  SETTLE: '#F59E0B',    // Amber
  PVP: '#3B82F6',       // Blue
  HEDGE: '#EC4899',     // Pink
  CLEAR: '#14B8A6',     // Teal
  POSITION: '#6366F1',  // Indigo
  PNL: '#22C55E',       // Emerald
  SYSTEM: '#9CA3AF',    // Gray
};

// ── AI Position Types ─────────────────────────────────────────────────────────

export type PositionSide = 'LONG' | 'SHORT';
export type PositionStatus = 'open' | 'closed' | 'liquidated' | 'pending';

export interface AIPosition {
  id: string;
  strategyId: string;
  strategyName: string;
  pair: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  margin: number;
  pnl: number;
  pnlPercent: number;
  status: PositionStatus;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice?: number;
  openTime: number;
  closeTime?: number;
  chain?: string;
  orderId?: string;
  aiConfidence?: number;
  aiReasoning?: string;
}

// ── AI Decision Types ─────────────────────────────────────────────────────────

export type DecisionAction = 'OPEN_LONG' | 'OPEN_SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT' | 'HOLD' | 'SKIP';

export interface AIDecision {
  id: string;
  timestamp: number;
  strategyId: string;
  strategyName: string;
  pair: string;
  action: DecisionAction;
  confidence: number;
  reasoning: string;
  indicators: {
    rsi?: number;
    macd?: number;
    ema?: string;
    volume?: number;
    bollinger?: string;
  };
  signals: string[];
  executed: boolean;
  positionId?: string;
  price?: number;
  size?: number;
  leverage?: number;
}

// ── Risk Status Types ─────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TradingStatus = 'active' | 'paused' | 'stopped' | 'cooldown';

export interface RiskStatus {
  timestamp: number;
  // Portfolio exposure
  totalExposure: number;
  maxExposure: number;
  exposurePercent: number;
  // Daily limits
  dailyPnl: number;
  dailyPnlLimit: number;
  dailyPnlPercent: number;
  dailyTradeCount: number;
  dailyTradeLimit: number;
  // Drawdown
  currentDrawdown: number;
  maxDrawdown: number;
  drawdownPercent: number;
  // Position limits
  openPositions: number;
  maxPositions: number;
  // Risk assessment
  riskLevel: RiskLevel;
  tradingStatus: TradingStatus;
  warnings: string[];
  // Per-strategy risk
  strategyRisks?: Record<string, {
    exposure: number;
    drawdown: number;
    riskLevel: RiskLevel;
  }>;
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, { color: string; bgColor: string }> = {
  low: { color: '#10B981', bgColor: '#D1FAE5' },
  medium: { color: '#F59E0B', bgColor: '#FEF3C7' },
  high: { color: '#F97316', bgColor: '#FFEDD5' },
  critical: { color: '#EF4444', bgColor: '#FEE2E2' },
};

export const TRADING_STATUS_COLORS: Record<TradingStatus, { color: string; bgColor: string }> = {
  active: { color: '#10B981', bgColor: '#D1FAE5' },
  paused: { color: '#F59E0B', bgColor: '#FEF3C7' },
  stopped: { color: '#EF4444', bgColor: '#FEE2E2' },
  cooldown: { color: '#6366F1', bgColor: '#E0E7FF' },
};

// ── Console Metrics Types ─────────────────────────────────────────────────────

export interface ConsoleMetrics {
  // NAV & Performance
  nav: number;
  navChange24h: number;
  navChangePercent24h: number;
  // P&L
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  pnlToday: number;
  pnl7d: number;
  pnl30d: number;
  // Trading stats
  totalTrades: number;
  tradesToday: number;
  winRate: number;
  winCount: number;
  lossCount: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  // Position stats
  openPositions: number;
  totalExposure: number;
  avgLeverage: number;
  // By strategy
  strategyMetrics?: Record<string, {
    pnl: number;
    trades: number;
    winRate: number;
    exposure: number;
  }>;
}

// ── Agent Types ───────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'paused' | 'idle' | 'error' | 'initializing';

export interface AIAgent {
  id: string;
  strategyId: string;
  name: string;
  shortName: string;
  color: string;
  status: AgentStatus;
  // Performance
  totalPnl: number;
  pnlToday: number;
  winRate: number;
  totalTrades: number;
  tradesToday: number;
  // Current state
  currentPair?: string;
  currentPrice?: number;
  lastSignal?: string;
  lastSignalConfidence?: number;
  lastActivity?: number;
  // Positions
  openPositions: number;
  totalExposure: number;
  // Risk
  riskLevel: RiskLevel;
  drawdown: number;
  // Config
  riskTolerance: 'low' | 'medium' | 'high';
  primaryIndicators: string[];
  preferredPairs: string[];
  leverageRange: [number, number];
}

export const AGENT_STATUS_COLORS: Record<AgentStatus, { color: string; bgColor: string; label: string }> = {
  active: { color: '#10B981', bgColor: '#D1FAE5', label: 'Active' },
  paused: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Paused' },
  idle: { color: '#6B7280', bgColor: '#F3F4F6', label: 'Idle' },
  error: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Error' },
  initializing: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Starting' },
};

// ── Combined Console State ────────────────────────────────────────────────────

export interface CombinedLogEntry {
  id: string;
  timestamp: number;
  source: 'ai' | 'forex';
  strategyId?: string;
  strategyName?: string;
  type: string;
  message: string;
  data?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
}

export interface TradingConsoleState {
  ai: {
    strategies: StrategyPersonality[];
    agents: AIAgent[];
    positions: AIPosition[];
    decisions: AIDecision[];
    riskStatus: RiskStatus | null;
    simulationLogs: BotLogEntry[];
    botStates: Map<string, BotState>;
  };
  forex: {
    logs: ForexLogEntry[];
    poolTransactions: ForexPoolTransaction[];
    stats: {
      totalPnl: number;
      totalTrades: number;
      totalPips: number;
      totalLots: number;
    };
  };
  metrics: ConsoleMetrics;
  combinedLogs: CombinedLogEntry[];
}

// ── Hook Options ──────────────────────────────────────────────────────────────

export interface TradingConsoleOptions {
  simulation?: boolean;
  pollInterval?: number;
  maxLogs?: number;
  strategyIds?: string[];
  autoStart?: boolean;
}

export interface AIQuantConsoleOptions {
  strategyIds?: string[];
  pollInterval?: number;
  simulation?: boolean;
  maxLogs?: number;
}

export interface AgentConsoleOptions {
  strategyId: string;
  pollInterval?: number;
  simulation?: boolean;
  maxLogs?: number;
}

// ── Default Values ────────────────────────────────────────────────────────────

export const DEFAULT_CONSOLE_OPTIONS: TradingConsoleOptions = {
  simulation: true,
  pollInterval: 5000,
  maxLogs: 500,
  autoStart: false,
};

export const DEFAULT_RISK_STATUS: RiskStatus = {
  timestamp: Date.now(),
  totalExposure: 0,
  maxExposure: 100000,
  exposurePercent: 0,
  dailyPnl: 0,
  dailyPnlLimit: 5000,
  dailyPnlPercent: 0,
  dailyTradeCount: 0,
  dailyTradeLimit: 50,
  currentDrawdown: 0,
  maxDrawdown: 15,
  drawdownPercent: 0,
  openPositions: 0,
  maxPositions: 10,
  riskLevel: 'low',
  tradingStatus: 'active',
  warnings: [],
};

export const DEFAULT_CONSOLE_METRICS: ConsoleMetrics = {
  nav: 0,
  navChange24h: 0,
  navChangePercent24h: 0,
  totalPnl: 0,
  realizedPnl: 0,
  unrealizedPnl: 0,
  pnlToday: 0,
  pnl7d: 0,
  pnl30d: 0,
  totalTrades: 0,
  tradesToday: 0,
  winRate: 0,
  winCount: 0,
  lossCount: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
  openPositions: 0,
  totalExposure: 0,
  avgLeverage: 0,
};

// ── Utility Functions ─────────────────────────────────────────────────────────

export function calculateRiskLevel(
  exposurePercent: number,
  drawdownPercent: number,
  dailyPnlPercent: number
): RiskLevel {
  const worstMetric = Math.max(exposurePercent, drawdownPercent, Math.abs(dailyPnlPercent));
  if (worstMetric >= 90) return 'critical';
  if (worstMetric >= 70) return 'high';
  if (worstMetric >= 40) return 'medium';
  return 'low';
}

export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  if (Math.abs(pnl) >= 1000000) {
    return `${sign}$${(pnl / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(pnl) >= 1000) {
    return `${sign}$${(pnl / 1000).toFixed(2)}K`;
  }
  return `${sign}$${pnl.toFixed(2)}`;
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
