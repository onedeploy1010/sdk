export { useWalletBalance } from './useWalletBalance';
export { useTokenPrice, useTokenPrices } from './useTokenPrice';

// AI Trading Hooks
export {
  useAIStrategies,
  useAIStrategy,
  useAIOrders,
  useAIPortfolio,
  useAIMarketData,
  useAITrading,
  setAITradingAccessToken,
  clearAITradingAccessToken,
  // AI Agent Hooks
  useAIAgents,
  useAIAgent,
  useAIAgentSubscription,
  type UseAIStrategiesOptions,
  type UseAIStrategiesResult,
  type UseAIStrategyResult,
  type UseAIOrdersOptions,
  type UseAIOrdersResult,
  type UseAIPortfolioResult,
  type UseAIMarketDataResult,
  type UseAITradingResult,
  type UseAIAgentsResult,
  type UseAIAgentResult,
  type UseAIAgentSubscriptionResult,
  type AIAgent,
  type AIAgentParams,
} from './useAITrading';

// Forex Trading Hooks
export {
  useForexPools,
  useForexInvestments,
  useForexSimulation,
  useForexPoolData,
  useForexTrading,
  setForexAccessToken,
  clearForexAccessToken,
  setForexEngineUrl,
  type UseForexPoolsResult,
  type UseForexInvestmentsResult,
  type UseForexSimulationResult,
  type UseForexPoolDataResult,
  type UseForexTradingResult,
} from './useForexTrading';

// Trading Console Hooks
export {
  useTradingConsole,
  useAIQuantConsole,
  useBotSimulation,
  useAIPositions,
  useAIDecisions,
  useAIRiskStatus,
  setConsoleAccessToken,
  clearConsoleAccessToken,
  setConsoleEngineUrl,
} from './useTradingConsole';

export type { UseBotSimulationOptions, UseBotSimulationResult } from './useBotSimulation';
export type { UseAIPositionsOptions, UseAIPositionsResult } from './useAIPositions';
export type { UseAIDecisionsOptions, UseAIDecisionsResult } from './useAIDecisions';
export type { UseAIRiskStatusOptions, UseAIRiskStatusResult } from './useAIRiskStatus';
export type { UseAIQuantConsoleResult } from './useAIQuantConsole';
export type { UseTradingConsoleResult } from './useTradingConsole';
