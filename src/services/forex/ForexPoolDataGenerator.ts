// ForexPoolDataGenerator.ts - Generates historical pool snapshots, transactions, and trade history
// Singleton service following existing pattern (like ForexSimulationEngine)

import type {
  ForexPoolType,
  ForexPoolDailySnapshot,
  ForexPoolTransaction,
  ForexPoolTransactionType,
  ForexTradeRecord,
} from '../../types/forex';
import { FOREX_CURRENCY_PAIRS, FOREX_POOL_DEFAULTS, FOREX_AGENT } from '../../types/forex';

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

let _idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}

// ── Pool Parameters ──────────────────────────────────────────────────────────

interface PoolParams {
  meanDailyPnlPct: number;
  stddevPnlPct: number;
  utilizationMin: number;
  utilizationMax: number;
  depositsPerDay: [number, number];
  withdrawalsPerDay: [number, number];
  profitDistPerDay: number;
  avgDepositSize: number;
  avgWithdrawalSize: number;
}

const POOL_PARAMS: Record<ForexPoolType, PoolParams> = {
  clearing: {
    meanDailyPnlPct: 0.00035,
    stddevPnlPct: 0.00015,
    utilizationMin: 0.70,
    utilizationMax: 0.85,
    depositsPerDay: [15, 25],
    withdrawalsPerDay: [8, 12],
    profitDistPerDay: 5,
    avgDepositSize: 25000,
    avgWithdrawalSize: 18000,
  },
  hedging: {
    meanDailyPnlPct: 0.00022,
    stddevPnlPct: 0.00020,
    utilizationMin: 0.55,
    utilizationMax: 0.75,
    depositsPerDay: [8, 15],
    withdrawalsPerDay: [5, 8],
    profitDistPerDay: 3,
    avgDepositSize: 18000,
    avgWithdrawalSize: 12000,
  },
  insurance: {
    meanDailyPnlPct: 0.00013,
    stddevPnlPct: 0.00008,
    utilizationMin: 0.30,
    utilizationMax: 0.50,
    depositsPerDay: [5, 10],
    withdrawalsPerDay: [3, 5],
    profitDistPerDay: 2,
    avgDepositSize: 12000,
    avgWithdrawalSize: 8000,
  },
};

// ── Generator Class ──────────────────────────────────────────────────────────

class ForexPoolDataGeneratorClass {
  private snapshotCache: Record<ForexPoolType, ForexPoolDailySnapshot[]> | null = null;
  private transactionCache: ForexPoolTransaction[] | null = null;
  private baseBlockNumber = 19_500_000;

  // ── Public API ─────────────────────────────────────────────────────────

  generateAllSnapshots(): Record<ForexPoolType, ForexPoolDailySnapshot[]> {
    if (this.snapshotCache) return this.snapshotCache;

    const result: Record<ForexPoolType, ForexPoolDailySnapshot[]> = {
      clearing: [],
      hedging: [],
      insurance: [],
    };

    for (const pool of FOREX_POOL_DEFAULTS) {
      result[pool.id] = this.generatePoolSnapshots(pool.id, pool.totalSize);
    }

    this.snapshotCache = result;
    return result;
  }

  generateAllTransactions(): ForexPoolTransaction[] {
    if (this.transactionCache) return this.transactionCache;

    const allTx: ForexPoolTransaction[] = [];

    for (const pool of FOREX_POOL_DEFAULTS) {
      const snapshots = this.snapshotCache?.[pool.id] || this.generatePoolSnapshots(pool.id, pool.totalSize);
      const txs = this.generatePoolTransactions(pool.id, snapshots);
      allTx.push(...txs);
    }

    // Add inter-pool transfers (~2-3/week = ~17-26 over 60 days)
    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() - (60 - i));
      const dayOfWeek = day.getDay();

      // Inter-pool transfers: ~2-3 per week
      if (dayOfWeek === 2 || dayOfWeek === 4 || (dayOfWeek === 5 && Math.random() < 0.4)) {
        const fromPool = pick(['clearing', 'hedging', 'insurance'] as ForexPoolType[]);
        const toOptions = (['clearing', 'hedging', 'insurance'] as ForexPoolType[]).filter(p => p !== fromPool);
        const toPool = pick(toOptions);
        const amount = rand(50000, 200000);
        const ts = day.getTime() + randInt(10, 18) * 3600000;

        allTx.push({
          id: genId('ipt'),
          poolId: fromPool,
          type: 'inter_pool_transfer',
          amount: -amount,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + i * 7200 + randInt(0, 100),
          timestamp: ts,
          description: `Transfer to ${toPool} pool`,
        });

        allTx.push({
          id: genId('ipt'),
          poolId: toPool,
          type: 'inter_pool_transfer',
          amount: amount,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + i * 7200 + randInt(100, 200),
          timestamp: ts + 5000,
          description: `Transfer from ${fromPool} pool`,
        });
      }

      // Reserve rebalance: ~1/week
      if (dayOfWeek === 3 && Math.random() < 0.85) {
        const pool = pick(FOREX_POOL_DEFAULTS);
        const rebalanceAmt = rand(20000, 100000);
        const ts = day.getTime() + randInt(2, 6) * 3600000;
        allTx.push({
          id: genId('rrb'),
          poolId: pool.id,
          type: 'reserve_rebalance',
          amount: Math.random() < 0.5 ? rebalanceAmt : -rebalanceAmt,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + i * 7200 + randInt(200, 300),
          timestamp: ts,
          description: 'Automated reserve rebalance',
        });
      }
    }

    // Sort all transactions by timestamp
    allTx.sort((a, b) => a.timestamp - b.timestamp);

    // Assign running balances per pool
    const runningBalance: Record<ForexPoolType, number> = {
      clearing: FOREX_POOL_DEFAULTS[0].totalSize * 0.85,
      hedging: FOREX_POOL_DEFAULTS[1].totalSize * 0.82,
      insurance: FOREX_POOL_DEFAULTS[2].totalSize * 0.88,
    };

    for (const tx of allTx) {
      tx.balanceBefore = runningBalance[tx.poolId];
      runningBalance[tx.poolId] += tx.amount;
      tx.balanceAfter = runningBalance[tx.poolId];
    }

    this.transactionCache = allTx;
    return allTx;
  }

  generateTradeHistory(
    investmentAmount: number,
    startDate: string,
    selectedPairs: string[],
  ): ForexTradeRecord[] {
    const trades: ForexTradeRecord[] = [];
    const start = new Date(startDate);
    const now = new Date();
    const dayCount = Math.min(60, Math.ceil((now.getTime() - start.getTime()) / 86400000));
    let cumulativePnl = 0;
    let blockNum = this.baseBlockNumber + randInt(0, 5000);

    for (let d = 0; d < dayCount; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      const dayOfWeek = day.getDay();

      // Fewer trades on weekends
      const baseCount = (dayOfWeek === 0 || dayOfWeek === 6) ? randInt(1, 2) : randInt(3, 8);

      for (let t = 0; t < baseCount; t++) {
        const pair = FOREX_CURRENCY_PAIRS.find(p => p.id === pick(selectedPairs)) || pick(FOREX_CURRENCY_PAIRS);
        const side: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const lots = parseFloat(rand(0.1, 2.5).toFixed(2));
        const rfqPrice = pair.basePrice * (1 + rand(-0.003, 0.003));
        const quoteSpread = rand(0.5, 2.0) * pair.pipSize;
        const quotePrice = side === 'BUY' ? rfqPrice + quoteSpread : rfqPrice - quoteSpread;

        // 85% match rate
        const matched = Math.random() < 0.85;
        if (!matched) continue;

        const matchPrice = quotePrice * (1 + rand(-0.00005, 0.00005));
        const settlePrice = matchPrice * (1 + rand(-0.00002, 0.00002));
        const pips = ((settlePrice - rfqPrice) / pair.pipSize) * (side === 'BUY' ? 1 : -1);
        const pnl = pips * pair.pipSize * lots * 100000;

        // Win rate matching FOREX_AGENT
        const isWin = Math.random() < (FOREX_AGENT.winRate / 100);
        const finalPnl = isWin ? Math.abs(pnl) : -Math.abs(pnl) * rand(0.3, 0.8);
        cumulativePnl += finalPnl;

        const clearingFee = Math.abs(finalPnl) * rand(0.001, 0.003);
        const hedgingCost = Math.abs(finalPnl) * rand(0.0005, 0.002);
        const insuranceReserve = Math.abs(finalPnl) * rand(0.0003, 0.001);

        blockNum += randInt(1, 20);
        const timestamp = day.getTime() + randInt(0, 23) * 3600000 + randInt(0, 3600000);

        trades.push({
          id: genId('FXT'),
          timestamp,
          pairId: pair.id,
          pairSymbol: pair.symbol,
          side,
          rfqPrice,
          quotePrice,
          matchPrice,
          settlePrice,
          lots,
          pips: isWin ? Math.abs(pips) : -Math.abs(pips) * rand(0.3, 0.8),
          pnl: finalPnl,
          status: 'SETTLED',
          pvpSettled: true,
          clearingFee,
          hedgingCost,
          insuranceReserve,
          txHash: genTxHash(),
          blockNumber: blockNum,
          cycleDay: d + 1,
          cumulativePnl,
        });
      }
    }

    trades.sort((a, b) => a.timestamp - b.timestamp);
    return trades;
  }

  generateLiveTransaction(
    poolId: ForexPoolType,
    type: ForexPoolTransactionType,
    baseAmount?: number,
  ): ForexPoolTransaction {
    const params = POOL_PARAMS[poolId];
    let amount: number;

    switch (type) {
      case 'deposit':
        amount = baseAmount ?? rand(params.avgDepositSize * 0.5, params.avgDepositSize * 1.5);
        break;
      case 'withdrawal':
        amount = -(baseAmount ?? rand(params.avgWithdrawalSize * 0.5, params.avgWithdrawalSize * 1.5));
        break;
      case 'profit_distribution':
        amount = baseAmount ?? rand(500, 5000);
        break;
      case 'fee_collection':
        amount = baseAmount ?? rand(100, 2000);
        break;
      case 'loss_absorption':
        amount = -(baseAmount ?? rand(200, 3000));
        break;
      default:
        amount = baseAmount ?? rand(-5000, 5000);
    }

    const pool = FOREX_POOL_DEFAULTS.find(p => p.id === poolId)!;
    const balanceBefore = pool.totalSize;

    return {
      id: genId('ptx'),
      poolId,
      type,
      amount,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      txHash: genTxHash(),
      blockNumber: this.baseBlockNumber + Math.floor(Date.now() / 12000),
      timestamp: Date.now(),
      description: this.getTxDescription(type, poolId, Math.abs(amount)),
    };
  }

  // ── Private Methods ────────────────────────────────────────────────────

  private generatePoolSnapshots(
    poolId: ForexPoolType,
    currentSize: number,
  ): ForexPoolDailySnapshot[] {
    const params = POOL_PARAMS[poolId];
    const snapshots: ForexPoolDailySnapshot[] = [];
    const now = new Date();

    // Work backward: start with a smaller balance 60 days ago
    let balance = currentSize * rand(0.82, 0.88);
    let cumulativePnl = 0;

    for (let i = 59; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayOfWeek = day.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const openBalance = balance;

      // Weekend activity ~20% of weekday
      const activityMultiplier = isWeekend ? 0.2 : 1.0;

      // Daily PnL with occasional drawdowns (1-2 per week)
      const isDrawdown = !isWeekend && Math.random() < 0.2; // ~1.4/week
      let dailyPnlPct: number;
      if (isDrawdown) {
        dailyPnlPct = -rand(0.0001, params.stddevPnlPct * 2);
      } else {
        dailyPnlPct = this.gaussianRandom(params.meanDailyPnlPct, params.stddevPnlPct);
      }
      dailyPnlPct *= activityMultiplier;

      const dailyPnl = balance * dailyPnlPct;
      cumulativePnl += dailyPnl;

      // Net deposits: organic growth with slight positive bias
      const depositCount = isWeekend
        ? randInt(1, Math.ceil(params.depositsPerDay[0] * 0.2))
        : randInt(params.depositsPerDay[0], params.depositsPerDay[1]);
      const withdrawalCount = isWeekend
        ? randInt(0, Math.ceil(params.withdrawalsPerDay[0] * 0.2))
        : randInt(params.withdrawalsPerDay[0], params.withdrawalsPerDay[1]);

      const deposits = depositCount * params.avgDepositSize * rand(0.7, 1.3) * activityMultiplier;
      const withdrawals = withdrawalCount * params.avgWithdrawalSize * rand(0.7, 1.3) * activityMultiplier;
      const netFlow = deposits - withdrawals;

      balance += dailyPnl + netFlow;

      const txCount = depositCount + withdrawalCount + Math.round(params.profitDistPerDay * activityMultiplier);
      const utilization = rand(params.utilizationMin, params.utilizationMax);
      const activeUsers = Math.round(rand(80, 400) * activityMultiplier);

      snapshots.push({
        poolId,
        date: formatDate(day),
        openBalance,
        closeBalance: balance,
        deposits,
        withdrawals,
        netFlow,
        dailyPnl,
        dailyPnlPct,
        cumulativePnl,
        utilization,
        txCount,
        activeUsers,
      });
    }

    return snapshots;
  }

  private generatePoolTransactions(
    poolId: ForexPoolType,
    snapshots: ForexPoolDailySnapshot[],
  ): ForexPoolTransaction[] {
    const params = POOL_PARAMS[poolId];
    const transactions: ForexPoolTransaction[] = [];

    for (const snap of snapshots) {
      const day = new Date(snap.date);
      const dayOfWeek = day.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const mult = isWeekend ? 0.2 : 1.0;

      const depositCount = Math.round(randInt(params.depositsPerDay[0], params.depositsPerDay[1]) * mult);
      const withdrawalCount = Math.round(randInt(params.withdrawalsPerDay[0], params.withdrawalsPerDay[1]) * mult);
      const profitCount = Math.round(params.profitDistPerDay * mult);

      // Deposits
      for (let i = 0; i < depositCount; i++) {
        const amount = rand(params.avgDepositSize * 0.3, params.avgDepositSize * 2.0);
        const ts = day.getTime() + randInt(0, 23) * 3600000 + randInt(0, 3600000);
        transactions.push({
          id: genId('dep'),
          poolId,
          type: 'deposit',
          amount,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + Math.floor(ts / 12000) + randInt(0, 50),
          timestamp: ts,
          description: `Deposit to ${poolId} pool`,
        });
      }

      // Withdrawals
      for (let i = 0; i < withdrawalCount; i++) {
        const amount = rand(params.avgWithdrawalSize * 0.3, params.avgWithdrawalSize * 2.0);
        const ts = day.getTime() + randInt(0, 23) * 3600000 + randInt(0, 3600000);
        transactions.push({
          id: genId('wdr'),
          poolId,
          type: 'withdrawal',
          amount: -amount,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + Math.floor(ts / 12000) + randInt(0, 50),
          timestamp: ts,
          description: `Withdrawal from ${poolId} pool`,
        });
      }

      // Profit distributions
      for (let i = 0; i < profitCount; i++) {
        const amount = rand(500, 8000);
        const ts = day.getTime() + randInt(6, 22) * 3600000 + randInt(0, 3600000);
        transactions.push({
          id: genId('prd'),
          poolId,
          type: 'profit_distribution',
          amount,
          balanceBefore: 0,
          balanceAfter: 0,
          txHash: genTxHash(),
          blockNumber: this.baseBlockNumber + Math.floor(ts / 12000) + randInt(0, 50),
          timestamp: ts,
          description: `Profit distribution from ${poolId} pool`,
        });
      }

      // Fee collection (1-2 per day on weekdays)
      if (!isWeekend) {
        const feeCount = randInt(1, 2);
        for (let i = 0; i < feeCount; i++) {
          const amount = rand(100, 3000);
          const ts = day.getTime() + randInt(8, 20) * 3600000;
          transactions.push({
            id: genId('fee'),
            poolId,
            type: 'fee_collection',
            amount,
            balanceBefore: 0,
            balanceAfter: 0,
            txHash: genTxHash(),
            blockNumber: this.baseBlockNumber + Math.floor(ts / 12000) + randInt(0, 50),
            timestamp: ts,
            description: `Fee collection for ${poolId} pool`,
          });
        }
      }
    }

    return transactions;
  }

  private gaussianRandom(mean: number, stddev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stddev;
  }

  private getTxDescription(type: ForexPoolTransactionType, poolId: ForexPoolType, amount: number): string {
    const fmt = `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    switch (type) {
      case 'deposit': return `Deposit ${fmt} to ${poolId} pool`;
      case 'withdrawal': return `Withdrawal ${fmt} from ${poolId} pool`;
      case 'profit_distribution': return `Profit distribution ${fmt} from ${poolId}`;
      case 'loss_absorption': return `Loss absorbed ${fmt} by ${poolId} pool`;
      case 'inter_pool_transfer': return `Inter-pool transfer ${fmt}`;
      case 'fee_collection': return `Fee collected ${fmt} in ${poolId}`;
      case 'reserve_rebalance': return `Reserve rebalance ${fmt} in ${poolId}`;
      default: return `${type} ${fmt}`;
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

let _instance: ForexPoolDataGeneratorClass | null = null;

export const ForexPoolDataGenerator = {
  getInstance(): ForexPoolDataGeneratorClass {
    if (!_instance) {
      _instance = new ForexPoolDataGeneratorClass();
    }
    return _instance;
  },
};
