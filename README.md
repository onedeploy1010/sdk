# @one_deploy/sdk

The complete Web3 SDK for wallet, payments, AI trading, and on-chain forex. Build production-ready decentralized applications with pre-built UI components, React hooks, and a unified API client supporting 200+ EVM chains.

[![npm version](https://img.shields.io/npm/v/@one_deploy/sdk)](https://www.npmjs.com/package/@one_deploy/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **Multi-Chain Wallets** -- Smart wallets and EOA support across 200+ EVM chains
- **Payment Widgets** -- On-ramp, off-ramp, swap, and send components out of the box
- **AI Trading** -- Automated trading strategies with configurable risk levels and cycles
- **StableFX Forex** -- On-chain forex trading with stablecoin pairs and pool allocation
- **React & React Native** -- Separate optimized entry points for web and mobile
- **TypeScript** -- Comprehensive type definitions for all APIs and components
- **Tree-Shakable** -- Modular exports with CJS + ESM dual build

## Installation

```bash
npm install @one_deploy/sdk
```

### Peer Dependencies

```bash
# Required for React web apps
npm install react react-dom

# Required for Web3 features
npm install thirdweb

# Required for React Native apps
npm install react-native
```

## Quick Start

### Web (React)

```tsx
import { OneProvider, OneThirdwebProvider, initOneSDK } from '@one_deploy/sdk';

// Initialize the SDK
initOneSDK({
  clientId: process.env.ONE_CLIENT_ID!,
  secretKey: process.env.ONE_SECRET_KEY!,
});

function App() {
  return (
    <OneThirdwebProvider clientId={process.env.THIRDWEB_CLIENT_ID!}>
      <OneProvider>
        <YourApp />
      </OneProvider>
    </OneThirdwebProvider>
  );
}
```

### React Native

```tsx
import {
  OneEngineClient,
  createCachedEngineClient,
  StorageAdapter,
} from '@one_deploy/sdk/react-native';

const storage: StorageAdapter = {
  getItem: async (key) => AsyncStorage.getItem(key),
  setItem: async (key, value) => AsyncStorage.setItem(key, value),
  removeItem: async (key) => AsyncStorage.removeItem(key),
};

const engine = createCachedEngineClient({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
  storage,
});
```

## Package Exports

The SDK provides modular entry points for tree-shaking:

```typescript
import { ... } from '@one_deploy/sdk';              // Full web entry
import { ... } from '@one_deploy/sdk/react-native';  // Mobile entry
import { ... } from '@one_deploy/sdk/services';       // Services only
import { ... } from '@one_deploy/sdk/types';          // Type definitions
import { ... } from '@one_deploy/sdk/hooks';           // React hooks
import { ... } from '@one_deploy/sdk/components';      // UI components
import { ... } from '@one_deploy/sdk/providers';       // React providers
import { ... } from '@one_deploy/sdk/utils';           // Utility functions
import { ... } from '@one_deploy/sdk/config';          // Configuration
```

## Components

### Wallet & Connection

| Component | Description |
|-----------|-------------|
| `OneConnectButton` | Wallet connection with auth options |
| `OneConnectButtonSimple` | Minimal connect button preset |
| `OneConnectButtonFull` | Full-featured connect button preset |
| `OneWalletBalance` | Display wallet balance |
| `OneBalanceDisplay` | Formatted balance display |

### Payments

| Component | Description |
|-----------|-------------|
| `OnePayWidget` | Flexible payment interface (fund, direct pay, crypto-only, fiat-only) |
| `OneOnrampWidget` | Buy crypto with fiat (BTC, ETH, USDT, USDC presets) |
| `OneOfframpWidget` | Sell crypto for fiat (ETH, USDT, USDC presets) |
| `OneSwapWidget` | Token swap (same-chain and cross-chain presets) |
| `OneSendWidget` | Send crypto (ETH, USDC presets) |
| `OneReceiveWidget` | Receive funds with QR code |

### Transactions

| Component | Description |
|-----------|-------------|
| `OneTransactionButton` | Generic transaction executor |
| `OneSendETHButton` | One-click ETH send |
| `OneApproveButton` | Token approval button |

### AI Trading

| Component | Description |
|-----------|-------------|
| `OneChainSelector` | Blockchain network selection |
| `OneTierSelector` | Investment tier selection |
| `OneCycleSelector` | Cycle duration selection |
| `OnePairSelector` | Trading pair selection |

### StableFX Forex

| Component | Description |
|-----------|-------------|
| `OneForexPoolCard` | Pool information display |
| `OneForexCapitalSplit` | Capital allocation visualization |
| `OneForexConsoleView` | Trading console with live logs |
| `OneForexPairSelector` | Currency pair selector |
| `OneForexTradeHistory` | Trade history table |

## Hooks

### General

| Hook | Description |
|------|-------------|
| `useWalletBalance` | Wallet balance with auto-refresh |
| `useTokenPrice` | Single token price |
| `useTokenPrices` | Multiple token prices |

### Provider Hooks (require `OneProvider`)

| Hook | Description |
|------|-------------|
| `useOne` | Core SDK context |
| `useOneAuth` | Authentication state and methods |
| `useOneWallet` | Wallet operations |
| `useOneOnramp` | On-ramp operations |
| `useOneSwap` | Swap operations |
| `useOneTrading` | Trading operations |
| `useOneEngine` | Direct engine client access |

### AI Trading Hooks

| Hook | Description |
|------|-------------|
| `useAIStrategies` | List available strategies |
| `useAIStrategy` | Single strategy details |
| `useAIOrders` | User's AI orders |
| `useAIPortfolio` | Portfolio summary and metrics |
| `useAIMarketData` | Live market data |
| `useAITrading` | Combined AI trading hook |

### Forex Hooks

| Hook | Description |
|------|-------------|
| `useForexPools` | Pool data and allocations |
| `useForexInvestments` | User investments |
| `useForexSimulation` | Simulation engine |
| `useForexPoolData` | Pool statistics and snapshots |
| `useForexTrading` | Combined forex trading hook |

## API Client

The `OneEngineClient` provides 91+ methods covering all platform features:

```typescript
import { OneEngineClient } from '@one_deploy/sdk';

const engine = new OneEngineClient({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
});

// Authentication
await engine.sendOTP({ email: 'user@example.com' });
const session = await engine.verifyOTP({ email: 'user@example.com', code: '123456' });

// Wallet
const balance = await engine.getWalletBalance({ address, chainId: 8453 });

// Swap
const quote = await engine.getSwapQuote({ fromToken, toToken, amount, chainId });
await engine.executeSwap(quote);

// AI Trading
const strategies = await engine.getAIStrategies();
const order = await engine.createAIOrder({ strategyId, chainId, tierId, cycleDays, pair, amount });

// Contracts
const result = await engine.readContract({ contractAddress, functionName, args, chainId });
```

### API Categories

| Category | Methods |
|----------|---------|
| Authentication | 6 methods (OTP, wallet signature, sessions) |
| Wallet & Assets | 7 methods (balance, portfolio, transactions) |
| Swap | 5 methods (quotes, execution, routes) |
| On/Off Ramp | 8 methods (fiat conversions) |
| AI Trading | 18 methods (strategies, orders, portfolio) |
| Forex | Pool, investment, and trade endpoints |
| Contracts & NFTs | 9 methods (read, write, deploy) |
| Bills & Staking | 9 methods |
| Bridge & Gas | 6 methods |
| Price | 5 methods (no auth required) |
| Webhooks | 7 methods |
| Admin | 11 methods |
| Project | 8 methods |

## Supported Chains

Default chain configurations include:

| Chain | ID |
|-------|----|
| Ethereum | 1 |
| Polygon | 137 |
| BNB Chain | 56 |
| Arbitrum | 42161 |
| Optimism | 10 |
| Base | 8453 |
| Avalanche | 43114 |
| zkSync Era | 324 |
| Linea | 59144 |
| Scroll | 534352 |
| Blast | 81457 |

Testnets: Sepolia (11155111), Base Sepolia (84532), Arbitrum Sepolia (421614)

Additional chains are loaded dynamically from the ONE Engine API.

## Services

| Service | Description |
|---------|-------------|
| `OneEngineClient` | Main API gateway to ONE Engine |
| `SupabaseService` | Direct database access layer |
| `PriceService` | Token price caching with fallback |
| `UsageService` | Usage tracking and analytics |
| `ForexSimulationEngine` | Forex trading simulation |
| `ForexPoolDataGenerator` | Pool data generation |
| `BotSimulationEngine` | Trading bot simulation |

## Utilities

```typescript
import {
  shortenAddress,
  isValidAddress,
  formatUSD,
  formatTokenAmount,
  formatRelativeTime,
  retry,
  OneSDKError,
} from '@one_deploy/sdk/utils';

shortenAddress('0x1234...5678');       // "0x1234...5678"
formatUSD(1234.56);                     // "$1,234.56"
formatTokenAmount(1.23456789, 'ETH');   // "1.2346 ETH"
formatRelativeTime(new Date());         // "just now"
await retry(() => fetchData(), 3);      // Retry with exponential backoff
```

## Project Structure

```
src/
├── index.ts              # Web entry point
├── react-native.ts       # Mobile entry point
├── config/               # SDK configuration & chain data
├── types/                # TypeScript type definitions
├── providers/            # OneProvider & OneThirdwebProvider
├── components/           # UI components (web + RN)
├── hooks/                # React hooks
├── services/             # API clients & simulation engines
└── utils/                # Utility functions
```

## Build

```bash
# Development
npm run dev

# Production build (CJS + ESM)
npm run build

# Type checking
npm run typecheck
```

Built with [tsup](https://tsup.egoist.dev/) -- outputs both CommonJS and ESM formats with TypeScript declarations and source maps.

## Documentation

Full documentation is available at **[docs.one23.io](https://docs.one23.io)**.

- [Getting Started](https://docs.one23.io/docs/getting-started/overview)
- [Wallet Integration](https://docs.one23.io/docs/wallet/overview)
- [Payments](https://docs.one23.io/docs/payments/overview)
- [AI Trading](https://docs.one23.io/docs/ai-trading/overview)
- [Forex](https://docs.one23.io/docs/forex/overview)
- [API Reference](https://docs.one23.io/docs/api-reference/overview)
- [Hooks Reference](https://docs.one23.io/docs/hooks/overview)

## License

MIT
