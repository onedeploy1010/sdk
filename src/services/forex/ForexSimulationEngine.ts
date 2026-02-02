// ForexSimulationEngine.ts - StableFX RFQ+PvP on-chain forex simulation engine
// Simulates Circle StableFX-style foreign exchange operations using USDC stablecoin pairs

import type {
  ForexLogEntry,
  ForexLogType,
  ForexCurrencyPair,
  ForexTradeRecord,
  ForexPosition,
  ForexPoolTransaction,
} from '../../types/forex';
import { FOREX_CURRENCY_PAIRS } from '../../types/forex';

// ── Types ──────────────────────────────────────────────────────────────────────

type LogCallback = (entry: ForexLogEntry) => void;
type PoolTxCallback = (tx: ForexPoolTransaction) => void;

interface PairState {
  pair: ForexCurrencyPair;
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  lastSpread: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

let idCounter = 0;
function genId(): string {
  return `fxlog_${Date.now()}_${++idCounter}`;
}

function tradeId(): string {
  return `FXT_${Date.now().toString(36).toUpperCase()}_${(++idCounter).toString(36).toUpperCase()}`;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatRate(price: number, pair: ForexCurrencyPair): string {
  if (pair.pipSize >= 0.01) return price.toFixed(3);
  return price.toFixed(5);
}

// ── News Headlines ───────────────────────────────────────────────────────────

const FX_NEWS = [
  'ECB signals potential rate adjustment, EUR pairs volatile',
  'BOJ maintains yield curve control, JPY weakens further',
  'Fed minutes reveal hawkish sentiment, USD strengthens',
  'UK CPI data beats expectations, GBP rallies',
  'RBA holds rates steady, AUD consolidates',
  'SNB intervenes in currency markets, CHF stabilizes',
  'Bank of Canada rate decision pending, CAD in focus',
  'Cross-border stablecoin settlement volume hits $2.1B daily',
  'Circle USDC reserves fully backed, attestation report released',
  'DeFi forex protocol TVL reaches new high at $890M',
  'On-chain FX liquidity deepens across major pairs',
  'Institutional adoption of on-chain forex accelerates',
];

// ── Engine ─────────────────────────────────────────────────────────────────────

class ForexSimulationEngine {
  private listeners: LogCallback[] = [];
  private poolTxListeners: PoolTxCallback[] = [];
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private pairStates: Map<string, PairState> = new Map();
  private running = false;
  private openPositions: ForexPosition[] = [];
  private totalPnl = 0;
  private totalTrades = 0;
  private totalPips = 0;
  private totalLots = 0;

  constructor() {
    for (const pair of FOREX_CURRENCY_PAIRS) {
      const jitter = pair.basePrice * rand(-0.003, 0.003);
      const price = pair.basePrice + jitter;
      const halfSpread = pair.spreadPips * pair.pipSize / 2;
      this.pairStates.set(pair.id, {
        pair,
        currentPrice: price,
        bidPrice: price - halfSpread,
        askPrice: price + halfSpread,
        lastSpread: pair.spreadPips,
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  start(): void {
    this.running = true;
    this.scheduleCycle();
  }

  stop(): void {
    this.running = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  onLog(callback: LogCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  onPoolTransaction(callback: PoolTxCallback): () => void {
    this.poolTxListeners.push(callback);
    return () => {
      this.poolTxListeners = this.poolTxListeners.filter(l => l !== callback);
    };
  }

  isRunning(): boolean {
    return this.running;
  }

  getStats(): { totalPnl: number; totalTrades: number; totalPips: number; totalLots: number; positions: number } {
    return {
      totalPnl: this.totalPnl,
      totalTrades: this.totalTrades,
      totalPips: this.totalPips,
      totalLots: this.totalLots,
      positions: this.openPositions.length,
    };
  }

  getPairStates(): Map<string, PairState> {
    return this.pairStates;
  }

  emitBootSequence(): void {
    const bootMessages: Array<{ msg: string; delay: number }> = [
      { msg: 'Initializing StableFX Engine v2.1.0...', delay: 0 },
      { msg: 'Connecting to Circle StableFX RFQ network...', delay: 500 },
      { msg: 'Loading USDC stablecoin pair feeds (6 pairs)...', delay: 1200 },
      { msg: 'Calibrating PvP settlement engine...', delay: 2000 },
      { msg: 'Initializing clearing pool ($12.5M)...', delay: 2800 },
      { msg: 'Initializing hedging pool ($7.5M)...', delay: 3400 },
      { msg: 'Initializing insurance pool ($5.0M)...', delay: 4000 },
      { msg: 'Risk management module online (max exposure: 25%)', delay: 4500 },
      { msg: '=== StableFX Engine ready. Starting RFQ cycles ===', delay: 5000 },
    ];

    for (const { msg, delay } of bootMessages) {
      setTimeout(() => {
        this.emit({
          id: genId(),
          timestamp: Date.now(),
          type: 'SYSTEM',
          message: msg,
          importance: 'medium',
        });
      }, delay);
    }
  }

  destroy(): void {
    this.stop();
    this.listeners = [];
    this.poolTxListeners = [];
    this.pairStates.clear();
    this.openPositions = [];
  }

  // ── Private Methods ────────────────────────────────────────────────────────

  private emit(entry: ForexLogEntry): void {
    for (const listener of this.listeners) {
      listener(entry);
    }
  }

  private emitPoolTx(tx: ForexPoolTransaction): void {
    for (const listener of this.poolTxListeners) {
      listener(tx);
    }
  }

  private generatePoolTxFromEvent(
    type: 'SETTLE' | 'HEDGE' | 'CLEAR',
    data: { pnl?: number; volume?: number; lots?: number },
  ): void {
    try {
      const { ForexPoolDataGenerator } = require('./ForexPoolDataGenerator');
      const generator = ForexPoolDataGenerator.getInstance();

      if (type === 'SETTLE' && data.pnl !== undefined) {
        const tx = generator.generateLiveTransaction('clearing', 'fee_collection', Math.abs(data.pnl) * rand(0.001, 0.003));
        this.emitPoolTx(tx);
      } else if (type === 'HEDGE') {
        const tx = generator.generateLiveTransaction('hedging', data.pnl && data.pnl < 0 ? 'loss_absorption' : 'profit_distribution', Math.abs(data.lots || 1) * rand(50, 200));
        this.emitPoolTx(tx);
      } else if (type === 'CLEAR') {
        const tx = generator.generateLiveTransaction('clearing', 'profit_distribution', (data.volume || 100000) * rand(0.0001, 0.0005));
        this.emitPoolTx(tx);
      }
    } catch {
      // Generator not available
    }
  }

  private scheduleCycle(): void {
    if (!this.running) return;
    const interval = rand(8000, 14000);
    this.cycleTimer = setTimeout(() => {
      if (this.running) {
        this.runTradeCycle();
        this.scheduleCycle();
      }
    }, interval);
  }

  private simulatePrice(pairId: string): number {
    const state = this.pairStates.get(pairId);
    if (!state) return 0;
    const volatility = state.pair.id.includes('JPYC') ? 0.0008 : 0.0004;
    const drift = rand(-volatility, volatility);
    const newPrice = state.currentPrice * (1 + drift);
    const halfSpread = (state.pair.spreadPips + rand(-0.3, 0.3)) * state.pair.pipSize / 2;
    state.currentPrice = newPrice;
    state.bidPrice = newPrice - halfSpread;
    state.askPrice = newPrice + halfSpread;
    state.lastSpread = halfSpread * 2 / state.pair.pipSize;
    return newPrice;
  }

  private runTradeCycle(): void {
    const pairState = pick(Array.from(this.pairStates.values()));
    const pair = pairState.pair;
    const entries: Array<{ entry: Omit<ForexLogEntry, 'id' | 'timestamp'>; delay: number }> = [];
    let delay = 0;

    // Update price
    const price = this.simulatePrice(pair.id);

    // 1. RFQ - Request for Quote
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const lots = parseFloat((rand(0.1, 2.5)).toFixed(2));
    const notional = lots * 100000;
    const rfqId = tradeId();

    entries.push({
      entry: {
        type: 'RFQ',
        message: `RFQ ${rfqId} | ${pair.symbol} ${side} ${lots.toFixed(2)} lots ($${(notional / 1000).toFixed(0)}K) | Mid: ${formatRate(price, pair)}`,
        data: { rfqId, pair: pair.id, side, lots, price },
        importance: 'medium',
        pairId: pair.id,
      },
      delay,
    });
    delay += rand(400, 800);

    // 2. QUOTE - Price quote from LP
    const quoteSpread = rand(0.5, 2.0) * pair.pipSize;
    const quotePrice = side === 'BUY'
      ? price + quoteSpread
      : price - quoteSpread;
    const quotePips = Math.abs(quotePrice - price) / pair.pipSize;

    entries.push({
      entry: {
        type: 'QUOTE',
        message: `QUOTE ${rfqId} | ${pair.symbol} @ ${formatRate(quotePrice, pair)} | Spread: ${quotePips.toFixed(1)} pips | Valid: 3s`,
        data: { rfqId, quotePrice, spread: quotePips },
        importance: 'medium',
        pairId: pair.id,
      },
      delay,
    });
    delay += rand(500, 1000);

    // 3. MATCH - Trade matching (85% success rate)
    const matched = Math.random() < 0.85;
    if (matched) {
      const matchPrice = quotePrice * (1 + rand(-0.00005, 0.00005));
      entries.push({
        entry: {
          type: 'MATCH',
          message: `MATCH ${rfqId} | ${pair.symbol} ${side} @ ${formatRate(matchPrice, pair)} | ${lots.toFixed(2)} lots | Counterparty: LP-${randInt(1, 8)}`,
          data: { rfqId, matchPrice, counterparty: `LP-${randInt(1, 8)}` },
          importance: 'high',
          pairId: pair.id,
        },
        delay,
      });
      delay += rand(1000, 2500);

      // 4. SETTLE - PvP Settlement
      const settlePrice = matchPrice * (1 + rand(-0.00002, 0.00002));
      const pips = ((settlePrice - price) / pair.pipSize) * (side === 'BUY' ? 1 : -1);
      const pnl = pips * pair.pipSize * lots * 100000;

      entries.push({
        entry: {
          type: 'SETTLE',
          message: `SETTLE ${rfqId} | PvP confirmed | ${pair.symbol} @ ${formatRate(settlePrice, pair)} | P&L: ${pips >= 0 ? '+' : ''}${pips.toFixed(1)} pips ($${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})`,
          data: { rfqId, settlePrice, pips, pnl, pvp: true },
          importance: 'high',
          pairId: pair.id,
        },
        delay,
      });
      delay += rand(300, 600);

      // 5. PVP - Settlement confirmation
      entries.push({
        entry: {
          type: 'PVP',
          message: `PvP ${rfqId} | Atomic settlement confirmed on-chain | USDC transferred: $${notional.toLocaleString()} | Gas: ~$0.${randInt(10, 50)}`,
          data: { rfqId, settled: true, gasWei: randInt(10, 50) },
          importance: 'medium',
          pairId: pair.id,
        },
        delay,
      });

      // Generate pool transaction for settlement
      this.generatePoolTxFromEvent('SETTLE', { pnl });

      // Update stats
      this.totalTrades++;
      this.totalPnl += pnl;
      this.totalPips += pips;
      this.totalLots += lots;

      // Update positions
      if (Math.random() < 0.4) {
        this.openPositions.push({
          id: rfqId,
          pairId: pair.id,
          side: side as 'BUY' | 'SELL',
          lots,
          pips,
          entryPrice: matchPrice,
          currentPrice: settlePrice,
          pnl,
          openTime: Date.now(),
        });
        if (this.openPositions.length > 5) {
          this.openPositions.shift();
        }
      }
    } else {
      entries.push({
        entry: {
          type: 'MATCH',
          message: `MATCH FAILED ${rfqId} | ${pair.symbol} | No counterparty at requested price | Requoting...`,
          data: { rfqId, matched: false },
          importance: 'low',
          pairId: pair.id,
        },
        delay,
      });
    }

    // 6. HEDGE - Pool hedging operations (20% chance)
    if (Math.random() < 0.2) {
      delay += rand(400, 800);
      const hedgePair = pick(FOREX_CURRENCY_PAIRS);
      const hedgeLots = parseFloat(rand(0.5, 5.0).toFixed(2));
      const hedgeDirection = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      entries.push({
        entry: {
          type: 'HEDGE',
          message: `HEDGE | ${hedgePair.symbol} ${hedgeDirection} ${hedgeLots.toFixed(2)} lots | Pool delta neutralization | Exposure: ${rand(5, 20).toFixed(1)}%`,
          data: { pair: hedgePair.id, direction: hedgeDirection, lots: hedgeLots },
          importance: 'medium',
        },
        delay,
      });
      this.generatePoolTxFromEvent('HEDGE', { lots: hedgeLots });
    }

    // 7. CLEAR - Clearing pool operations (15% chance)
    if (Math.random() < 0.15) {
      delay += rand(300, 600);
      const clearAmount = randInt(50000, 500000);
      entries.push({
        entry: {
          type: 'CLEAR',
          message: `CLEAR | Netting cycle complete | Volume: $${(clearAmount / 1000).toFixed(0)}K | Pairs settled: ${randInt(2, 6)} | Pool util: ${rand(60, 85).toFixed(1)}%`,
          data: { volume: clearAmount, pairsSettled: randInt(2, 6) },
          importance: 'low',
        },
        delay,
      });
      this.generatePoolTxFromEvent('CLEAR', { volume: clearAmount });
    }

    // 8. POSITION - Position update (25% chance)
    if (this.openPositions.length > 0 && Math.random() < 0.25) {
      delay += rand(300, 600);
      const posUpdates = this.openPositions.slice(0, 3).map(pos => {
        const pState = this.pairStates.get(pos.pairId);
        if (pState) {
          pos.currentPrice = pState.currentPrice;
          pos.pips = ((pos.currentPrice - pos.entryPrice) / pState.pair.pipSize) * (pos.side === 'BUY' ? 1 : -1);
          pos.pnl = pos.pips * pState.pair.pipSize * pos.lots * 100000;
        }
        return `${pState?.pair.symbol || pos.pairId} ${pos.side}: ${pos.pips >= 0 ? '+' : ''}${pos.pips.toFixed(1)} pips`;
      });
      entries.push({
        entry: {
          type: 'POSITION',
          message: `POSITION | ${posUpdates.join(' | ')} | Open: ${this.openPositions.length}`,
          data: { positions: this.openPositions.length },
          importance: 'low',
        },
        delay,
      });

      // Close old positions
      if (this.openPositions.length > 2 && Math.random() < 0.3) {
        const closed = this.openPositions.shift()!;
        this.totalPnl += closed.pnl * rand(0.01, 0.03);
      }
    }

    // 9. PNL - Periodic P&L summary (30% chance)
    if (Math.random() < 0.3) {
      delay += rand(300, 600);
      entries.push({
        entry: {
          type: 'PNL',
          message: `PNL | Session: $${this.totalPnl >= 0 ? '+' : ''}${this.totalPnl.toFixed(2)} | Trades: ${this.totalTrades} | Pips: ${this.totalPips >= 0 ? '+' : ''}${this.totalPips.toFixed(1)} | Lots: ${this.totalLots.toFixed(2)}`,
          data: { totalPnl: this.totalPnl, totalTrades: this.totalTrades, totalPips: this.totalPips },
          importance: 'medium',
        },
        delay,
      });
    }

    // 10. NEWS (10% chance)
    if (Math.random() < 0.1) {
      delay += rand(300, 600);
      entries.push({
        entry: {
          type: 'SYSTEM',
          message: `[Market] ${pick(FX_NEWS)}`,
          importance: 'medium',
        },
        delay,
      });
    }

    // Emit all entries with delays
    for (const { entry, delay: d } of entries) {
      setTimeout(() => {
        if (this.running) {
          this.emit({
            ...entry,
            id: genId(),
            timestamp: Date.now(),
          });
        }
      }, d);
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const forexSimulationEngine = new ForexSimulationEngine();
export type { PairState };
