/**
 * OneChainSelector - Multi-chain selection component for AI trading
 * Part of ONE Ecosystem SDK - can be used by any ecosystem partner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

// Chain configuration with branding
export const CHAIN_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  ethereum: { name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  arbitrum: { name: 'Arbitrum', icon: '◆', color: '#28A0F0' },
  bsc: { name: 'BSC', icon: '◆', color: '#F3BA2F' },
  base: { name: 'Base', icon: '●', color: '#0052FF' },
  polygon: { name: 'Polygon', icon: '⬡', color: '#8247E5' },
  optimism: { name: 'Optimism', icon: '◉', color: '#FF0420' },
  avalanche: { name: 'Avalanche', icon: '▲', color: '#E84142' },
  linea: { name: 'Linea', icon: '═', color: '#121212' },
  zksync: { name: 'zkSync', icon: '⬢', color: '#8C8DFC' },
  scroll: { name: 'Scroll', icon: '◎', color: '#FFEEDA' },
};

export interface OneChainSelectorProps {
  /** List of supported chain IDs */
  supportedChains: string[];
  /** Currently selected chains */
  selectedChains: string[];
  /** Callback when chain selection changes */
  onSelectChain: (chain: string) => void;
  /** Enable multi-select (default: true) */
  multiSelect?: boolean;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Minimum required selections (for multi-select) */
  minSelections?: number;
  /** Custom styles */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
}

export const OneChainSelector: React.FC<OneChainSelectorProps> = ({
  supportedChains,
  selectedChains,
  onSelectChain,
  multiSelect = true,
  accentColor = '#188775',
  title,
  subtitle,
  minSelections = 1,
  style,
  titleStyle,
}) => {
  const handleSelect = (chain: string) => {
    if (multiSelect) {
      // In multi-select, prevent deselecting if at minimum
      if (selectedChains.includes(chain) && selectedChains.length <= minSelections) {
        return;
      }
      onSelectChain(chain);
    } else {
      // Single select - always allow selection
      if (!selectedChains.includes(chain)) {
        onSelectChain(chain);
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.chainsContainer}>
        {supportedChains.map((chain) => {
          const chainInfo = CHAIN_CONFIG[chain] || { name: chain, icon: '●', color: '#888' };
          const isSelected = selectedChains.includes(chain);

          return (
            <TouchableOpacity
              key={chain}
              style={[
                styles.chainChip,
                isSelected && styles.chainChipSelected,
                isSelected && { borderColor: accentColor, backgroundColor: accentColor + '15' }
              ]}
              onPress={() => handleSelect(chain)}
              activeOpacity={0.7}
            >
              <View style={[styles.chainIconBg, { backgroundColor: chainInfo.color + '20' }]}>
                <Text style={[styles.chainIcon, { color: chainInfo.color }]}>{chainInfo.icon}</Text>
              </View>
              <Text style={[
                styles.chainText,
                isSelected && { color: accentColor, fontWeight: '600' }
              ]}>
                {chainInfo.name}
              </Text>
              {isSelected && (
                <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {multiSelect && selectedChains.length > 0 && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedText}>
            {selectedChains.length} chain{selectedChains.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  chainsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    gap: 8,
  },
  chainChipSelected: {
    borderWidth: 2,
  },
  chainIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  chainText: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedInfo: {
    marginTop: 8,
    paddingVertical: 4,
  },
  selectedText: {
    fontSize: 12,
    color: '#888',
  },
});
