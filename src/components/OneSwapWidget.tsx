'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareTransaction } from 'thirdweb';
import type { Chain } from 'thirdweb/chains';
import { base, ethereum, polygon, arbitrum, optimism, bsc, avalanche } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers/ThirdwebProvider';
import { getEngineUrl } from '../config';

// ===== Types =====

export interface SwapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface SwapRoute {
  provider: string;
  fromChain: number;
  toChain: number;
  fromToken: SwapToken;
  toToken: SwapToken;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  priceImpact: string;
  executionTime: string;
  steps: SwapStep[];
}

export interface SwapStep {
  type: 'swap' | 'bridge' | 'approve';
  protocol: string;
  fromToken: string;
  toToken: string;
  fromChain: number;
  toChain: number;
}

export interface OneSwapWidgetProps {
  // Default values
  defaultFromToken?: SwapToken;
  defaultToToken?: SwapToken;
  defaultFromChain?: Chain;
  defaultToChain?: Chain;

  // Supported chains for cross-chain
  supportedChains?: Chain[];

  // Supported tokens per chain
  tokens?: SwapToken[];

  // Mode
  mode?: 'same-chain' | 'cross-chain' | 'auto';

  // Appearance
  theme?: 'light' | 'dark';
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;

  // API endpoints
  quoteEndpoint?: string;
  executeEndpoint?: string;

  // Callbacks
  onSwapSuccess?: (txHash: string, route?: SwapRoute) => void;
  onSwapError?: (error: Error) => void;
  onQuoteReceived?: (route: SwapRoute) => void;
  onChainChange?: (fromChain: number, toChain: number) => void;
}

// ===== Chain Configuration =====

interface ChainConfig {
  chain: Chain;
  name: string;
  shortName: string;
  nativeToken: string;
}

const CHAIN_CONFIGS: ChainConfig[] = [
  { chain: ethereum, name: 'Ethereum', shortName: 'ETH', nativeToken: 'ETH' },
  { chain: base, name: 'Base', shortName: 'BASE', nativeToken: 'ETH' },
  { chain: arbitrum, name: 'Arbitrum', shortName: 'ARB', nativeToken: 'ETH' },
  { chain: optimism, name: 'Optimism', shortName: 'OP', nativeToken: 'ETH' },
  { chain: polygon, name: 'Polygon', shortName: 'MATIC', nativeToken: 'POL' },
  { chain: bsc, name: 'BNB Chain', shortName: 'BSC', nativeToken: 'BNB' },
  { chain: avalanche, name: 'Avalanche', shortName: 'AVAX', nativeToken: 'AVAX' },
];

// ===== Default Tokens Per Chain =====

const TOKENS_BY_CHAIN: Record<number, SwapToken[]> = {
  // Ethereum
  1: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 1 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 1 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai', decimals: 18, chainId: 1 },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 1 },
  ],
  // Base
  8453: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 8453 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 8453 },
    { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', name: 'Dai', decimals: 18, chainId: 8453 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 8453 },
  ],
  // Arbitrum
  42161: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 42161 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 42161 },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 42161 },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 42161 },
  ],
  // Optimism
  10: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 10 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 10 },
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 10 },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 10 },
  ],
  // Polygon
  137: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'POL', name: 'Polygon', decimals: 18, chainId: 137 },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 137 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 137 },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 137 },
  ],
  // BSC
  56: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'BNB', name: 'BNB', decimals: 18, chainId: 56 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, chainId: 56 },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether', decimals: 18, chainId: 56 },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 56 },
  ],
  // Avalanche
  43114: [
    { address: '0x0000000000000000000000000000000000000000', symbol: 'AVAX', name: 'Avalanche', decimals: 18, chainId: 43114 },
    { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 43114 },
    { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 43114 },
    { address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chainId: 43114 },
  ],
};

// ===== Styles =====

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid',
  maxWidth: '420px',
};

const chainSelectorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const tokenInputStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '16px',
  borderRadius: '12px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: '24px',
  fontWeight: 600,
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  appearance: 'none',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: '28px',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const routeBoxStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  marginBottom: '4px',
};

// ===== Component =====

export function OneSwapWidget({
  defaultFromToken,
  defaultToToken,
  defaultFromChain = base,
  defaultToChain,
  supportedChains,
  tokens,
  mode = 'auto',
  theme = 'dark',
  accentColor = '#10b981',
  className,
  style,
  quoteEndpoint,
  executeEndpoint,
  onSwapSuccess,
  onSwapError,
  onQuoteReceived,
  onChainChange,
}: OneSwapWidgetProps) {
  const client = useThirdwebClient();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  // Available chains
  const availableChains = useMemo(() => {
    if (supportedChains) {
      return CHAIN_CONFIGS.filter(c => supportedChains.some(sc => sc.id === c.chain.id));
    }
    return CHAIN_CONFIGS;
  }, [supportedChains]);

  // State
  const [fromChain, setFromChain] = useState<ChainConfig>(
    availableChains.find(c => c.chain.id === defaultFromChain.id) || availableChains[0]
  );
  const [toChain, setToChain] = useState<ChainConfig>(
    defaultToChain
      ? availableChains.find(c => c.chain.id === defaultToChain.id) || availableChains[0]
      : fromChain
  );

  // Get tokens for selected chains
  const fromTokens = useMemo(() => {
    if (tokens) {
      return tokens.filter(t => t.chainId === fromChain.chain.id);
    }
    return TOKENS_BY_CHAIN[fromChain.chain.id] || [];
  }, [tokens, fromChain]);

  const toTokens = useMemo(() => {
    if (tokens) {
      return tokens.filter(t => t.chainId === toChain.chain.id);
    }
    return TOKENS_BY_CHAIN[toChain.chain.id] || [];
  }, [tokens, toChain]);

  const [fromToken, setFromToken] = useState<SwapToken>(defaultFromToken || fromTokens[0]);
  const [toToken, setToToken] = useState<SwapToken>(defaultToToken || toTokens[1] || toTokens[0]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [route, setRoute] = useState<SwapRoute | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isCrossChain = fromChain.chain.id !== toChain.chain.id;

  // Update tokens when chain changes
  useEffect(() => {
    const newFromTokens = TOKENS_BY_CHAIN[fromChain.chain.id] || [];
    if (newFromTokens.length > 0 && !newFromTokens.some(t => t.address === fromToken?.address)) {
      setFromToken(newFromTokens[0]);
    }
  }, [fromChain, fromToken?.address]);

  useEffect(() => {
    const newToTokens = TOKENS_BY_CHAIN[toChain.chain.id] || [];
    if (newToTokens.length > 0 && !newToTokens.some(t => t.address === toToken?.address)) {
      // Try to find same symbol token on destination chain, otherwise use first
      const sameSymbol = newToTokens.find(t => t.symbol === fromToken?.symbol);
      setToToken(sameSymbol || newToTokens[0]);
    }
  }, [toChain, toToken?.address, fromToken?.symbol]);

  // Notify chain change
  useEffect(() => {
    onChainChange?.(fromChain.chain.id, toChain.chain.id);
  }, [fromChain, toChain, onChainChange]);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
      setToAmount('');
      setRoute(null);
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const engineUrl = getEngineUrl();
      const endpoint = quoteEndpoint || `${engineUrl}/v1/swap/quote`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChainId: fromChain.chain.id,
          toChainId: toChain.chain.id,
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount: fromAmount,
          fromDecimals: fromToken.decimals,
          walletAddress: account?.address,
          slippage: 0.5, // 0.5% default slippage
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const routeData: SwapRoute = {
          provider: data.data.provider || 'aggregator',
          fromChain: fromChain.chain.id,
          toChain: toChain.chain.id,
          fromToken,
          toToken,
          fromAmount,
          toAmount: data.data.toAmount || '0',
          estimatedGas: data.data.estimatedGas || '0',
          priceImpact: data.data.priceImpact || '0',
          executionTime: isCrossChain ? '2-5 min' : '~30 sec',
          steps: data.data.steps || [],
        };

        setRoute(routeData);
        setToAmount(routeData.toAmount);
        onQuoteReceived?.(routeData);
      } else {
        // Fallback: simple estimate
        const estimatedOutput = estimateSwapOutput(fromAmount, fromToken, toToken);
        setToAmount(estimatedOutput.toFixed(6));
        setError(data.error?.message || null);
      }
    } catch (err) {
      // Fallback estimate on error
      const estimatedOutput = estimateSwapOutput(fromAmount, fromToken, toToken);
      setToAmount(estimatedOutput.toFixed(6));
      console.error('Quote fetch error:', err);
    } finally {
      setIsLoadingQuote(false);
    }
  }, [fromAmount, fromToken, toToken, fromChain, toChain, account?.address, quoteEndpoint, isCrossChain, onQuoteReceived]);

  // Simple estimate fallback
  const estimateSwapOutput = (amount: string, from: SwapToken, to: SwapToken): number => {
    const prices: Record<string, number> = {
      ETH: 3500, WETH: 3500, BNB: 650, AVAX: 42, POL: 0.85,
      USDC: 1, USDT: 1, DAI: 1,
    };
    const fromPrice = prices[from.symbol] || 1;
    const toPrice = prices[to.symbol] || 1;
    return (parseFloat(amount) * fromPrice) / toPrice;
  };

  useEffect(() => {
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fetchQuote]);

  // Swap tokens/chains
  const handleSwapDirection = () => {
    const tempChain = fromChain;
    const tempToken = fromToken;
    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Execute swap
  const handleSwap = async () => {
    if (!account || !fromToken || !toToken) return;

    setError(null);

    try {
      const engineUrl = getEngineUrl();
      const endpoint = executeEndpoint || `${engineUrl}/v1/swap/execute`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChainId: fromChain.chain.id,
          toChainId: toChain.chain.id,
          fromToken: fromToken.address,
          toToken: toToken.address,
          fromAmount,
          walletAddress: account.address,
          slippage: 0.5,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.transaction) {
        const tx = prepareTransaction({
          to: data.data.transaction.to,
          data: data.data.transaction.data,
          value: BigInt(data.data.transaction.value || 0),
          chain: fromChain.chain,
          client,
        });

        sendTransaction(tx, {
          onSuccess: (result) => {
            onSwapSuccess?.(result.transactionHash, route || undefined);
            setFromAmount('');
            setToAmount('');
            setRoute(null);
          },
          onError: (err) => {
            setError(err.message);
            onSwapError?.(err);
          },
        });
      } else {
        throw new Error(data.error?.message || 'Swap execution failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Swap failed');
      setError(error.message);
      onSwapError?.(error);
    }
  };

  const canSwap = account && fromAmount && parseFloat(fromAmount) > 0 && !isPending && !isLoadingQuote;

  // Theme colors
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f3f4f6';

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        backgroundColor: bgColor,
        borderColor,
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: textColor, margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Swap
        </h3>
        {isCrossChain && (
          <span style={{
            fontSize: '11px',
            padding: '4px 8px',
            backgroundColor: accentColor,
            color: '#fff',
            borderRadius: '4px',
          }}>
            Cross-Chain
          </span>
        )}
      </div>

      {/* From Section */}
      <div style={{ ...tokenInputStyle, backgroundColor: inputBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...labelStyle, color: mutedColor }}>From</span>
          {mode !== 'same-chain' && (
            <div style={chainSelectorStyle}>
              <select
                value={fromChain.chain.id}
                onChange={(e) => {
                  const chain = availableChains.find(c => c.chain.id === parseInt(e.target.value));
                  if (chain) setFromChain(chain);
                }}
                style={{
                  ...selectStyle,
                  backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
                  color: textColor,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '12px',
                  fontSize: '12px',
                  padding: '6px 24px 6px 8px',
                }}
              >
                {availableChains.map(c => (
                  <option key={c.chain.id} value={c.chain.id}>{c.shortName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            style={{ ...inputStyle, flex: 1, color: textColor }}
          />
          <select
            value={fromToken?.address || ''}
            onChange={(e) => {
              const token = fromTokens.find(t => t.address === e.target.value);
              if (token) setFromToken(token);
            }}
            style={{
              ...selectStyle,
              backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
              color: textColor,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '12px',
            }}
          >
            {fromTokens.map(token => (
              <option key={token.address} value={token.address}>{token.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0' }}>
        <button
          onClick={handleSwapDirection}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: inputBg,
            border: `2px solid ${bgColor}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: mutedColor,
            zIndex: 1,
          }}
        >
          ↕
        </button>
      </div>

      {/* To Section */}
      <div style={{ ...tokenInputStyle, backgroundColor: inputBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...labelStyle, color: mutedColor }}>To</span>
          {mode !== 'same-chain' && (
            <div style={chainSelectorStyle}>
              <select
                value={toChain.chain.id}
                onChange={(e) => {
                  const chain = availableChains.find(c => c.chain.id === parseInt(e.target.value));
                  if (chain) setToChain(chain);
                }}
                style={{
                  ...selectStyle,
                  backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
                  color: textColor,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '12px',
                  fontSize: '12px',
                  padding: '6px 24px 6px 8px',
                }}
              >
                {availableChains.map(c => (
                  <option key={c.chain.id} value={c.chain.id}>{c.shortName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="number"
            value={toAmount}
            placeholder="0.0"
            readOnly
            style={{ ...inputStyle, flex: 1, color: mutedColor }}
          />
          <select
            value={toToken?.address || ''}
            onChange={(e) => {
              const token = toTokens.find(t => t.address === e.target.value);
              if (token) setToToken(token);
            }}
            style={{
              ...selectStyle,
              backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
              color: textColor,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '12px',
            }}
          >
            {toTokens.map(token => (
              <option key={token.address} value={token.address}>{token.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Info */}
      {(route || (fromAmount && toAmount)) && (
        <div style={{ ...routeBoxStyle, backgroundColor: inputBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: mutedColor }}>Rate</span>
            <span style={{ color: textColor }}>
              1 {fromToken?.symbol} = {toAmount && fromAmount ? (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6) : '0'} {toToken?.symbol}
            </span>
          </div>
          {route?.priceImpact && parseFloat(route.priceImpact) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: mutedColor }}>Price Impact</span>
              <span style={{ color: parseFloat(route.priceImpact) > 3 ? '#ef4444' : textColor }}>
                {route.priceImpact}%
              </span>
            </div>
          )}
          {isCrossChain && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: mutedColor }}>Est. Time</span>
              <span style={{ color: textColor }}>{route?.executionTime || '2-5 min'}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '14px',
          padding: '10px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
        }}>
          {error}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!canSwap}
        style={{
          ...buttonStyle,
          backgroundColor: canSwap ? accentColor : '#6b7280',
          color: '#ffffff',
          cursor: canSwap ? 'pointer' : 'not-allowed',
        }}
      >
        {isPending
          ? 'Swapping...'
          : isLoadingQuote
          ? 'Getting Quote...'
          : !account
          ? 'Connect Wallet'
          : isCrossChain
          ? `Bridge & Swap`
          : 'Swap'}
      </button>
    </div>
  );
}

// ===== Presets =====

export function OneSameChainSwap(props: Omit<OneSwapWidgetProps, 'mode'>) {
  return <OneSwapWidget {...props} mode="same-chain" />;
}

export function OneCrossChainSwap(props: Omit<OneSwapWidgetProps, 'mode'>) {
  return <OneSwapWidget {...props} mode="cross-chain" />;
}
