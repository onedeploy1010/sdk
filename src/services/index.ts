// ===== ONE Engine Client (Main API Gateway) =====
export {
  OneEngineClient,
  createOneEngineClient,
} from './engine';

export type {
  // Auth
  EngineAuthResponse,
  // Wallet
  EngineWalletBalance,
  EngineTransactionRequest,
  EngineTransactionResponse,
  // Onramp
  OnrampSessionRequest,
  OnrampSession,
  OnrampQuote,
  OnrampTransaction,
  // Swap
  SwapQuoteRequest,
  SwapQuote,
  SwapExecuteRequest,
  SwapResult,
} from './engine';

// ===== Supabase (for direct DB access if needed) =====
export { SupabaseService, createSupabaseClient, getSupabaseClient } from './supabase';

// ===== Price Service (fallback for offline/cache) =====
export { PriceService, priceService } from './price';

// ===== Usage Tracking Service =====
export {
  UsageService,
  getUsageService,
  createUsageService,
} from './usage';

export type {
  UsageCategory,
  DisplayCategory,
  UsageRecord,
  UsageSummary,
  UsageActivity,
  UsageResponse,
} from './usage';

// ===== Forex Trading Services =====
export {
  forexSimulationEngine,
  ForexPoolDataGenerator,
  botSimulationEngine,
} from './forex';
export type {
  PairState,
  BotLogType,
  BotLogEntry,
  IndicatorSnapshot,
  BotState,
  StrategyPersonality,
} from './forex';
