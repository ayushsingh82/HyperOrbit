/**
 * Real-time price feed integration for HyperLend MVP
 */

export interface PriceFeed {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

interface PriceUpdateData {
  channel?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export class RealTimePriceProvider {
  private wsConnection: WebSocket | null = null;
  private priceCache: Map<string, PriceFeed> = new Map();
  private subscribers: Set<(prices: Map<string, PriceFeed>) => void> = new Set();
  private isPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize real-time price feeds from Hyperliquid
   */
  async initialize(): Promise<void> {
    try {
      // Skip WebSocket connection on server-side rendering
      if (typeof window === 'undefined') {
        console.log('Skipping WebSocket initialization on server side');
        this.startHttpPolling();
        return;
      }

      // Connect to Hyperliquid WebSocket for real-time prices
      this.wsConnection = new WebSocket('wss://api.hyperliquid.xyz/ws');
      
      this.wsConnection.onopen = () => {
        console.log('Connected to Hyperliquid WebSocket');
        
        // Subscribe to all price feeds
        const subscribeMessage = {
          method: 'subscribe',
          subscription: {
            type: 'allMids',
            coins: ['ETH', 'BTC', 'USDC', 'USDT', 'HYPE', 'USDe']
          }
        };
        
        this.wsConnection?.send(JSON.stringify(subscribeMessage));
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as PriceUpdateData;
          this.processPriceUpdate(data);
        } catch (error) {
          console.error('Error processing price update:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.warn('WebSocket connection failed, falling back to HTTP polling:', error);
        // Immediately start HTTP polling as fallback
        this.startHttpPolling();
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket connection closed, using HTTP polling');
        // Don't attempt to reconnect immediately, just use HTTP polling
        if (!this.isPolling) {
          this.startHttpPolling();
        }
      };

    } catch (error) {
      console.error('Error initializing WebSocket, using HTTP polling:', error);
      // Fallback to HTTP polling
      this.startHttpPolling();
    }
  }

  /**
   * Process incoming price updates
   */
  private processPriceUpdate(data: PriceUpdateData): void {
    if (data.channel === 'allMids' && data.data) {
      const timestamp = Date.now();
      
      for (const [symbol, price] of Object.entries(data.data)) {
        if (typeof price === 'number') {
          this.priceCache.set(symbol, {
            symbol,
            price,
            timestamp,
            source: 'hyperliquid-ws'
          });
        }
      }
      
      // Notify subscribers
      this.notifySubscribers();
    }
  }

  /**
   * Fallback HTTP polling for price updates
   */
  private startHttpPolling(): void {
    if (this.isPolling) {
      return; // Already polling
    }

    this.isPolling = true;
    console.log('Starting HTTP price polling');

    const pollPrices = async () => {
      try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'allMids'
          }),
        });

        if (response.ok) {
          const prices = await response.json();
          const timestamp = Date.now();
          
          for (const [symbol, price] of Object.entries(prices)) {
            if (typeof price === 'number') {
              this.priceCache.set(symbol, {
                symbol,
                price,
                timestamp,
                source: 'hyperliquid-http'
              });
            }
          }
          
          this.notifySubscribers();
        }
      } catch (error) {
        console.error('Error polling prices:', error);
      }
    };

    // Poll every 10 seconds
    this.pollingInterval = setInterval(pollPrices, 10000);
    pollPrices(); // Initial call
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: (prices: Map<string, PriceFeed>) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): number | null {
    const feed = this.priceCache.get(symbol);
    return feed ? feed.price : null;
  }

  /**
   * Get all current prices
   */
  getAllPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    
    for (const [symbol, feed] of this.priceCache) {
      prices[symbol] = feed.price;
    }
    
    return prices;
  }

  /**
   * Notify all subscribers of price updates
   */
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      try {
        callback(new Map(this.priceCache));
      } catch (error) {
        console.error('Error in price subscription callback:', error);
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isPolling = false;
    this.subscribers.clear();
    this.priceCache.clear();
  }
}

// Singleton instance for global use
export const realTimePriceProvider = new RealTimePriceProvider();
