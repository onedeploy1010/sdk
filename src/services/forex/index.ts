/**
 * ONE SDK - Forex Trading Services
 * Simulation engines and data generators for StableFX on-chain forex
 */

// Forex RFQ+PvP Simulation Engine
export { forexSimulationEngine } from './ForexSimulationEngine';
export type { PairState } from './ForexSimulationEngine';

// Pool Data Generator (historical snapshots & transactions)
export { ForexPoolDataGenerator } from './ForexPoolDataGenerator';

// Bot Simulation Engine (AI crypto trading strategies)
export { botSimulationEngine } from './BotSimulationEngine';
export type {
  BotLogType,
  BotLogEntry,
  IndicatorSnapshot,
  BotState,
  StrategyPersonality,
} from './BotSimulationEngine';
