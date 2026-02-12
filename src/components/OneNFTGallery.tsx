'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { MediaRenderer } from 'thirdweb/react';
import { useThirdwebClient } from '../providers';

// ===== Types =====

export interface NFTItem {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  chain: string;
  chainId: number;
  collection?: {
    name: string;
    image?: string;
  };
}

export interface OneNFTGalleryProps {
  // Data source
  nfts?: NFTItem[];
  fetchEndpoint?: string;

  // Display options
  columns?: 2 | 3 | 4;
  showCollection?: boolean;
  showChain?: boolean;

  // Appearance
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;

  // Callbacks
  onNFTClick?: (nft: NFTItem) => void;
  onTransfer?: (nft: NFTItem) => void;
}

// ===== Styles =====

const galleryStyle: React.CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #374151',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const imageContainerStyle: React.CSSProperties = {
  aspectRatio: '1',
  backgroundColor: '#374151',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const infoStyle: React.CSSProperties = {
  padding: '12px',
};

// ===== Component =====

export function OneNFTGallery({
  nfts: propNfts,
  fetchEndpoint = '/api/v1/assets/nft',
  columns = 3,
  showCollection = true,
  showChain = true,
  theme = 'dark',
  className,
  style,
  onNFTClick,
  onTransfer,
}: OneNFTGalleryProps) {
  const client = useThirdwebClient();
  const account = useActiveAccount();

  const [nfts, setNfts] = useState<NFTItem[]>(propNfts || []);
  const [isLoading, setIsLoading] = useState(!propNfts);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  // Fetch NFTs
  const fetchNFTs = useCallback(async () => {
    if (!account?.address || propNfts) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${fetchEndpoint}?address=${account.address}`);
      const data = await response.json();

      if (data.success && data.data) {
        setNfts(data.data.nfts || []);
      } else {
        setError(data.error?.message || 'Failed to fetch NFTs');
      }
    } catch (err) {
      setError('Failed to load NFTs');
    } finally {
      setIsLoading(false);
    }
  }, [account?.address, fetchEndpoint, propNfts]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  useEffect(() => {
    if (propNfts) {
      setNfts(propNfts);
    }
  }, [propNfts]);

  const isDark = theme === 'dark';

  const gridColumns = {
    2: 'repeat(2, 1fr)',
    3: 'repeat(3, 1fr)',
    4: 'repeat(4, 1fr)',
  };

  if (isLoading) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', padding: '40px', color: isDark ? '#9ca3af' : '#6b7280' }}>
        Loading NFTs...
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', padding: '40px', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className={className} style={{ ...style, textAlign: 'center', padding: '40px', color: isDark ? '#9ca3af' : '#6b7280' }}>
        No NFTs found
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <div style={{ ...galleryStyle, gridTemplateColumns: gridColumns[columns] }}>
        {nfts.map((nft) => (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            style={{
              ...cardStyle,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            }}
            onClick={() => {
              setSelectedNFT(nft);
              onNFTClick?.(nft);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...imageContainerStyle, backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
              {nft.image && client ? (
                <MediaRenderer
                  client={client}
                  src={nft.image}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : nft.image ? (
                <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '14px' }}>No Image</span>
              )}
            </div>
            <div style={infoStyle}>
              <h4 style={{ margin: '0 0 4px 0', color: isDark ? '#ffffff' : '#111827', fontSize: '14px', fontWeight: 600 }}>
                {nft.name || `#${nft.tokenId}`}
              </h4>
              {showCollection && nft.collection && (
                <p style={{ margin: 0, color: isDark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>
                  {nft.collection.name}
                </p>
              )}
              {showChain && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '2px 8px',
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}>
                  {nft.chain}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedNFT(null)}
        >
          <div
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedNFT.image && (
              client ? (
                <MediaRenderer
                  client={client}
                  src={selectedNFT.image}
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }}
                />
              ) : (
                <img src={selectedNFT.image} alt={selectedNFT.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '16px' }} />
              )
            )}
            <h3 style={{ margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#111827' }}>
              {selectedNFT.name || `#${selectedNFT.tokenId}`}
            </h3>
            {selectedNFT.description && (
              <p style={{ margin: '0 0 16px 0', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
                {selectedNFT.description}
              </p>
            )}
            {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {selectedNFT.attributes.map((attr, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isDark ? '#374151' : '#f3f4f6',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: isDark ? '#9ca3af' : '#6b7280' }}>{attr.trait_type}</div>
                    <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#111827', fontWeight: 500 }}>{attr.value}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedNFT(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              {onTransfer && (
                <button
                  onClick={() => {
                    onTransfer(selectedNFT);
                    setSelectedNFT(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Transfer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
