'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import type { Chain } from 'thirdweb/chains';
import { base, ethereum, polygon, arbitrum } from 'thirdweb/chains';

// ===== Types =====

export interface OneReceiveWidgetProps {
  // Display options
  chains?: Chain[];
  defaultChain?: Chain;
  showChainSelector?: boolean;
  showCopyButton?: boolean;
  showQRCode?: boolean;

  // Appearance
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  qrSize?: number;

  // Callbacks
  onCopy?: (address: string) => void;
  onChainChange?: (chain: Chain) => void;
}

// ===== QR Code Generator (Simple SVG-based) =====

function generateQRMatrix(data: string): boolean[][] {
  // Simple QR-like pattern generator (for demo - in production use a proper QR library)
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  // Add finder patterns
  const addFinderPattern = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          matrix[y + i][x + j] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(14, 0);
  addFinderPattern(0, 14);

  // Add data pattern based on address hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }

  for (let i = 8; i < 13; i++) {
    for (let j = 8; j < 13; j++) {
      matrix[i][j] = ((hash >> ((i * 21 + j) % 32)) & 1) === 1;
    }
  }

  return matrix;
}

function QRCode({ data, size = 200, isDark = true }: { data: string; size?: number; isDark?: boolean }) {
  const matrix = generateQRMatrix(data);
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill={isDark ? '#ffffff' : '#ffffff'} rx="8" />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill={isDark ? '#111827' : '#111827'}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ===== Styles =====

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  padding: '24px',
  backgroundColor: '#1f2937',
  borderRadius: '16px',
  border: '1px solid #374151',
};

const addressStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  backgroundColor: '#374151',
  borderRadius: '12px',
  maxWidth: '100%',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
};

// ===== Chain Info =====

const CHAIN_INFO: Record<number, { name: string; icon: string }> = {
  1: { name: 'Ethereum', icon: '⟠' },
  8453: { name: 'Base', icon: '🔵' },
  137: { name: 'Polygon', icon: '🟣' },
  42161: { name: 'Arbitrum', icon: '🔷' },
  10: { name: 'Optimism', icon: '🔴' },
};

// ===== Component =====

export function OneReceiveWidget({
  chains = [base, ethereum, polygon, arbitrum],
  defaultChain = base,
  showChainSelector = true,
  showCopyButton = true,
  showQRCode = true,
  theme = 'dark',
  className,
  style,
  qrSize = 200,
  onCopy,
  onChainChange,
}: OneReceiveWidgetProps) {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState<Chain>(defaultChain);
  const [copied, setCopied] = useState(false);

  const address = account?.address || '';
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      onCopy?.(address);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleChainChange = (chain: Chain) => {
    setSelectedChain(chain);
    onChainChange?.(chain);
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', padding: '24px', color: isDark ? '#9ca3af' : '#6b7280' }}>
        Connect your wallet to receive funds
      </div>
    );
  }

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
      <h3 style={{ margin: 0, color: isDark ? '#ffffff' : '#111827', fontSize: '18px', fontWeight: 600 }}>
        Receive
      </h3>

      {/* Chain Selector */}
      {showChainSelector && chains.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {chains.map(chain => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain)}
              style={{
                padding: '8px 12px',
                backgroundColor: selectedChain.id === chain.id ? '#10b981' : (isDark ? '#374151' : '#e5e7eb'),
                border: 'none',
                borderRadius: '8px',
                color: selectedChain.id === chain.id ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {CHAIN_INFO[chain.id]?.icon} {CHAIN_INFO[chain.id]?.name}
            </button>
          ))}
        </div>
      )}

      {/* QR Code */}
      {showQRCode && (
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px' }}>
          <QRCode data={address} size={qrSize} isDark={isDark} />
        </div>
      )}

      {/* Address Display */}
      <div style={{ ...addressStyle, backgroundColor: isDark ? '#374151' : '#f3f4f6', width: '100%' }}>
        <span style={{
          color: isDark ? '#ffffff' : '#111827',
          fontSize: '14px',
          fontFamily: 'monospace',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {address}
        </span>
      </div>

      {/* Copy Button */}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          style={{
            ...buttonStyle,
            backgroundColor: copied ? '#059669' : '#10b981',
            width: '100%',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy Address'}
        </button>
      )}

      {/* Warning */}
      <p style={{
        margin: 0,
        color: isDark ? '#9ca3af' : '#6b7280',
        fontSize: '12px',
        textAlign: 'center',
      }}>
        Only send {CHAIN_INFO[selectedChain.id]?.name || 'compatible'} assets to this address
      </p>
    </div>
  );
}
