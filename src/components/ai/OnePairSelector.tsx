/**
 * OnePairSelector - Trading pair selection component with dropdown style
 * Part of ONE Ecosystem SDK - Responsive design for desktop and mobile
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Modal, ScrollView, Pressable, Dimensions, Platform } from 'react-native';

// Common trading pairs with icons
export const PAIR_CONFIG: Record<string, { symbol: string; name: string; icon: string; color: string }> = {
  'BTC': { symbol: 'BTC/USDT', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  'ETH': { symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  'BNB': { symbol: 'BNB/USDT', name: 'BNB', icon: '◆', color: '#F3BA2F' },
  'SOL': { symbol: 'SOL/USDT', name: 'Solana', icon: '◎', color: '#9945FF' },
  'XRP': { symbol: 'XRP/USDT', name: 'Ripple', icon: '✕', color: '#23292F' },
  'DOGE': { symbol: 'DOGE/USDT', name: 'Dogecoin', icon: 'Ð', color: '#C2A633' },
  'ADA': { symbol: 'ADA/USDT', name: 'Cardano', icon: '₳', color: '#0033AD' },
  'AVAX': { symbol: 'AVAX/USDT', name: 'Avalanche', icon: '▲', color: '#E84142' },
  'DOT': { symbol: 'DOT/USDT', name: 'Polkadot', icon: '●', color: '#E6007A' },
  'MATIC': { symbol: 'MATIC/USDT', name: 'Polygon', icon: '⬡', color: '#8247E5' },
  'LINK': { symbol: 'LINK/USDT', name: 'Chainlink', icon: '◇', color: '#375BD2' },
  'UNI': { symbol: 'UNI/USDT', name: 'Uniswap', icon: '🦄', color: '#FF007A' },
  'ATOM': { symbol: 'ATOM/USDT', name: 'Cosmos', icon: '⚛', color: '#2E3148' },
  'LTC': { symbol: 'LTC/USDT', name: 'Litecoin', icon: 'Ł', color: '#345D9D' },
  'ARB': { symbol: 'ARB/USDT', name: 'Arbitrum', icon: '◆', color: '#28A0F0' },
  'OP': { symbol: 'OP/USDT', name: 'Optimism', icon: '◉', color: '#FF0420' },
};

// Legacy mapping for backward compatibility
export const PAIR_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(PAIR_CONFIG).map(([key, value]) => [`${key}/USDT`, value.icon])
);

export interface OnePairSelectorProps {
  /** List of supported trading pair IDs (e.g., 'BTC', 'ETH') */
  supportedPairs: string[];
  /** Currently selected pair IDs */
  selectedPairs: string[];
  /** Callback when pair selection changes */
  onTogglePair: (pair: string) => void;
  /** Accent color for selected state */
  accentColor?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Minimum required selections */
  minSelections?: number;
  /** Maximum allowed selections (0 = unlimited) */
  maxSelections?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Custom styles */
  style?: ViewStyle;
  /** Custom title style */
  titleStyle?: TextStyle;
}

const isDesktop = () => {
  const { width } = Dimensions.get('window');
  return Platform.OS === 'web' && width >= 768;
};

export const OnePairSelector: React.FC<OnePairSelectorProps> = ({
  supportedPairs,
  selectedPairs,
  onTogglePair,
  accentColor = '#188775',
  title,
  subtitle,
  minSelections = 1,
  maxSelections = 0,
  placeholder = 'Select trading pairs...',
  style,
  titleStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const desktop = isDesktop();

  const handleToggle = (pair: string) => {
    const isSelected = selectedPairs.includes(pair);

    if (isSelected && selectedPairs.length <= minSelections) {
      return;
    }

    if (!isSelected && maxSelections > 0 && selectedPairs.length >= maxSelections) {
      return;
    }

    onTogglePair(pair);
  };

  const getPairInfo = (pair: string) => {
    return PAIR_CONFIG[pair] || { symbol: `${pair}/USDT`, name: pair, icon: '●', color: '#888' };
  };

  // Desktop: Inline grid display
  if (desktop) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.desktopGrid}>
          {supportedPairs.map((pair) => {
            const pairInfo = getPairInfo(pair);
            const isSelected = selectedPairs.includes(pair);
            const isDisabled = !isSelected && maxSelections > 0 && selectedPairs.length >= maxSelections;

            return (
              <TouchableOpacity
                key={pair}
                style={[
                  styles.desktopChip,
                  isSelected && styles.desktopChipSelected,
                  isSelected && { borderColor: accentColor, backgroundColor: accentColor + '12' },
                  isDisabled && styles.desktopChipDisabled,
                ]}
                onPress={() => handleToggle(pair)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <View style={[styles.desktopIconBg, { backgroundColor: pairInfo.color + '20' }]}>
                  <Text style={[styles.desktopIcon, { color: pairInfo.color }]}>{pairInfo.icon}</Text>
                </View>
                <View>
                  <Text style={[
                    styles.desktopChipText,
                    isSelected && { color: accentColor, fontWeight: '600' },
                    isDisabled && styles.desktopTextDisabled,
                  ]}>
                    {pair}
                  </Text>
                  <Text style={[styles.desktopChipSubtext, isDisabled && styles.desktopTextDisabled]}>
                    {pairInfo.name}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.desktopCheckbox, { backgroundColor: accentColor }]}>
                    <Text style={styles.desktopCheckIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.selectedCount, { color: accentColor }]}>
            {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected
          </Text>
          {(minSelections > 0 || maxSelections > 0) && (
            <Text style={styles.limitText}>
              {minSelections > 0 && `min: ${minSelections}`}
              {minSelections > 0 && maxSelections > 0 && ' / '}
              {maxSelections > 0 && `max: ${maxSelections}`}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Mobile: Dropdown modal
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <TouchableOpacity
        style={[styles.dropdownTrigger, { borderColor: isOpen ? accentColor : '#e5e5e5' }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedPreview}>
          {selectedPairs.slice(0, 4).map((pair) => {
            const pairInfo = getPairInfo(pair);
            return (
              <View key={pair} style={[styles.previewChip, { backgroundColor: pairInfo.color + '20' }]}>
                <Text style={[styles.previewIcon, { color: pairInfo.color }]}>{pairInfo.icon}</Text>
              </View>
            );
          })}
          {selectedPairs.length > 4 && (
            <View style={styles.previewMore}>
              <Text style={styles.previewMoreText}>+{selectedPairs.length - 4}</Text>
            </View>
          )}
          {selectedPairs.length === 0 && (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <View style={styles.infoRow}>
        <Text style={[styles.selectedCount, { color: accentColor }]}>
          {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected
        </Text>
        {(minSelections > 0 || maxSelections > 0) && (
          <Text style={styles.limitText}>
            {minSelections > 0 && `min: ${minSelections}`}
            {minSelections > 0 && maxSelections > 0 && ' / '}
            {maxSelections > 0 && `max: ${maxSelections}`}
          </Text>
        )}
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title || 'Select Trading Pairs'}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {supportedPairs.map((pair) => {
                const pairInfo = getPairInfo(pair);
                const isSelected = selectedPairs.includes(pair);
                const isDisabled = !isSelected && maxSelections > 0 && selectedPairs.length >= maxSelections;

                return (
                  <TouchableOpacity
                    key={pair}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                      isSelected && { backgroundColor: accentColor + '10', borderColor: accentColor },
                      isDisabled && styles.optionItemDisabled,
                    ]}
                    onPress={() => handleToggle(pair)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: pairInfo.color + '20' }]}>
                      <Text style={[styles.optionIcon, { color: pairInfo.color }]}>{pairInfo.icon}</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionSymbol,
                        isSelected && { color: accentColor, fontWeight: '600' },
                        isDisabled && styles.optionTextDisabled,
                      ]}>
                        {pair}
                      </Text>
                      <Text style={[styles.optionName, isDisabled && styles.optionTextDisabled]}>
                        {pairInfo.name}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={[styles.checkbox, { backgroundColor: accentColor }]}>
                        <Text style={styles.checkboxIcon}>✓</Text>
                      </View>
                    ) : (
                      <View style={[styles.checkboxEmpty, isDisabled && styles.checkboxDisabled]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: accentColor }]}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.doneButtonText}>Done ({selectedPairs.length})</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  // Desktop styles
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  desktopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    gap: 10,
    cursor: 'pointer' as any,
    minWidth: 140,
  },
  desktopChipSelected: {
    borderWidth: 2,
  },
  desktopChipDisabled: {
    opacity: 0.5,
  },
  desktopIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  desktopChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  desktopChipSubtext: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  desktopTextDisabled: {
    color: '#bbb',
  },
  desktopCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto' as any,
  },
  desktopCheckIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  // Mobile dropdown styles
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    minHeight: 52,
  },
  selectedPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewMore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  previewMoreText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  selectedCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  limitText: {
    fontSize: 11,
    color: '#888',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 20,
    color: '#888',
    padding: 4,
  },
  optionsList: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    gap: 12,
  },
  optionItemSelected: {
    borderWidth: 1,
  },
  optionItemDisabled: {
    opacity: 0.5,
  },
  optionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionSymbol: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  optionName: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  optionTextDisabled: {
    color: '#bbb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIcon: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  checkboxDisabled: {
    borderColor: '#eee',
  },
  doneButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
