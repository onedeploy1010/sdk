'use client';

import React from 'react';
import { TransactionButton, type TransactionButtonProps } from 'thirdweb/react';
import { prepareTransaction, type PreparedTransaction } from 'thirdweb';
import type { Chain } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers';

// ===== Types =====

export interface OneTransactionButtonProps {
  // Transaction config
  to: string;
  value?: bigint;
  data?: `0x${string}`;
  chain: Chain;

  // Or use prepared transaction directly
  transaction?: PreparedTransaction;

  // Appearance
  label?: string;
  loadingLabel?: string;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;

  // Callbacks
  onSuccess?: (result: { transactionHash: string }) => void;
  onError?: (error: Error) => void;
  onSubmitted?: (txHash: string) => void;
}

// ===== ONE Theme Styles =====

const ONE_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 600,
  borderRadius: '12px',
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const ONE_BUTTON_DISABLED_STYLE: React.CSSProperties = {
  ...ONE_BUTTON_STYLE,
  backgroundColor: '#6b7280',
  cursor: 'not-allowed',
};

// ===== Component =====

export function OneTransactionButton({
  to,
  value,
  data,
  chain,
  transaction: preparedTx,
  label = 'Send Transaction',
  loadingLabel = 'Processing...',
  theme = 'dark',
  className,
  style,
  disabled = false,
  onSuccess,
  onError,
  onSubmitted,
}: OneTransactionButtonProps) {
  const client = useThirdwebClient();

  // Show loading state if client is not ready
  if (!client && !preparedTx) {
    return (
      <button
        disabled
        className={className}
        style={{ ...ONE_BUTTON_DISABLED_STYLE, ...style, opacity: 0.5 }}
      >
        Initializing...
      </button>
    );
  }

  // Prepare transaction if not already provided
  const transaction = preparedTx || (client ? prepareTransaction({
    to,
    value,
    data,
    chain,
    client,
  }) : null);

  if (!transaction) {
    return (
      <button
        disabled
        className={className}
        style={{ ...ONE_BUTTON_DISABLED_STYLE, ...style, opacity: 0.5 }}
      >
        Initializing...
      </button>
    );
  }

  const buttonStyle = disabled
    ? { ...ONE_BUTTON_DISABLED_STYLE, ...style }
    : { ...ONE_BUTTON_STYLE, ...style };

  return (
    <TransactionButton
      transaction={() => transaction}
      onTransactionSent={(result) => onSubmitted?.(result.transactionHash)}
      onTransactionConfirmed={(result) => onSuccess?.({ transactionHash: result.transactionHash })}
      onError={onError}
      disabled={disabled}
      style={buttonStyle}
      className={className}
      theme={theme}
    >
      {label}
    </TransactionButton>
  );
}

// ===== Presets =====

export interface OneSendETHButtonProps extends Omit<OneTransactionButtonProps, 'data'> {
  amount: string; // in ETH
}

export function OneSendETHButton({
  amount,
  ...props
}: OneSendETHButtonProps) {
  const valueInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

  return (
    <OneTransactionButton
      {...props}
      value={valueInWei}
      label={props.label || `Send ${amount} ETH`}
    />
  );
}

export interface OneApproveButtonProps extends Omit<OneTransactionButtonProps, 'to' | 'data' | 'value'> {
  tokenAddress: string;
  spenderAddress: string;
  amount?: bigint; // Max uint256 by default
}

export function OneApproveButton({
  tokenAddress,
  spenderAddress,
  amount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
  chain,
  ...props
}: OneApproveButtonProps) {
  // ERC20 approve function selector + encoded params
  const approveData = `0x095ea7b3${spenderAddress.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}` as `0x${string}`;

  return (
    <OneTransactionButton
      {...props}
      to={tokenAddress}
      data={approveData}
      chain={chain}
      label={props.label || 'Approve Token'}
    />
  );
}
