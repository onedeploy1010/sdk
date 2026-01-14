import { COINGECKO_IDS } from '../config';
import type { TokenPrice } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Fallback prices when API is unavailable
const FALLBACK_PRICES: Record<string, number> = {
  ETH: 3500,
  BTC: 95000,
  BNB: 700,
  MATIC: 0.5,
  AVAX: 40,
  USDT: 1,
  USDC: 1,
  DAI: 1,
  WBTC: 95000,
  WETH: 3500,
  ARB: 1.2,
  OP: 2.5,
  LINK: 20,
  UNI: 12,
  AAVE: 250,
  SOL: 200,
};

export class PriceService {
  private cache: Map<string, { price: TokenPrice; timestamp: number }> = new Map();
  private cacheTTL = 60 * 1000; // 1 minute cache

  async getPrice(symbol: string): Promise<TokenPrice> {
    const upperSymbol = symbol.toUpperCase();

    // Check cache first
    const cached = this.cache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.price;
    }

    const coinId = COINGECKO_IDS[upperSymbol];
    if (!coinId) {
      return this.getFallbackPrice(upperSymbol);
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const coinData = data[coinId];

      if (!coinData) {
        return this.getFallbackPrice(upperSymbol);
      }

      const change24h = coinData.usd_24h_change || 0;
      const price: TokenPrice = {
        symbol: upperSymbol,
        price: coinData.usd || 0,
        change24h,
        changePercent24h: change24h,
        priceChange24h: change24h,
        marketCap: coinData.usd_market_cap,
        volume24h: coinData.usd_24h_vol,
      };

      this.cache.set(upperSymbol, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.warn(`Failed to fetch price for ${upperSymbol}:`, error);
      return this.getFallbackPrice(upperSymbol);
    }
  }

  async getPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    const results: Record<string, TokenPrice> = {};

    // Group symbols by whether they have CoinGecko IDs
    const withIds: string[] = [];
    const withoutIds: string[] = [];

    for (const symbol of symbols) {
      const upper = symbol.toUpperCase();
      if (COINGECKO_IDS[upper]) {
        withIds.push(upper);
      } else {
        withoutIds.push(upper);
      }
    }

    // Handle symbols without CoinGecko IDs
    for (const symbol of withoutIds) {
      results[symbol] = this.getFallbackPrice(symbol);
    }

    if (withIds.length === 0) {
      return results;
    }

    // Fetch prices in batch for symbols with IDs
    const coinIds = withIds.map((s) => COINGECKO_IDS[s]).join(',');

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      for (const symbol of withIds) {
        const coinId = COINGECKO_IDS[symbol];
        const coinData = data[coinId];

        if (coinData) {
          const change24h = coinData.usd_24h_change || 0;
          results[symbol] = {
            symbol,
            price: coinData.usd || 0,
            change24h,
            changePercent24h: change24h,
            priceChange24h: change24h,
          };
        } else {
          results[symbol] = this.getFallbackPrice(symbol);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch batch prices:', error);
      for (const symbol of withIds) {
        results[symbol] = this.getFallbackPrice(symbol);
      }
    }

    return results;
  }

  private getFallbackPrice(symbol: string): TokenPrice {
    const price = FALLBACK_PRICES[symbol] || 0;
    return {
      symbol,
      price,
      change24h: 0,
      changePercent24h: 0,
      priceChange24h: 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const priceService = new PriceService();
