'use client';

import React, { useState, useCallback } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { prepareTransaction, toWei } from 'thirdweb';
import type { Chain } from 'thirdweb/chains';
import { base } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers/ThirdwebProvider';

// ===== Types =====

export interface OneSendWidgetProps {
  // Default values
  defaultRecipient?: string;
  defaultAmount?: string;
  defaultChain?: Chain;

  // Token config (if sending ERC20)
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;

  // Appearance
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;

  // Callbacks
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

// ===== Styles =====

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '24px',
  backgroundColor: '#1f2937',
  borderRadius: '16px',
  border: '1px solid #374151',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#374151',
  border: '1px solid #4b5563',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '14px',
  marginBottom: '4px',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const buttonDisabledStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#6b7280',
  cursor: 'not-allowed',
};

// ===== Component =====

export function OneSendWidget({
  defaultRecipient = '',
  defaultAmount = '',
  defaultChain = base,
  tokenAddress,
  tokenSymbol = 'ETH',
  tokenDecimals = 18,
  theme = 'dark',
  className,
  style,
  onSuccess,
  onError,
  onCancel,
}: OneSendWidgetProps) {
  const client = useThirdwebClient();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const [recipient, setRecipient] = useState(defaultRecipient);
  const [amount, setAmount] = useState(defaultAmount);
  const [error, setError] = useState<string | null>(null);

  const isValidAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);
  const isValidAmount = (amt: string) => !isNaN(parseFloat(amt)) && parseFloat(amt) > 0;

  const canSend = isValidAddress(recipient) && isValidAmount(amount) && !isPending;

  const handleSend = useCallback(async () => {
    if (!account || !canSend) return;

    setError(null);

    try {
      let tx;

      if (tokenAddress) {
        // ERC20 transfer
        const amountInWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenDecimals)));
        const transferData = `0xa9059cbb${recipient.slice(2).padStart(64, '0')}${amountInWei.toString(16).padStart(64, '0')}` as `0x${string}`;

        tx = prepareTransaction({
          to: tokenAddress,
          data: transferData,
          chain: defaultChain,
          client,
        });
      } else {
        // Native token transfer
        tx = prepareTransaction({
          to: recipient as `0x${string}`,
          value: toWei(amount),
          chain: defaultChain,
          client,
        });
      }

      sendTransaction(tx, {
        onSuccess: (result) => {
          onSuccess?.(result.transactionHash);
          setRecipient('');
          setAmount('');
        },
        onError: (err) => {
          setError(err.message);
          onError?.(err);
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error.message);
      onError?.(error);
    }
  }, [account, canSend, recipient, amount, tokenAddress, tokenDecimals, defaultChain, client, sendTransaction, onSuccess, onError]);

  const isDark = theme === 'dark';

  return (
    <div
      className={className}
      style={{
        ...containerStyle,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        ...style,
      }}
    >
      <h3 style={{ color: isDark ? '#ffffff' : '#111827', margin: 0, fontSize: '18px', fontWeight: 600 }}>
        Send {tokenSymbol}
      </h3>

      <div>
        <label style={{ ...labelStyle, color: isDark ? '#9ca3af' : '#6b7280' }}>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          style={{
            ...inputStyle,
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            color: isDark ? '#ffffff' : '#111827',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
          }}
        />
      </div>

      <div>
        <label style={{ ...labelStyle, color: isDark ? '#9ca3af' : '#6b7280' }}>Amount ({tokenSymbol})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          min="0"
          step="any"
          style={{
            ...inputStyle,
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            color: isDark ? '#ffffff' : '#111827',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
          }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '14px', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              ...buttonStyle,
              flex: 1,
              backgroundColor: 'transparent',
              border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
              color: isDark ? '#9ca3af' : '#6b7280',
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={canSend ? { ...buttonStyle, flex: 1 } : { ...buttonDisabledStyle, flex: 1 }}
        >
          {isPending ? 'Sending...' : `Send ${tokenSymbol}`}
        </button>
      </div>
    </div>
  );
}

// ===== Presets =====

export function OneSendETHWidget(props: Omit<OneSendWidgetProps, 'tokenAddress' | 'tokenSymbol' | 'tokenDecimals'>) {
  return <OneSendWidget {...props} tokenSymbol="ETH" tokenDecimals={18} />;
}

export function OneSendUSDCWidget(props: Omit<OneSendWidgetProps, 'tokenSymbol' | 'tokenDecimals'> & { tokenAddress: string }) {
  return <OneSendWidget {...props} tokenSymbol="USDC" tokenDecimals={6} />;
}
