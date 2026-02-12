/**
 * ONE SDK - AI Risk Status Hook
 * Provides React hook for monitoring trading risk status and limits
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RiskStatus, RiskLevel, TradingStatus } from '../types/console';
import { DEFAULT_RISK_STATUS, calculateRiskLevel } from '../types/console';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseAIRiskStatusOptions {
  strategyId?: string;
  pollInterval?: number;
  simulation?: boolean;
}

export interface UseAIRiskStatusResult {
  riskStatus: RiskStatus;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Computed values
  isWithinLimits: boolean;
  canTrade: boolean;
  riskLevel: RiskLevel;
  tradingStatus: TradingStatus;
  warnings: string[];
  // Actions
  pauseTrading: () => Promise<boolean>;
  resumeTrading: () => Promise<boolean>;
  resetDailyLimits: () => Promise<boolean>;
}

// ── Simulation Data Generator ─────────────────────────────────────────────────

function generateSimulatedRiskStatus(): RiskStatus {
  const totalExposure = Math.random() * 80000 + 10000;
  const maxExposure = 100000;
  const exposurePercent = (totalExposure / maxExposure) * 100;

  const dailyPnl = (Math.random() - 0.3) * 3000;
  const dailyPnlLimit = 5000;
  const dailyPnlPercent = (Math.abs(dailyPnl) / dailyPnlLimit) * 100;

  const currentDrawdown = Math.random() * 10;
  const maxDrawdown = 15;
  const drawdownPercent = (currentDrawdown / maxDrawdown) * 100;

  const openPositions = Math.floor(Math.random() * 8);
  const maxPositions = 10;

  const dailyTradeCount = Math.floor(Math.random() * 30);
  const dailyTradeLimit = 50;

  const riskLevel = calculateRiskLevel(exposurePercent, drawdownPercent, dailyPnlPercent);

  const warnings: string[] = [];
  if (exposurePercent > 70) warnings.push('High portfolio exposure');
  if (drawdownPercent > 60) warnings.push('Approaching max drawdown');
  if (dailyPnlPercent > 80 && dailyPnl < 0) warnings.push('Daily loss limit warning');
  if (openPositions >= maxPositions - 1) warnings.push('Position limit nearly reached');

  let tradingStatus: TradingStatus = 'active';
  if (riskLevel === 'critical') tradingStatus = 'stopped';
  else if (riskLevel === 'high' && warnings.length > 1) tradingStatus = 'paused';

  const strategyRisks: Record<string, { exposure: number; drawdown: number; riskLevel: RiskLevel }> = {
    'balanced-01': {
      exposure: Math.random() * 30000,
      drawdown: Math.random() * 5,
      riskLevel: Math.random() > 0.7 ? 'medium' : 'low',
    },
    'conservative-01': {
      exposure: Math.random() * 20000,
      drawdown: Math.random() * 3,
      riskLevel: 'low',
    },
    'aggressive-01': {
      exposure: Math.random() * 40000,
      drawdown: Math.random() * 8,
      riskLevel: Math.random() > 0.5 ? 'high' : 'medium',
    },
  };

  return {
    timestamp: Date.now(),
    totalExposure,
    maxExposure,
    exposurePercent,
    dailyPnl,
    dailyPnlLimit,
    dailyPnlPercent,
    dailyTradeCount,
    dailyTradeLimit,
    currentDrawdown,
    maxDrawdown,
    drawdownPercent,
    openPositions,
    maxPositions,
    riskLevel,
    tradingStatus,
    warnings,
    strategyRisks,
  };
}

// ── Hook Implementation ───────────────────────────────────────────────────────

export function useAIRiskStatus(options?: UseAIRiskStatusOptions): UseAIRiskStatusResult {
  const [riskStatus, setRiskStatus] = useState<RiskStatus>(DEFAULT_RISK_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (options?.simulation) {
        const simulated = generateSimulatedRiskStatus();
        setRiskStatus(simulated);
      } else {
        let path = '/api/v1/ai-quant/risk-status';
        if (options?.strategyId) {
          path += `?strategyId=${options.strategyId}`;
        }

        const res = await fetch(`https://api.one23.io${path}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setRiskStatus(mapRiskStatus(data));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk status');
    } finally {
      setIsLoading(false);
    }
  }, [options?.simulation, options?.strategyId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchRiskStatus();
    if (options?.pollInterval) {
      const timer = setInterval(fetchRiskStatus, options.pollInterval);
      return () => clearInterval(timer);
    }
  }, [fetchRiskStatus, options?.pollInterval]);

  // Actions
  const pauseTrading = useCallback(async (): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setRiskStatus(prev => ({ ...prev, tradingStatus: 'paused' }));
        return true;
      }
      const res = await fetch('https://api.one23.io/api/v1/ai-quant/trading/pause', {
        method: 'POST',
      });
      if (res.ok) {
        setRiskStatus(prev => ({ ...prev, tradingStatus: 'paused' }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  const resumeTrading = useCallback(async (): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setRiskStatus(prev => ({ ...prev, tradingStatus: 'active' }));
        return true;
      }
      const res = await fetch('https://api.one23.io/api/v1/ai-quant/trading/resume', {
        method: 'POST',
      });
      if (res.ok) {
        setRiskStatus(prev => ({ ...prev, tradingStatus: 'active' }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  const resetDailyLimits = useCallback(async (): Promise<boolean> => {
    try {
      if (options?.simulation) {
        setRiskStatus(prev => ({
          ...prev,
          dailyPnl: 0,
          dailyPnlPercent: 0,
          dailyTradeCount: 0,
          warnings: prev.warnings.filter(w => !w.includes('Daily')),
        }));
        return true;
      }
      const res = await fetch('https://api.one23.io/api/v1/ai-quant/risk/reset-daily', {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [options?.simulation]);

  // Computed values
  const isWithinLimits = useMemo(() => {
    return (
      riskStatus.exposurePercent < 90 &&
      riskStatus.drawdownPercent < 90 &&
      riskStatus.dailyPnlPercent < 90 &&
      riskStatus.openPositions < riskStatus.maxPositions
    );
  }, [riskStatus]);

  const canTrade = useMemo(() => {
    return riskStatus.tradingStatus === 'active' && isWithinLimits;
  }, [riskStatus.tradingStatus, isWithinLimits]);

  return {
    riskStatus,
    isLoading,
    error,
    refresh: fetchRiskStatus,
    isWithinLimits,
    canTrade,
    riskLevel: riskStatus.riskLevel,
    tradingStatus: riskStatus.tradingStatus,
    warnings: riskStatus.warnings,
    pauseTrading,
    resumeTrading,
    resetDailyLimits,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function mapRiskStatus(raw: any): RiskStatus {
  const exposurePercent = raw.maxExposure > 0
    ? (raw.totalExposure / raw.maxExposure) * 100
    : 0;
  const dailyPnlPercent = raw.dailyPnlLimit > 0
    ? (Math.abs(raw.dailyPnl) / raw.dailyPnlLimit) * 100
    : 0;
  const drawdownPercent = raw.maxDrawdown > 0
    ? (raw.currentDrawdown / raw.maxDrawdown) * 100
    : 0;

  return {
    timestamp: raw.timestamp ?? Date.now(),
    totalExposure: raw.totalExposure ?? raw.total_exposure ?? 0,
    maxExposure: raw.maxExposure ?? raw.max_exposure ?? 100000,
    exposurePercent,
    dailyPnl: raw.dailyPnl ?? raw.daily_pnl ?? 0,
    dailyPnlLimit: raw.dailyPnlLimit ?? raw.daily_pnl_limit ?? 5000,
    dailyPnlPercent,
    dailyTradeCount: raw.dailyTradeCount ?? raw.daily_trade_count ?? 0,
    dailyTradeLimit: raw.dailyTradeLimit ?? raw.daily_trade_limit ?? 50,
    currentDrawdown: raw.currentDrawdown ?? raw.current_drawdown ?? 0,
    maxDrawdown: raw.maxDrawdown ?? raw.max_drawdown ?? 15,
    drawdownPercent,
    openPositions: raw.openPositions ?? raw.open_positions ?? 0,
    maxPositions: raw.maxPositions ?? raw.max_positions ?? 10,
    riskLevel: raw.riskLevel ?? raw.risk_level ?? calculateRiskLevel(exposurePercent, drawdownPercent, dailyPnlPercent),
    tradingStatus: raw.tradingStatus ?? raw.trading_status ?? 'active',
    warnings: raw.warnings ?? [],
    strategyRisks: raw.strategyRisks ?? raw.strategy_risks,
  };
}
