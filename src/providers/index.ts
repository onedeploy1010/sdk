// ONE SDK Unified Provider
// All wallet functionality (including thirdweb) is integrated into OneProvider

export {
  // Main Provider
  OneProvider,

  // Core Hooks
  useOne,
  useOneAuth,
  useOneWallet,
  useOneOnramp,
  useOneSwap,
  useOneTrading,
  useOneEngine,
  useThirdwebClient,

  // Context
  OneContext,

  // Thirdweb utilities (re-exported for convenience)
  inAppWallet,
  smartWallet,
  base,
  ethereum,
  polygon,
  arbitrum,
  optimism,

  // Types
  type ThirdwebAuthOptions,
  type ThirdwebWalletConfig,
  type Chain,
  type ThirdwebClient,
} from './OneProvider';

// Legacy re-export for backwards compatibility
// @deprecated Use OneProvider instead
export { OneProvider as OneThirdwebProvider } from './OneProvider';
export type { ThirdwebWalletConfig as OneThirdwebConfig } from './OneProvider';
