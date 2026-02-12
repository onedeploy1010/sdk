// ===== Configuration =====
export {
  initOneSDK,
  getConfig,
  getEngineUrl,
  isInitialized,
  // Chain functions (fetch from Engine API)
  fetchChains,
  getChains,
  getChainById,
  getChainByName,
  getRecommendedChains,
  getSmartWalletChains,
  // Constants
  CHAIN_IDS,
  DEFAULT_CHAIN_ID,
  TOKEN_NAMES,
  COINGECKO_IDS,
  // @deprecated - use getChains() instead
  CHAIN_CONFIGS,
  SUPPORTED_CHAINS,
  getChainConfig,
} from './config';
export type { OneConfig } from './config';

// ===== Types =====
export * from './types';

// ===== ONE Engine Client (Main API Gateway) =====
export {
  OneEngineClient,
  createOneEngineClient,
  // Supabase (for direct DB if needed)
  SupabaseService,
  createSupabaseClient,
  // Price (for offline/cache)
  PriceService,
  priceService,
  // Usage Tracking
  UsageService,
  getUsageService,
  createUsageService,
  // Forex Services
  forexSimulationEngine,
  ForexPoolDataGenerator,
  botSimulationEngine,
} from './services';

// Export all Engine types
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
  // Usage
  UsageCategory,
  DisplayCategory,
  UsageRecord,
  UsageSummary,
  UsageActivity,
  UsageResponse,
  // Forex Services
  PairState,
  BotLogType,
  BotLogEntry,
  IndicatorSnapshot,
  BotState,
  StrategyPersonality,
} from './services';

// ===== React Providers & Hooks =====
export {
  // Unified ONE Provider (with integrated thirdweb wallet support)
  OneProvider,
  useOne,
  useOneAuth,
  useOneWallet,
  useOneOnramp,
  useOneSwap,
  useOneTrading,
  useOneEngine,
  useThirdwebClient,
  OneContext,
  // Thirdweb utilities (re-exported for convenience)
  inAppWallet,
  smartWallet,
  base,
  ethereum,
  polygon,
  arbitrum,
  optimism,
  // @deprecated - Use OneProvider instead
  OneThirdwebProvider,
} from './providers';

export type {
  ThirdwebAuthOptions,
  ThirdwebWalletConfig,
  Chain,
  ThirdwebClient,
  // @deprecated - Use ThirdwebWalletConfig instead
  OneThirdwebConfig,
} from './providers';

// ===== UI Components (Wrapped Thirdweb) =====
export {
  // Wallet Connection
  OneConnectButton,
  OneConnectButtonSimple,
  OneConnectButtonFull,
  // Payment Widgets
  OnePayWidget,
  OneFundWalletWidget,
  OneDirectPayWidget,
  OneCryptoOnlyPayWidget,
  OneFiatOnlyPayWidget,
  // Transaction Buttons
  OneTransactionButton,
  OneSendETHButton,
  OneApproveButton,
  // Send Widgets
  OneSendWidget,
  OneSendETHWidget,
  OneSendUSDCWidget,
  // Fiat On/Off Ramp Widgets
  OneOnrampWidget,
  OneBuyUSDTWidget,
  OneBuyUSDCWidget,
  OneBuyETHWidget,
  OneBuyBTCWidget,
  OneOfframpWidget,
  OneSellUSDTWidget,
  OneSellUSDCWidget,
  OneSellETHWidget,
  // Swap Widget
  OneSwapWidget,
  OneSameChainSwap,
  OneCrossChainSwap,
  // Balance & Assets
  OneWalletBalance,
  OneBalanceDisplay,
  // NFT Gallery
  OneNFTGallery,
  // Receive Widget
  OneReceiveWidget,
  // AI Trading Components
  OneChainSelector,
  OneTierSelector,
  OneCycleSelector,
  OnePairSelector,
  // StableFX Forex Components
  OneForexPoolCard,
  OneForexCapitalSplit,
  OneForexConsoleView,
  OneForexPairSelector,
  OneForexTradeHistory,
  // Trading Console Components
  OneTradingConsole,
  OneAIQuantConsole,
  OneAgentConsole,
  OnePositionDetail,
  OneAgentCard,
  OnePositionCard,
  OneRiskIndicator,
  OneMetricsDashboard,
  OneDecisionTimeline,
} from './components';

export type {
  OneConnectButtonProps,
  OnePayWidgetProps,
  PayMode,
  OneTransactionButtonProps,
  OneSendETHButtonProps,
  OneApproveButtonProps,
  OneSendWidgetProps,
  // Onramp/Offramp Types
  OneOnrampWidgetProps,
  OneOfframpWidgetProps,
  OfframpQuote,
  OfframpTransaction,
  // Swap
  OneSwapWidgetProps,
  SwapToken,
  SwapRoute,
  SwapStep,
  OneWalletBalanceProps,
  TokenBalance,
  OneNFTGalleryProps,
  NFTItem,
  OneReceiveWidgetProps,
  // AI Trading Component Types
  OneChainSelectorProps,
  OneTierSelectorProps,
  OneCycleSelectorProps,
  OnePairSelectorProps,
  // Forex Component Types
  OneForexPoolCardProps,
  OneForexCapitalSplitProps,
  OneForexConsoleViewProps,
  OneForexPairSelectorProps,
  OneForexTradeHistoryProps,
  // Trading Console Component Types
  OneTradingConsoleProps,
  OneAIQuantConsoleProps,
  OneAgentConsoleProps,
  OnePositionDetailProps,
  OneAgentCardProps,
  OnePositionCardProps,
  OneRiskIndicatorProps,
  OneMetricsDashboardProps,
  OneDecisionTimelineProps,
} from './components';

// ===== Standalone Hooks (for use outside OneProvider) =====
export {
  useWalletBalance,
  useTokenPrice,
  useTokenPrices,
  // AI Trading Hooks
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
  // Forex Trading Hooks
  useForexPools,
  useForexInvestments,
  useForexSimulation,
  useForexPoolData,
  useForexTrading,
  setForexAccessToken,
  clearForexAccessToken,
  setForexEngineUrl,
  // Trading Console Hooks
  useTradingConsole,
  useAIQuantConsole,
  useBotSimulation,
  useAIPositions,
  useAIDecisions,
  useAIRiskStatus,
  setConsoleAccessToken,
  clearConsoleAccessToken,
  setConsoleEngineUrl,
} from './hooks';

export type {
  UseAIStrategiesOptions,
  UseAIStrategiesResult,
  UseAIStrategyResult,
  UseAIOrdersOptions,
  UseAIOrdersResult,
  UseAIPortfolioResult,
  UseAIMarketDataResult,
  UseAITradingResult,
  // AI Agent Hook Types
  UseAIAgentsResult,
  UseAIAgentResult,
  UseAIAgentSubscriptionResult,
  AIAgent as AIAgentHook,
  AIAgentParams,
  // Forex Hook Types
  UseForexPoolsResult,
  UseForexInvestmentsResult,
  UseForexSimulationResult,
  UseForexPoolDataResult,
  UseForexTradingResult,
  // Trading Console Hook Types
  UseBotSimulationOptions,
  UseBotSimulationResult,
  UseAIPositionsOptions,
  UseAIPositionsResult,
  UseAIDecisionsOptions,
  UseAIDecisionsResult,
  UseAIRiskStatusOptions,
  UseAIRiskStatusResult,
  UseAIQuantConsoleResult,
  UseTradingConsoleResult,
} from './hooks';

// ===== Utilities =====
export {
  // Address
  shortenAddress,
  isValidAddress,
  checksumAddress,
  // Numbers
  formatNumber,
  formatUSD,
  formatPercent,
  formatTokenAmount,
  // Date/Time
  formatDate,
  formatDateTime,
  formatRelativeTime,
  // Validation
  isValidEmail,
  isValidPhone,
  // Strings
  capitalize,
  truncate,
  slugify,
  // Async
  sleep,
  retry,
  // Objects
  omit,
  pick,
  // Errors
  OneSDKError,
  isOneSDKError,
} from './utils';
