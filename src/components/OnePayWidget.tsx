'use client';

import React from 'react';
import { PayEmbed, type PayEmbedProps } from 'thirdweb/react';
import { base, ethereum, polygon, arbitrum } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers/ThirdwebProvider';

// ===== Types =====

export type PayMode = 'fund_wallet' | 'direct_payment' | 'transaction';

export interface OnePayWidgetProps {
  // Mode configuration
  mode?: PayMode;

  // For direct_payment mode
  recipientAddress?: string;
  amount?: string;
  tokenAddress?: string;
  chainId?: number;

  // For transaction mode
  transaction?: any; // PreparedTransaction from thirdweb

  // Appearance
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;

  // Payment options
  buyWithCrypto?: boolean;
  buyWithFiat?: boolean;

  // Supported tokens (token addresses per chain)
  supportedTokens?: {
    [chainId: number]: string[];
  };

  // Callbacks
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

// ===== Default Configuration =====

const DEFAULT_SUPPORTED_TOKENS = {
  [base.id]: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  ],
  [ethereum.id]: [
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
  ],
  [polygon.id]: [
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC on Polygon
  ],
  [arbitrum.id]: [
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  ],
};

// ===== Component =====

export function OnePayWidget({
  mode = 'fund_wallet',
  recipientAddress,
  amount,
  tokenAddress,
  chainId,
  transaction,
  theme = 'dark',
  className,
  style,
  buyWithCrypto = true,
  buyWithFiat = true,
  supportedTokens = DEFAULT_SUPPORTED_TOKENS,
  onSuccess,
  onError,
  onCancel,
}: OnePayWidgetProps) {
  const client = useThirdwebClient();

  // Build pay options based on mode
  let payOptions: PayEmbedProps['payOptions'];

  switch (mode) {
    case 'direct_payment':
      if (!recipientAddress) {
        console.warn('OnePayWidget: recipientAddress required for direct_payment mode');
      }
      payOptions = {
        mode: 'direct_payment',
        paymentInfo: {
          sellerAddress: recipientAddress || '',
          amount: amount || '0',
          chain: chainId ? { id: chainId } as any : base,
          token: tokenAddress ? { address: tokenAddress } as any : undefined,
        },
        buyWithCrypto: buyWithCrypto ? {} : false,
        buyWithFiat: buyWithFiat ? {} : false,
      };
      break;

    case 'transaction':
      if (!transaction) {
        console.warn('OnePayWidget: transaction required for transaction mode');
      }
      payOptions = {
        mode: 'transaction',
        transaction,
        buyWithCrypto: buyWithCrypto ? {} : false,
        buyWithFiat: buyWithFiat ? {} : false,
      };
      break;

    case 'fund_wallet':
    default:
      payOptions = {
        mode: 'fund_wallet',
        buyWithCrypto: buyWithCrypto ? {} : false,
        buyWithFiat: buyWithFiat ? {} : false,
      };
      break;
  }

  return (
    <div className={className} style={style}>
      <PayEmbed
        client={client}
        payOptions={payOptions}
        theme={theme}
        supportedTokens={supportedTokens as any}
      />
    </div>
  );
}

// ===== Presets =====

export function OneFundWalletWidget(props: Omit<OnePayWidgetProps, 'mode'>) {
  return <OnePayWidget {...props} mode="fund_wallet" />;
}

export function OneDirectPayWidget(
  props: Omit<OnePayWidgetProps, 'mode'> & {
    recipientAddress: string;
    amount: string;
  }
) {
  return <OnePayWidget {...props} mode="direct_payment" />;
}

export function OneCryptoOnlyPayWidget(props: Omit<OnePayWidgetProps, 'buyWithFiat'>) {
  return <OnePayWidget {...props} buyWithFiat={false} />;
}

export function OneFiatOnlyPayWidget(props: Omit<OnePayWidgetProps, 'buyWithCrypto'>) {
  return <OnePayWidget {...props} buyWithCrypto={false} />;
}
