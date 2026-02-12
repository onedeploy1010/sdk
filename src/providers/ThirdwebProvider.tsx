'use client';

import React, { type ReactNode, useMemo, useEffect, useState } from 'react';
import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { ThirdwebProvider as BaseThirdwebProvider } from 'thirdweb/react';
import { inAppWallet, smartWallet } from 'thirdweb/wallets';
import type { Chain } from 'thirdweb/chains';
import { base, ethereum, polygon, arbitrum, optimism } from 'thirdweb/chains';

// ===== Types =====

export interface OneThirdwebConfig {
  // Engine URL to fetch thirdweb config (clientId managed by Engine)
  engineUrl?: string;
  // Or use pre-configured ONE ecosystem clientId (fetched from Engine)
  // Users do NOT need to provide their own clientId
  appName?: string;
  appIcon?: string;
  defaultChain?: Chain;
  supportedChains?: Chain[];
  sponsorGas?: boolean;
  authOptions?: {
    email?: boolean;
    phone?: boolean;
    google?: boolean;
    apple?: boolean;
    facebook?: boolean;
    discord?: boolean;
    passkey?: boolean;
    guest?: boolean;
  };
}

export interface OneThirdwebProviderProps {
  children: ReactNode;
  config?: OneThirdwebConfig;
}

// ===== Default Configuration =====

const DEFAULT_CHAINS: Chain[] = [base, ethereum, polygon, arbitrum, optimism];

const DEFAULT_AUTH_OPTIONS = {
  email: true,
  phone: false,
  google: true,
  apple: true,
  facebook: false,
  discord: false,
  passkey: true,
  guest: false,
};

// ===== Context for Client Access =====

const ThirdwebClientContext = React.createContext<ThirdwebClient | null>(null);

export function useThirdwebClient(): ThirdwebClient {
  const client = React.useContext(ThirdwebClientContext);
  if (!client) {
    throw new Error('useThirdwebClient must be used within OneThirdwebProvider');
  }
  return client;
}

// ===== Create Wallets Configuration =====

function createWalletConfig(config: OneThirdwebConfig) {
  const authOptions = { ...DEFAULT_AUTH_OPTIONS, ...config.authOptions };

  // Build auth options array
  const authMethods: string[] = [];
  if (authOptions.google) authMethods.push('google');
  if (authOptions.apple) authMethods.push('apple');
  if (authOptions.facebook) authMethods.push('facebook');
  if (authOptions.discord) authMethods.push('discord');
  if (authOptions.passkey) authMethods.push('passkey');

  // Create in-app wallet with email and social logins
  const inApp = inAppWallet({
    auth: {
      options: authMethods as any[],
    },
    metadata: config.appName ? {
      name: config.appName,
      image: config.appIcon ? { src: config.appIcon, width: 100, height: 100 } : undefined,
    } : undefined,
  });

  // If gas sponsorship is enabled, wrap in smart wallet
  if (config.sponsorGas) {
    const chain = config.defaultChain || base;
    return [
      smartWallet({
        chain,
        sponsorGas: true,
      }),
    ];
  }

  return [inApp];
}

// ===== Default Engine URL =====
const DEFAULT_ENGINE_URL = process.env.NEXT_PUBLIC_ONE_ENGINE_URL || '/api';

// ===== Provider Component =====

export function OneThirdwebProvider({
  children,
  config = {},
}: OneThirdwebProviderProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clientId from Engine on mount
  // Engine manages the Thirdweb clientId centrally
  useEffect(() => {
    const fetchClientConfig = async () => {
      try {
        const engineUrl = config.engineUrl || DEFAULT_ENGINE_URL;
        const response = await fetch(`${engineUrl}/api/v1/config/thirdweb`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.clientId) {
            setClientId(data.data.clientId);
          } else {
            // Fallback to environment variable if API fails
            const envClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
            if (envClientId) {
              setClientId(envClientId);
            } else {
              setError('Failed to load wallet configuration');
            }
          }
        } else {
          // Fallback to environment variable
          const envClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
          if (envClientId) {
            setClientId(envClientId);
          } else {
            setError('Wallet service unavailable');
          }
        }
      } catch (err) {
        // Fallback to environment variable on network error
        const envClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
        if (envClientId) {
          setClientId(envClientId);
        } else {
          console.error('Failed to fetch thirdweb config:', err);
          setError('Failed to initialize wallet');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientConfig();
  }, [config.engineUrl]);

  // Create thirdweb client once we have clientId
  const client = useMemo(() => {
    if (!clientId) return null;
    return createThirdwebClient({ clientId });
  }, [clientId]);

  // Create wallet configuration
  const wallets = useMemo(() => createWalletConfig(config), [config]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
        <span style={{ color: '#9ca3af' }}>Initializing wallet...</span>
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
        <span style={{ color: '#ef4444' }}>{error || 'Wallet initialization failed'}</span>
      </div>
    );
  }

  return (
    <ThirdwebClientContext.Provider value={client}>
      <BaseThirdwebProvider>
        {children}
      </BaseThirdwebProvider>
    </ThirdwebClientContext.Provider>
  );
}

// ===== Export wallets for external use =====

export { inAppWallet, smartWallet } from 'thirdweb/wallets';
export { base, ethereum, polygon, arbitrum, optimism } from 'thirdweb/chains';
