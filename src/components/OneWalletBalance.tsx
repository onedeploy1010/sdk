'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useWalletBalance as useThirdwebBalance } from 'thirdweb/react';
import type { Chain } from 'thirdweb/chains';
import { base, ethereum, polygon, arbitrum, optimism } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers';

// ===== Types =====

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  balanceFormatted: string;
  balanceUsd: number;
  price: number;
  priceChange24h: number;
  chainId: number;
  chain: string;
  contractAddress?: string;
  logoURI?: string;
}

export interface OneWalletBalanceProps {
  // Display options
  showTotalBalance?: boolean;
  showTokenList?: boolean;
  showChainFilter?: boolean;
  showPriceChange?: boolean;

  // Chains to show
  chains?: Chain[];

  // API endpoint for fetching balances
  balanceEndpoint?: string;

  // Appearance
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;

  // Callbacks
  onTokenClick?: (token: TokenBalance) => void;
  onRefresh?: () => void;
}

// ===== Styles =====

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const balanceCardStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#1f2937',
  borderRadius: '16px',
  border: '1px solid #374151',
};

const tokenRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

// ===== Utilities =====

const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatBalance = (value: string, decimals: number = 4): string => {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  return num.toFixed(decimals);
};

const CHAIN_INFO: Record<number, { name: string; icon: string }> = {
  1: { name: 'Ethereum', icon: '⟠' },
  8453: { name: 'Base', icon: '🔵' },
  137: { name: 'Polygon', icon: '🟣' },
  42161: { name: 'Arbitrum', icon: '🔷' },
  10: { name: 'Optimism', icon: '🔴' },
};

// ===== Component =====

export function OneWalletBalance({
  showTotalBalance = true,
  showTokenList = true,
  showChainFilter = true,
  showPriceChange = true,
  chains = [base, ethereum, polygon, arbitrum, optimism],
  balanceEndpoint = '/api/v1/assets',
  theme = 'dark',
  className,
  style,
  compact = false,
  onTokenClick,
  onRefresh,
}: OneWalletBalanceProps) {
  const client = useThirdwebClient();
  const account = useActiveAccount();

  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalChange24h, setTotalChange24h] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch balances from ONE Engine
  const fetchBalances = useCallback(async () => {
    if (!account?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const chainIds = chains.map(c => c.id).join(',');
      const response = await fetch(`${balanceEndpoint}?address=${account.address}&chains=${chainIds}`);
      const data = await response.json();

      if (data.success && data.data) {
        const balanceData = data.data;
        setTokens(balanceData.tokens || []);
        setTotalBalance(balanceData.totalUsd || 0);
        setTotalChange24h(balanceData.change24hPercent || 0);
      } else {
        setError(data.error?.message || 'Failed to fetch balances');
      }
    } catch (err) {
      setError('Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, balanceEndpoint, chains]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleRefresh = () => {
    fetchBalances();
    onRefresh?.();
  };

  const filteredTokens = selectedChain
    ? tokens.filter(t => t.chainId === selectedChain)
    : tokens;

  const isDark = theme === 'dark';

  if (!account) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', padding: '24px', color: isDark ? '#9ca3af' : '#6b7280' }}>
        Connect your wallet to view balances
      </div>
    );
  }

  return (
    <div className={className} style={{ ...containerStyle, ...style }}>
      {/* Total Balance Card */}
      {showTotalBalance && (
        <div style={{ ...balanceCardStyle, backgroundColor: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>Total Balance</p>
              {isLoading ? (
                <div style={{ height: '36px', width: '120px', backgroundColor: isDark ? '#374151' : '#e5e7eb', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
              ) : (
                <h2 style={{ margin: 0, color: isDark ? '#ffffff' : '#111827', fontSize: compact ? '24px' : '32px', fontWeight: 700 }}>
                  {formatUSD(totalBalance)}
                </h2>
              )}
              {showPriceChange && !isLoading && (
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: totalChange24h >= 0 ? '#10b981' : '#ef4444' }}>
                  {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}% (24h)
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                padding: '8px 12px',
                backgroundColor: isDark ? '#374151' : '#e5e7eb',
                border: 'none',
                borderRadius: '8px',
                color: isDark ? '#ffffff' : '#111827',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {isLoading ? '...' : '↻'}
            </button>
          </div>
        </div>
      )}

      {/* Chain Filter */}
      {showChainFilter && chains.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedChain(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedChain === null ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
              border: 'none',
              borderRadius: '20px',
              color: selectedChain === null ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            All
          </button>
          {chains.map(chain => (
            <button
              key={chain.id}
              onClick={() => setSelectedChain(chain.id)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedChain === chain.id ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
                border: 'none',
                borderRadius: '20px',
                color: selectedChain === chain.id ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {CHAIN_INFO[chain.id]?.icon} {CHAIN_INFO[chain.id]?.name || `Chain ${chain.id}`}
            </button>
          ))}
        </div>
      )}

      {/* Token List */}
      {showTokenList && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ ...tokenRowStyle, backgroundColor: isDark ? '#374151' : '#f3f4f6', height: '60px', animation: 'pulse 2s infinite' }} />
            ))
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#ef4444' }}>{error}</div>
          ) : filteredTokens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: isDark ? '#9ca3af' : '#6b7280' }}>No tokens found</div>
          ) : (
            filteredTokens.map((token, index) => (
              <div
                key={`${token.chainId}-${token.symbol}-${index}`}
                style={{
                  ...tokenRowStyle,
                  backgroundColor: 'transparent',
                }}
                onClick={() => onTokenClick?.(token)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#374151' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isDark ? '#ffffff' : '#111827',
                  }}>
                    {token.logoURI ? (
                      <img src={token.logoURI} alt={token.symbol} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    ) : (
                      token.symbol.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isDark ? '#ffffff' : '#111827', fontWeight: 600 }}>{token.symbol}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '4px',
                        color: isDark ? '#9ca3af' : '#6b7280',
                      }}>
                        {CHAIN_INFO[token.chainId]?.name || token.chain}
                      </span>
                    </div>
                    <span style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                      {formatBalance(token.balanceFormatted)} {token.symbol}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: isDark ? '#ffffff' : '#111827', fontWeight: 600 }}>
                    {formatUSD(token.balanceUsd)}
                  </div>
                  {showPriceChange && (
                    <div style={{ fontSize: '14px', color: token.priceChange24h >= 0 ? '#10b981' : '#ef4444' }}>
                      {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ===== Compact Balance Display =====

export function OneBalanceDisplay({
  theme = 'dark',
  className,
  style,
}: Pick<OneWalletBalanceProps, 'theme' | 'className' | 'style'>) {
  return (
    <OneWalletBalance
      theme={theme}
      className={className}
      style={style}
      showTotalBalance={true}
      showTokenList={false}
      showChainFilter={false}
      compact={true}
    />
  );
}
