/**
 * OneChainSelector - Multi-chain selection component with dropdown style
 * Part of ONE Ecosystem SDK - Responsive design for desktop and mobile
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, Modal, ScrollView, Pressable, Dimensions, Platform } from 'react-native';

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

export const OneChainSelector: React.FC<OneChainSelectorProps> = ({
  supportedChains,
  selectedChains,
  onSelectChain,
  multiSelect = true,
  accentColor = '#188775',
  title,
  subtitle,
  minSelections = 1,
  placeholder = 'Select chains...',
  style,
  titleStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const desktop = isDesktop();

  const handleSelect = (chain: string) => {
    if (multiSelect) {
      if (selectedChains.includes(chain) && selectedChains.length <= minSelections) {
        return;
      }
      onSelectChain(chain);
    } else {
      if (!selectedChains.includes(chain)) {
        onSelectChain(chain);
      }
      setIsOpen(false);
    }
  };

  // Desktop: Inline grid display
  if (desktop) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.desktopGrid}>
          {supportedChains.map((chain) => {
            const chainInfo = CHAIN_CONFIG[chain] || { name: chain, icon: '●', color: '#888' };
            const isSelected = selectedChains.includes(chain);

            return (
              <TouchableOpacity
                key={chain}
                style={[
                  styles.desktopChip,
                  isSelected && styles.desktopChipSelected,
                  isSelected && { borderColor: accentColor, backgroundColor: accentColor + '12' }
                ]}
                onPress={() => handleSelect(chain)}
                activeOpacity={0.7}
              >
                <View style={[styles.desktopIconBg, { backgroundColor: chainInfo.color + '20' }]}>
                  <Text style={[styles.desktopIcon, { color: chainInfo.color }]}>{chainInfo.icon}</Text>
                </View>
                <Text style={[
                  styles.desktopChipText,
                  isSelected && { color: accentColor, fontWeight: '600' }
                ]}>
                  {chainInfo.name}
                </Text>
                {isSelected && (
                  <View style={[styles.desktopCheckbox, { backgroundColor: accentColor }]}>
                    <Text style={styles.desktopCheckIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {multiSelect && selectedChains.length > 0 && (
          <Text style={[styles.selectedCount, { color: accentColor }]}>
            {selectedChains.length} chain{selectedChains.length > 1 ? 's' : ''} selected
          </Text>
        )}
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
          {selectedChains.slice(0, 3).map((chain) => {
            const chainInfo = CHAIN_CONFIG[chain] || { name: chain, icon: '●', color: '#888' };
            return (
              <View key={chain} style={[styles.previewChip, { backgroundColor: chainInfo.color + '20' }]}>
                <Text style={[styles.previewIcon, { color: chainInfo.color }]}>{chainInfo.icon}</Text>
              </View>
            );
          })}
          {selectedChains.length > 3 && (
            <View style={styles.previewMore}>
              <Text style={styles.previewMoreText}>+{selectedChains.length - 3}</Text>
            </View>
          )}
          {selectedChains.length === 0 && (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {multiSelect && selectedChains.length > 0 && (
        <Text style={[styles.selectedCount, { color: accentColor }]}>
          {selectedChains.length} chain{selectedChains.length > 1 ? 's' : ''} selected
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title || 'Select Chains'}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {supportedChains.map((chain) => {
                const chainInfo = CHAIN_CONFIG[chain] || { name: chain, icon: '●', color: '#888' };
                const isSelected = selectedChains.includes(chain);

                return (
                  <TouchableOpacity
                    key={chain}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                      isSelected && { backgroundColor: accentColor + '10', borderColor: accentColor }
                    ]}
                    onPress={() => handleSelect(chain)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconBg, { backgroundColor: chainInfo.color + '20' }]}>
                      <Text style={[styles.optionIcon, { color: chainInfo.color }]}>{chainInfo.icon}</Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      isSelected && { color: accentColor, fontWeight: '600' }
                    ]}>
                      {chainInfo.name}
                    </Text>
                    {isSelected ? (
                      <View style={[styles.checkbox, { backgroundColor: accentColor }]}>
                        <Text style={styles.checkboxIcon}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.checkboxEmpty} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {multiSelect && (
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: accentColor }]}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.doneButtonText}>Done ({selectedChains.length})</Text>
              </TouchableOpacity>
            )}
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
  },
  desktopChipSelected: {
    borderWidth: 2,
  },
  desktopIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  desktopChipText: {
    fontSize: 14,
    color: '#444',
  },
  desktopCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
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
  selectedCount: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
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
    maxHeight: '70%',
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
  optionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
