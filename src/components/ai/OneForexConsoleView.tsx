/**
 * OneForexConsoleView - Displays live forex trading console log feed
 * Part of ONE Ecosystem SDK
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import type { ForexLogEntry, ForexLogType } from '../../types/forex';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const TYPE_COLORS: Record<ForexLogType, string> = {
  RFQ: '#06B6D4',
  QUOTE: '#8B5CF6',
  MATCH: '#10B981',
  SETTLE: '#F59E0B',
  PVP: '#3B82F6',
  HEDGE: '#EC4899',
  CLEAR: '#14B8A6',
  POSITION: '#6366F1',
  PNL: '#22C55E',
  SYSTEM: '#9CA3AF',
};

export interface OneForexConsoleViewProps {
  /** Array of log entries to display */
  logs: ForexLogEntry[];
  /** Maximum visible entries */
  maxItems?: number;
  /** Auto-scroll to bottom */
  autoScroll?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Console height */
  height?: number;
}

export const OneForexConsoleView: React.FC<OneForexConsoleViewProps> = ({
  logs,
  maxItems = 100,
  autoScroll = true,
  style,
  height = 400,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const visibleLogs = logs.slice(-maxItems);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [logs.length, autoScroll]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {visibleLogs.map((log) => (
          <View key={log.id} style={styles.logRow}>
            <Text style={styles.timestamp}>{formatTime(log.timestamp)}</Text>
            <Text style={[styles.type, { color: TYPE_COLORS[log.type] || '#9CA3AF' }]}>
              {log.type.padEnd(8)}
            </Text>
            <Text style={[
              styles.message,
              log.importance === 'high' && styles.messageHigh,
            ]} numberOfLines={2}>
              {log.message}
            </Text>
          </View>
        ))}
        {visibleLogs.length === 0 && (
          <Text style={styles.emptyText}>Waiting for trading activity...</Text>
        )}
      </ScrollView>
    </View>
  );
};

// Terminal palette – always dark regardless of app theme
const T = {
  base: '#0A0A0C',
  border: '#2A2A35',
  muted: '#555560',
  secondary: '#9CA3AF',
};

const styles = StyleSheet.create({
  container: { backgroundColor: T.base, borderRadius: 8, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { padding: 8 },
  logRow: { flexDirection: 'row', paddingVertical: 3 },
  timestamp: { fontFamily: MONO, fontSize: 10, color: T.muted, width: 60, marginRight: 6 },
  type: { fontFamily: MONO, fontSize: 10, fontWeight: '700', width: 65, marginRight: 6 },
  message: { fontFamily: MONO, fontSize: 10, color: T.secondary, flex: 1 },
  messageHigh: { color: '#ffffff', fontWeight: '600' },
  emptyText: { fontFamily: MONO, fontSize: 11, color: T.muted, textAlign: 'center', paddingVertical: 40 },
});
