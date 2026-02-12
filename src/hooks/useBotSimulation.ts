/**
 * ONE SDK - Bot Simulation Hook
 * Provides React hook for subscribing to BotSimulationEngine events
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { BotLogEntry, BotState, StrategyPersonality } from '../services/forex/BotSimulationEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseBotSimulationOptions {
  maxLogs?: number;
  strategyIds?: string[];
  userPairs?: string[];
  userChains?: string[];
  autoStart?: boolean;
}

export interface UseBotSimulationResult {
  /** All log entries from all strategies */
  logs: BotLogEntry[];
  /** Logs grouped by strategy ID */
  logsByStrategy: Map<string, BotLogEntry[]>;
  /** Current state for each strategy */
  botStates: Map<string, BotState>;
  /** Whether simulation is currently running */
  isRunning: boolean;
  /** Available strategies */
  strategies: StrategyPersonality[];
  /** Start the simulation */
  start: (strategyIds?: string[], userPairs?: string[], userChains?: string[]) => void;
  /** Stop the simulation */
  stop: (strategyIds?: string[]) => void;
  /** Clear all logs */
  clearLogs: () => void;
  /** Emit boot sequence messages */
  emitBootSequence: () => void;
  /** Get state for a specific strategy */
  getBotState: (strategyId: string) => BotState | undefined;
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useBotSimulation(options?: UseBotSimulationOptions): UseBotSimulationResult {
  const maxLogs = options?.maxLogs ?? 500;
  const [logs, setLogs] = useState<BotLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [strategies, setStrategies] = useState<StrategyPersonality[]>([]);
  const [botStatesMap, setBotStatesMap] = useState<Map<string, BotState>>(new Map());
  const engineRef = useRef<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Lazy load the engine
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      try {
        const { botSimulationEngine } = require('../services/forex/BotSimulationEngine');
        engineRef.current = botSimulationEngine;
        setStrategies(botSimulationEngine.getStrategies());
      } catch {
        // Engine not available
      }
    }
    return engineRef.current;
  }, []);

  // Group logs by strategy
  const logsByStrategy = useMemo(() => {
    const grouped = new Map<string, BotLogEntry[]>();
    for (const log of logs) {
      const existing = grouped.get(log.strategyId) || [];
      grouped.set(log.strategyId, [...existing, log]);
    }
    return grouped;
  }, [logs]);

  // Start simulation
  const start = useCallback((
    strategyIds?: string[],
    userPairs?: string[],
    userChains?: string[]
  ) => {
    const engine = getEngine();
    if (!engine) return;

    const ids = strategyIds || options?.strategyIds;
    const pairs = userPairs || options?.userPairs;
    const chains = userChains || options?.userChains;

    if (!engine.isRunning()) {
      engine.start(ids, pairs, chains);
    }
    setIsRunning(true);
  }, [getEngine, options?.strategyIds, options?.userPairs, options?.userChains]);

  // Stop simulation
  const stop = useCallback((strategyIds?: string[]) => {
    const engine = getEngine();
    if (engine) {
      engine.stop(strategyIds);
      if (!strategyIds) {
        setIsRunning(false);
      }
    }
  }, [getEngine]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Emit boot sequence
  const emitBootSequence = useCallback(() => {
    const engine = getEngine();
    if (engine) {
      engine.emitBootSequence();
    }
  }, [getEngine]);

  // Get state for specific strategy
  const getBotState = useCallback((strategyId: string): BotState | undefined => {
    return botStatesMap.get(strategyId);
  }, [botStatesMap]);

  // Subscribe to engine events
  useEffect(() => {
    const engine = getEngine();
    if (!engine) return;

    // Check if already running
    setIsRunning(engine.isRunning());

    // Subscribe to log events
    unsubRef.current = engine.onLog((entry: BotLogEntry) => {
      setLogs(prev => {
        const next = [...prev, entry];
        return next.length > maxLogs ? next.slice(-maxLogs) : next;
      });

      // Update bot states
      const state = engine.getBotState(entry.strategyId);
      if (state) {
        setBotStatesMap(prev => {
          const next = new Map(prev);
          next.set(entry.strategyId, state);
          return next;
        });
      }
    });

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [getEngine, maxLogs]);

  // Auto-start if configured
  useEffect(() => {
    if (options?.autoStart) {
      const engine = getEngine();
      if (engine && !engine.isRunning()) {
        emitBootSequence();
        setTimeout(() => {
          start();
        }, 5500); // After boot sequence completes
      }
    }
  }, [options?.autoStart, getEngine, emitBootSequence, start]);

  // Periodically update bot states
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const engine = getEngine();
      if (engine) {
        const states = engine.getAllBotStates();
        if (states.size > 0) {
          setBotStatesMap(new Map(states));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, getEngine]);

  return {
    logs,
    logsByStrategy,
    botStates: botStatesMap,
    isRunning,
    strategies,
    start,
    stop,
    clearLogs,
    emitBootSequence,
    getBotState,
  };
}
