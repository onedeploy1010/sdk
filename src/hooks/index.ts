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
  type UseAIStrategiesOptions,
  type UseAIStrategiesResult,
  type UseAIStrategyResult,
  type UseAIOrdersOptions,
  type UseAIOrdersResult,
  type UseAIPortfolioResult,
  type UseAIMarketDataResult,
  type UseAITradingResult,
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
