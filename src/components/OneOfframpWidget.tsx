'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useWalletBalance } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers/ThirdwebProvider';
import { getEngineUrl } from '../config';

// ===== Types =====

export interface OneOfframpWidgetProps {
  // Configuration
  defaultFiat?: string;
  defaultCrypto?: string;
  defaultAmount?: string;
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
  onSuccess?: (transaction: OfframpTransaction) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  onQuoteUpdate?: (quote: OfframpQuote) => void;
}

export interface OfframpQuote {
  cryptoCurrency: string;
  cryptoAmount: number;
  fiatCurrency: string;
  fiatAmount: number;
  network: string;
  rate: number;
  fees: {
    network: number;
    provider: number;
    total: number;
  };
  estimatedTime: string;
}

export interface OfframpTransaction {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cryptoCurrency: string;
  cryptoAmount: number;
  fiatCurrency: string;
  fiatAmount?: number;
  walletAddress: string;
  txHash?: string;
  provider: string;
}

// ===== Default Values =====

const DEFAULT_FIATS = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KRW', 'CAD', 'AUD'];
const DEFAULT_CRYPTOS = ['USDT', 'USDC', 'ETH', 'BTC', 'MATIC', 'BNB'];
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

const balanceStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  marginTop: '4px',
};

// ===== Component =====

export function OneOfframpWidget({
  defaultFiat = 'USD',
  defaultCrypto = 'USDT',
  defaultAmount = '',
  defaultNetwork = 'base',
  supportedFiats = DEFAULT_FIATS,
  supportedCryptos = DEFAULT_CRYPTOS,
  supportedNetworks = DEFAULT_NETWORKS,
  email,
  country,
  theme = 'dark',
  accentColor = '#ef4444', // Red for sell
  className,
  style,
  mode = 'form',
  embedHeight = 600,
  onSuccess,
  onError,
  onClose,
  onQuoteUpdate,
}: OneOfframpWidgetProps) {
  const client = useThirdwebClient();
  const account = useActiveAccount();
  const walletAddress = account?.address;

  // Get balance for selected crypto
  const { data: balanceData } = useWalletBalance({
    client,
    chain: base,
    address: walletAddress,
  });

  // Form state
  const [cryptoCurrency, setCryptoCurrency] = useState(defaultCrypto);
  const [cryptoAmount, setCryptoAmount] = useState(defaultAmount);
  const [fiatCurrency, setFiatCurrency] = useState(defaultFiat);
  const [network, setNetwork] = useState(defaultNetwork);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<OfframpQuote | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Calculate estimated quote
  const calculateQuote = useCallback((): OfframpQuote | null => {
    const amount = parseFloat(cryptoAmount);
    if (isNaN(amount) || amount <= 0) return null;

    const cryptoRate = CRYPTO_RATES[cryptoCurrency.toUpperCase()] || 1;
    const grossAmount = amount * cryptoRate;
    const providerFee = grossAmount * 0.025; // ~2.5% provider fee for offramp
    const networkFee = cryptoCurrency === 'ETH' ? 5 : 1;
    const totalFee = providerFee + networkFee;
    const netAmount = grossAmount - totalFee;

    return {
      cryptoCurrency,
      cryptoAmount: amount,
      fiatCurrency,
      fiatAmount: parseFloat(netAmount.toFixed(2)),
      network,
      rate: cryptoRate,
      fees: {
        network: networkFee,
        provider: providerFee,
        total: totalFee,
      },
      estimatedTime: '1-3 business days',
    };
  }, [cryptoAmount, cryptoCurrency, fiatCurrency, network]);

  // Update quote when inputs change
  useEffect(() => {
    const newQuote = calculateQuote();
    setQuote(newQuote);
    if (newQuote) {
      onQuoteUpdate?.(newQuote);
    }
  }, [calculateQuote, onQuoteUpdate]);

  // Build Onramper widget URL (sell mode)
  const buildWidgetUrl = useCallback(() => {
    if (!walletAddress) return null;

    const baseUrl = 'https://buy.onramper.com';
    const params = new URLSearchParams();

    // API key from engine or env
    const apiKey = process.env.NEXT_PUBLIC_ONRAMPER_API_KEY || '';
    if (apiKey) {
      params.append('apiKey', apiKey);
    }

    // Wallet addresses
    params.append('wallets', `ETH:${walletAddress},MATIC:${walletAddress},BNB:${walletAddress}`);
    params.append('networkWallets',
      `ethereum:${walletAddress},polygon:${walletAddress},arbitrum:${walletAddress},` +
      `optimism:${walletAddress},base:${walletAddress},bsc:${walletAddress}`
    );

    // SELL MODE
    params.append('mode', 'sell');
    params.append('defaultCrypto', cryptoCurrency);
    params.append('defaultFiat', fiatCurrency);
    if (cryptoAmount) {
      params.append('sellDefaultAmount', cryptoAmount);
    }

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
    params.append('partnerContext', `onesdk_sell_${Date.now()}`);

    return `${baseUrl}?${params.toString()}`;
  }, [walletAddress, cryptoCurrency, fiatCurrency, cryptoAmount, network, email, country, accentColor, isDark]);

  // Handle sell button click
  const handleSell = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(cryptoAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check balance
    if (balanceData && cryptoCurrency === 'ETH') {
      const balance = parseFloat(balanceData.displayValue);
      if (amount > balance) {
        setError(`Insufficient balance. You have ${balance.toFixed(4)} ${cryptoCurrency}`);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try Engine API first
      const engineUrl = getEngineUrl();
      const response = await fetch(`${engineUrl}/v1/fiat/offramp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          cryptoCurrency,
          cryptoAmount: amount,
          fiatCurrency,
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

      // Fallback to direct URL
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
      const error = err instanceof Error ? err : new Error('Failed to start sale');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use max balance
  const handleUseMax = () => {
    if (balanceData && cryptoCurrency === 'ETH') {
      const balance = parseFloat(balanceData.displayValue);
      // Leave some for gas
      const maxAmount = Math.max(0, balance - 0.005);
      setCryptoAmount(maxAmount.toFixed(6));
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
          Sell Crypto
        </h3>
        <span style={{ color: mutedColor, fontSize: '12px' }}>
          Cash out to bank
        </span>
      </div>

      {/* Crypto Input */}
      <div>
        <label style={{ color: mutedColor, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
          You Sell
        </label>
        <div style={rowStyle}>
          <input
            type="number"
            value={cryptoAmount}
            onChange={(e) => setCryptoAmount(e.target.value)}
            placeholder="0.0"
            min="0"
            step="any"
            style={{
              ...inputStyle,
              flex: 1,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              color: textColor,
            }}
          />
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
        {/* Balance row */}
        {balanceData && cryptoCurrency === 'ETH' && (
          <div style={balanceStyle}>
            <span style={{ color: mutedColor }}>
              Balance: {parseFloat(balanceData.displayValue).toFixed(4)} ETH
            </span>
            <button
              onClick={handleUseMax}
              style={{
                background: 'none',
                border: 'none',
                color: accentColor,
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0,
              }}
            >
              Use Max
            </button>
          </div>
        )}
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

      {/* Fiat Output */}
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
              {quote ? `~$${quote.fiatAmount.toLocaleString()}` : '$0.00'}
            </span>
          </div>
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
            <span style={{ color: mutedColor }}>Est. Arrival</span>
            <span style={{ color: textColor }}>{quote.estimatedTime}</span>
          </div>
        </div>
      )}

      {/* Warning */}
      <div style={{
        padding: '12px',
        backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.15)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#fbbf24',
      }}>
        Bank transfers typically take 1-3 business days. KYC verification may be required.
      </div>

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

      {/* Sell Button */}
      <button
        onClick={handleSell}
        disabled={isLoading || !walletAddress}
        style={{
          ...buttonStyle,
          backgroundColor: isLoading || !walletAddress ? '#6b7280' : accentColor,
          color: '#ffffff',
          cursor: isLoading || !walletAddress ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Loading...' : !walletAddress ? 'Connect Wallet' : `Sell ${cryptoCurrency}`}
      </button>

      {/* Wallet Address Display */}
      {walletAddress && (
        <div style={{ textAlign: 'center', color: mutedColor, fontSize: '12px' }}>
          Selling from: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}
    </div>
  );
}

// ===== Presets =====

export function OneSellUSDTWidget(props: Omit<OneOfframpWidgetProps, 'defaultCrypto'>) {
  return <OneOfframpWidget {...props} defaultCrypto="USDT" />;
}

export function OneSellUSDCWidget(props: Omit<OneOfframpWidgetProps, 'defaultCrypto'>) {
  return <OneOfframpWidget {...props} defaultCrypto="USDC" />;
}

export function OneSellETHWidget(props: Omit<OneOfframpWidgetProps, 'defaultCrypto'>) {
  return <OneOfframpWidget {...props} defaultCrypto="ETH" />;
}
