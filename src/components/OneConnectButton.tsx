'use client';

import React from 'react';
import { ConnectButton, type ConnectButtonProps } from 'thirdweb/react';
import { inAppWallet, smartWallet } from 'thirdweb/wallets';
import { base } from 'thirdweb/chains';
import { useThirdwebClient } from '../providers/ThirdwebProvider';

// ===== Types =====

export interface OneConnectButtonProps {
  // Appearance
  label?: string;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;

  // Chain config
  chain?: Parameters<typeof smartWallet>[0]['chain'];
  sponsorGas?: boolean;

  // Auth options
  authOptions?: {
    email?: boolean;
    google?: boolean;
    apple?: boolean;
    discord?: boolean;
    passkey?: boolean;
  };

  // Callbacks
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;

  // Account abstraction
  accountAbstraction?: {
    chain: Parameters<typeof smartWallet>[0]['chain'];
    sponsorGas?: boolean;
  };
}

// ===== Default Theme =====

const ONE_THEME = {
  colors: {
    primaryButtonBg: '#10b981', // emerald-500
    primaryButtonText: '#ffffff',
    accentButtonBg: '#059669', // emerald-600
    modalBg: '#1f2937', // gray-800
    borderColor: '#374151', // gray-700
    separatorLine: '#374151',
    secondaryText: '#9ca3af', // gray-400
    primaryText: '#ffffff',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
};

// ===== Component =====

export function OneConnectButton({
  label = 'Connect Wallet',
  theme = 'dark',
  className,
  style,
  chain = base,
  sponsorGas = true,
  authOptions = {
    email: true,
    google: true,
    apple: true,
    discord: false,
    passkey: true,
  },
  onConnect,
  onDisconnect,
  accountAbstraction,
}: OneConnectButtonProps) {
  const client = useThirdwebClient();

  // Build auth methods
  const authMethods: string[] = ['email'];
  if (authOptions.google) authMethods.push('google');
  if (authOptions.apple) authMethods.push('apple');
  if (authOptions.discord) authMethods.push('discord');
  if (authOptions.passkey) authMethods.push('passkey');

  // Create in-app wallet
  const wallet = inAppWallet({
    auth: {
      options: authMethods as any[],
    },
  });

  // Build connect button props
  const connectProps: Partial<ConnectButtonProps> = {
    client,
    wallets: [wallet],
    connectButton: {
      label,
      style: {
        backgroundColor: ONE_THEME.colors.primaryButtonBg,
        color: ONE_THEME.colors.primaryButtonText,
        fontFamily: ONE_THEME.fontFamily,
        fontWeight: 600,
        borderRadius: '12px',
        padding: '12px 24px',
        ...style,
      },
      className,
    },
    theme: theme === 'dark' ? 'dark' : 'light',
  };

  // Add account abstraction if sponsoring gas
  if (sponsorGas || accountAbstraction) {
    connectProps.accountAbstraction = {
      chain: accountAbstraction?.chain || chain,
      sponsorGas: accountAbstraction?.sponsorGas ?? sponsorGas,
    };
  }

  return <ConnectButton {...(connectProps as ConnectButtonProps)} />;
}

// ===== Presets =====

export function OneConnectButtonSimple(props: Omit<OneConnectButtonProps, 'authOptions'>) {
  return (
    <OneConnectButton
      {...props}
      authOptions={{ email: true, google: true, apple: false, passkey: false }}
    />
  );
}

export function OneConnectButtonFull(props: Omit<OneConnectButtonProps, 'authOptions'>) {
  return (
    <OneConnectButton
      {...props}
      authOptions={{ email: true, google: true, apple: true, discord: true, passkey: true }}
    />
  );
}
