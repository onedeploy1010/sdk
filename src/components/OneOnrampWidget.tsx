'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { getEngineUrl } from '../config';

// ===== Types =====

export interface OneOnrampWidgetProps {
  // Configuration
  defaultFiat?: string;
  defaultCrypto?: string;
  defaultAmount?: number;
  defaultNetwork?: string;

  // Currency options
  supportedFiats?: string[];
  supportedCryptos?: string[];
  supportedNetworks?: string[];

  // User info (pre-fill)
  email?: string;
  country?: string;

  // Appearance
  theme?: 'light' | 'dark';
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;

  // Display mode
  mode?: 'form' | 'embed' | 'popup';
  embedHeight?: number;

  // Callbacks
  onSuccess?: (transaction: OnrampTransaction) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  onQuoteUpdate?: (quote: OnrampQuote) => void;
}

export interface OnrampQuote {
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  network: string;
  rate: number;
  fees: {
    network: number;
    provider: number;
    total: number;
  };
  estimatedTime: string;
}

export interface OnrampTransaction {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount?: number;
  walletAddress: string;
  txHash?: string;
  provider: string;
}

// ===== Default Values =====

const DEFAULT_FIATS = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KRW', 'CAD', 'AUD'];
const DEFAULT_CRYPTOS = ['USDT', 'USDC', 'ETH', 'BTC', 'MATIC', 'BNB', 'AVAX', 'SOL'];
const DEFAULT_NETWORKS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche'];

const NETWORK_DISPLAY_NAMES: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  base: 'Base',
  bsc: 'BNB Chain',
  avalanche: 'Avalanche',
  solana: 'Solana',
};

// Approximate rates for quote estimation
const CRYPTO_RATES: Record<string, number> = {
  ETH: 3500,
  BTC: 95000,
  USDT: 1,
  USDC: 1,
  MATIC: 0.85,
  BNB: 650,
  AVAX: 42,
  SOL: 200,
  DAI: 1,
  ARB: 1.2,
  OP: 2.5,
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

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const selectStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '12px',
  fontSize: '16px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '40px',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '12px',
  fontSize: '18px',
  fontWeight: 500,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
};

const quoteBoxStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  fontSize: '14px',
};

// ===== Component =====

export function OneOnrampWidget({
  defaultFiat = 'USD',
  defaultCrypto = 'USDT',
  defaultAmount = 100,
  defaultNetwork = 'base',
  supportedFiats = DEFAULT_FIATS,
  supportedCryptos = DEFAULT_CRYPTOS,
  supportedNetworks = DEFAULT_NETWORKS,
  email,
  country,
  theme = 'dark',
  accentColor = '#10b981',
  className,
  style,
  mode = 'form',
  embedHeight = 600,
  onSuccess,
  onError,
  onClose,
  onQuoteUpdate,
}: OneOnrampWidgetProps) {
  const account = useActiveAccount();
  const walletAddress = account?.address;

  // Form state
  const [fiatCurrency, setFiatCurrency] = useState(defaultFiat);
  const [fiatAmount, setFiatAmount] = useState(defaultAmount.toString());
  const [cryptoCurrency, setCryptoCurrency] = useState(defaultCrypto);
  const [network, setNetwork] = useState(defaultNetwork);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<OnrampQuote | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Calculate estimated quote
  const calculateQuote = useCallback((): OnrampQuote | null => {
    const amount = parseFloat(fiatAmount);
    if (isNaN(amount) || amount <= 0) return null;

    const cryptoRate = CRYPTO_RATES[cryptoCurrency.toUpperCase()] || 1;
    const providerFee = amount * 0.035; // ~3.5% provider fee
    const networkFee = cryptoCurrency === 'ETH' ? 5 : 1;
    const totalFee = providerFee + networkFee;
    const netAmount = amount - totalFee;
    const cryptoAmount = netAmount / cryptoRate;

    return {
      fiatCurrency,
      fiatAmount: amount,
      cryptoCurrency,
      cryptoAmount: parseFloat(cryptoAmount.toFixed(8)),
      network,
      rate: cryptoRate,
      fees: {
        network: networkFee,
        provider: providerFee,
        total: totalFee,
      },
      estimatedTime: '5-15 minutes',
    };
  }, [fiatAmount, fiatCurrency, cryptoCurrency, network]);

  // Update quote when inputs change
  useEffect(() => {
    const newQuote = calculateQuote();
    setQuote(newQuote);
    if (newQuote) {
      onQuoteUpdate?.(newQuote);
    }
  }, [calculateQuote, onQuoteUpdate]);

  // Build Onramper widget URL
  const buildWidgetUrl = useCallback(() => {
    if (!walletAddress) return null;

    const baseUrl = 'https://buy.onramper.com';
    const params = new URLSearchParams();

    // API key from engine or env
    const apiKey = process.env.NEXT_PUBLIC_ONRAMPER_API_KEY || '';
    if (apiKey) {
      params.append('apiKey', apiKey);
    }

    // Wallet addresses (same address for all EVM chains - Smart Account)
    params.append('wallets', `ETH:${walletAddress},MATIC:${walletAddress},BNB:${walletAddress},AVAX:${walletAddress}`);
    params.append('networkWallets',
      `ethereum:${walletAddress},polygon:${walletAddress},arbitrum:${walletAddress},` +
      `optimism:${walletAddress},base:${walletAddress},bsc:${walletAddress},avalanche:${walletAddress}`
    );

    // Default selections
    params.append('defaultCrypto', cryptoCurrency);
    params.append('defaultFiat', fiatCurrency);
    params.append('defaultAmount', fiatAmount);
    params.append('mode', 'buy');

    // Network filter
    if (network) {
      params.append('onlyCryptoNetworks', network);
    }

    // User info
    if (email) params.append('email', email);
    if (country) params.append('country', country);

    // UI customization
    params.append('color', accentColor.replace('#', ''));
    params.append('darkMode', isDark ? 'true' : 'false');
    params.append('hideTopBar', 'false');
    params.append('isInAppBrowser', 'true');

    // Tracking
    params.append('partnerContext', `onesdk_${Date.now()}`);
    params.append('popularCryptos', 'USDT,USDC,ETH,BTC');

    return `${baseUrl}?${params.toString()}`;
  }, [walletAddress, cryptoCurrency, fiatCurrency, fiatAmount, network, email, country, accentColor, isDark]);

  // Handle buy button click
  const handleBuy = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(fiatAmount);
    if (isNaN(amount) || amount < 10) {
      setError('Minimum amount is $10');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to create session via Engine API first
      const engineUrl = getEngineUrl();
      const response = await fetch(`${engineUrl}/v1/fiat/onramp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          fiatCurrency,
          fiatAmount: amount,
          cryptoCurrency,
          network,
          email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.widgetUrl) {
          setWidgetUrl(data.data.widgetUrl);
          if (mode === 'popup') {
            window.open(data.data.widgetUrl, '_blank', 'width=450,height=700');
          }
          return;
        }
      }

      // Fallback to direct Onramper URL
      const directUrl = buildWidgetUrl();
      if (directUrl) {
        setWidgetUrl(directUrl);
        if (mode === 'popup') {
          window.open(directUrl, '_blank', 'width=450,height=700');
        }
      } else {
        throw new Error('Failed to generate widget URL');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start purchase');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing embed
  const handleCloseEmbed = () => {
    setWidgetUrl(null);
    onClose?.();
  };

  // Theme colors
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f3f4f6';
  const quoteBg = isDark ? '#374151' : '#f3f4f6';

  // Embed mode - show iframe
  if (mode === 'embed' && widgetUrl) {
    return (
      <div className={className} style={{ ...style }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={handleCloseEmbed}
            style={{
              background: 'none',
              border: 'none',
              color: mutedColor,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        </div>
        <iframe
          src={widgetUrl}
          width="100%"
          height={embedHeight}
          style={{ border: 'none', borderRadius: '16px' }}
          allow="payment; clipboard-read; clipboard-write"
        />
      </div>
    );
  }

  // Form mode
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
      <div style={headerStyle}>
        <h3 style={{ color: textColor, margin: 0, fontSize: '18px', fontWeight: 600 }}>
          Buy Crypto
        </h3>
        <span style={{ color: mutedColor, fontSize: '12px' }}>
          Powered by Onramper
        </span>
      </div>

      {/* Fiat Input */}
      <div>
        <label style={{ color: mutedColor, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
          You Pay
        </label>
        <div style={rowStyle}>
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            placeholder="0"
            min="10"
            style={{
              ...inputStyle,
              flex: 1,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          />
          <select
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value)}
            style={{
              ...selectStyle,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              minWidth: '100px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '16px',
            }}
          >
            {supportedFiats.map((fiat) => (
              <option key={fiat} value={fiat}>{fiat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crypto Output */}
      <div>
        <label style={{ color: mutedColor, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
          You Receive
        </label>
        <div style={rowStyle}>
          <div
            style={{
              ...inputStyle,
              flex: 1,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: quote ? textColor : mutedColor }}>
              {quote ? `~${quote.cryptoAmount.toFixed(6)}` : '0.00'}
            </span>
          </div>
          <select
            value={cryptoCurrency}
            onChange={(e) => setCryptoCurrency(e.target.value)}
            style={{
              ...selectStyle,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              minWidth: '100px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '16px',
            }}
          >
            {supportedCryptos.map((crypto) => (
              <option key={crypto} value={crypto}>{crypto}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Network Selection */}
      <div>
        <label style={{ color: mutedColor, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
          Network
        </label>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          style={{
            ...selectStyle,
            width: '100%',
            backgroundColor: inputBg,
            border: `1px solid ${borderColor}`,
            color: textColor,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%239ca3af' : '%236b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundSize: '16px',
          }}
        >
          {supportedNetworks.map((net) => (
            <option key={net} value={net}>
              {NETWORK_DISPLAY_NAMES[net] || net}
            </option>
          ))}
        </select>
      </div>

      {/* Quote Summary */}
      {quote && (
        <div style={{ ...quoteBoxStyle, backgroundColor: quoteBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: mutedColor }}>Rate</span>
            <span style={{ color: textColor }}>
              1 {cryptoCurrency} = ${quote.rate.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: mutedColor }}>Fees</span>
            <span style={{ color: textColor }}>
              ~${quote.fees.total.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: mutedColor }}>Est. Time</span>
            <span style={{ color: textColor }}>{quote.estimatedTime}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '14px',
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
        }}>
          {error}
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={isLoading || !walletAddress}
        style={{
          ...buttonStyle,
          backgroundColor: isLoading || !walletAddress ? '#6b7280' : accentColor,
          color: '#ffffff',
          cursor: isLoading || !walletAddress ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Loading...' : !walletAddress ? 'Connect Wallet' : `Buy ${cryptoCurrency}`}
      </button>

      {/* Wallet Address Display */}
      {walletAddress && (
        <div style={{ textAlign: 'center', color: mutedColor, fontSize: '12px' }}>
          Receiving to: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}
    </div>
  );
}

// ===== Presets =====

export function OneBuyUSDTWidget(props: Omit<OneOnrampWidgetProps, 'defaultCrypto'>) {
  return <OneOnrampWidget {...props} defaultCrypto="USDT" />;
}

export function OneBuyUSDCWidget(props: Omit<OneOnrampWidgetProps, 'defaultCrypto'>) {
  return <OneOnrampWidget {...props} defaultCrypto="USDC" />;
}

export function OneBuyETHWidget(props: Omit<OneOnrampWidgetProps, 'defaultCrypto'>) {
  return <OneOnrampWidget {...props} defaultCrypto="ETH" />;
}

export function OneBuyBTCWidget(props: Omit<OneOnrampWidgetProps, 'defaultCrypto'>) {
  return <OneOnrampWidget {...props} defaultCrypto="BTC" />;
}
