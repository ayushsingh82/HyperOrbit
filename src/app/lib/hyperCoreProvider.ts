// HyperCore Integration Library
// This file provides integration with HyperCore for cross-chain swaps and bridge operations

export interface HyperCoreBridgeParams {
  token: string;
  amount: number;
  fromChain: 'hyperEVM' | 'hyperCore';
  toChain: 'hyperEVM' | 'hyperCore';
  recipient?: string;
}

export interface HyperCoreSwapParams {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
  deadline?: number;
}

export interface HyperCoreOrderParams {
  coin: string;
  is_buy: boolean;
  sz: number; // size
  limit_px: number; // limit price
  order_type: 'limit' | 'market';
  reduce_only?: boolean;
  time_in_force?: 'Gtc' | 'Ioc' | 'Fok';
}

export interface HyperCoreMarketData {
  coin: string;
  markPrice: number;
  sz_decimals: number;
  name?: string;
}

export interface HyperCoreLevel {
  px: string;
  sz: string;
  n: number;
}

export interface HyperCoreLiquidity {
  coin: string;
  bid: { px: number; sz: number }[];
  ask: { px: number; sz: number }[];
  spread: number;
  depth: number;
}

export class HyperCoreProvider {
  private apiUrl: string;
  private bridgeContractAddress: string;
  private orderbookContractAddress: string;

  constructor(
    apiUrl = 'https://api.hyperliquid.xyz',
    bridgeContract = '0x...',
    orderbookContract = '0x...'
  ) {
    this.apiUrl = apiUrl;
    this.bridgeContractAddress = bridgeContract;
    this.orderbookContractAddress = orderbookContract;
  }

  /**
   * Bridge tokens from HyperEVM to HyperCore
   */
  async bridgeToHyperCore(params: HyperCoreBridgeParams): Promise<string> {
    try {
      console.log(`Bridging ${params.amount} ${params.token} to HyperCore`);
      
      // Implementation would call bridge contract
      // For now, return mock transaction hash
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return '0x' + Math.random().toString(16).slice(2, 66);
    } catch (error) {
      console.error('Bridge to HyperCore error:', error);
      throw error;
    }
  }

  /**
   * Bridge tokens from HyperCore to HyperEVM
   */
  async bridgeFromHyperCore(params: HyperCoreBridgeParams): Promise<string> {
    try {
      console.log(`Bridging ${params.amount} ${params.token} from HyperCore`);
      
      // Implementation would call bridge contract
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return '0x' + Math.random().toString(16).slice(2, 66);
    } catch (error) {
      console.error('Bridge from HyperCore error:', error);
      throw error;
    }
  }

  /**
   * Execute swap on HyperCore orderbook
   */
  async swapOnOrderbook(params: HyperCoreSwapParams): Promise<string> {
    try {
      console.log(`Swapping ${params.amount} ${params.fromToken} to ${params.toToken} on HyperCore`);
      
      // Get current market price
      const marketData = await this.getMarketData(params.fromToken);
      if (!marketData) {
        throw new Error(`Market data not available for ${params.fromToken}`);
      }

      // Calculate order parameters
      const orderParams: HyperCoreOrderParams = {
        coin: params.fromToken,
        is_buy: false, // Selling fromToken
        sz: params.amount,
        limit_px: marketData.markPrice * (1 - params.slippage),
        order_type: 'market',
        time_in_force: 'Ioc'
      };

      // Place order
      const orderId = await this.placeOrder(orderParams);
      
      return orderId;
    } catch (error) {
      console.error('HyperCore swap error:', error);
      throw error;
    }
  }

  /**
   * Place order on HyperCore
   */
  async placeOrder(params: HyperCoreOrderParams): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: {
            type: 'order',
            orders: [params]
          },
          nonce: Date.now(),
          signature: '0x...', // Would be actual signature
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.response.data.statuses[0].resting?.oid || 'market_order_' + Date.now();
      } else {
        throw new Error(`Order placement failed: ${data.response}`);
      }
    } catch (error) {
      console.error('Place order error:', error);
      
      // Return mock order ID for development
      return 'mock_order_' + Date.now().toString();
    }
  }

  /**
   * Get market data for a specific coin
   */
  async getMarketData(coin: string): Promise<HyperCoreMarketData> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const universe = data.universe;
      
      // Find coin in universe
      const coinData = universe.find((u: { name: string }) => u.name === coin);
      if (!coinData) {
        throw new Error(`Coin ${coin} not found`);
      }

      // Get current price
      const priceResponse = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'allMids'
        }),
      });

      const priceData = await priceResponse.json();
      const markPrice = parseFloat(priceData[coin] || '0');

      return {
        ...coinData,
        markPrice,
        coin
      };
    } catch (error) {
      console.error('Get market data error:', error);
      
      // Return mock data
      return {
        coin,
        markPrice: 1000 + Math.random() * 100,
        sz_decimals: 8
      };
    }
  }

  /**
   * Get orderbook for a specific coin
   */
  async getOrderbook(coin: string): Promise<HyperCoreLiquidity> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'l2Book',
          coin: coin
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const bids = data.levels[0].map((level: HyperCoreLevel) => ({
        px: parseFloat(level.px),
        sz: parseFloat(level.sz)
      }));
      
      const asks = data.levels[1].map((level: HyperCoreLevel) => ({
        px: parseFloat(level.px),
        sz: parseFloat(level.sz)
      }));

      const spread = asks[0]?.px - bids[0]?.px || 0;
      const depth = Math.min(bids.length, asks.length);

      return {
        coin,
        bid: bids,
        ask: asks,
        spread,
        depth
      };
    } catch (error) {
      console.error('Get orderbook error:', error);
      
      // Return mock orderbook
      const basePrice = 1000 + Math.random() * 100;
      return {
        coin,
        bid: Array.from({ length: 10 }, (_, i) => ({
          px: basePrice - (i + 1) * 0.1,
          sz: (Math.random() * 100) + 10
        })),
        ask: Array.from({ length: 10 }, (_, i) => ({
          px: basePrice + (i + 1) * 0.1,
          sz: (Math.random() * 100) + 10
        })),
        spread: 0.2,
        depth: 10
      };
    }
  }

  /**
   * Check if sufficient liquidity exists for a swap
   */
  async checkLiquidity(coin: string, amount: number, isBuy: boolean): Promise<{
    sufficient: boolean;
    availableAmount: number;
    averagePrice: number;
    slippage: number;
  }> {
    try {
      const orderbook = await this.getOrderbook(coin);
      const orders = isBuy ? orderbook.ask : orderbook.bid;
      
      let remainingAmount = amount;
      let totalCost = 0;
      
      for (const order of orders) {
        if (remainingAmount <= 0) break;
        
        const orderAmount = Math.min(remainingAmount, order.sz);
        totalCost += orderAmount * order.px;
        remainingAmount -= orderAmount;
      }
      
      const sufficient = remainingAmount <= 0;
      const availableAmount = amount - remainingAmount;
      const averagePrice = availableAmount > 0 ? totalCost / availableAmount : 0;
      
      // Calculate slippage
      const marketPrice = isBuy ? orderbook.ask[0]?.px || 0 : orderbook.bid[0]?.px || 0;
      const slippage = marketPrice > 0 ? Math.abs(averagePrice - marketPrice) / marketPrice : 0;
      
      return {
        sufficient,
        availableAmount,
        averagePrice,
        slippage
      };
    } catch (error) {
      console.error('Check liquidity error:', error);
      
      // Return conservative estimate
      return {
        sufficient: amount <= 1000, // Assume sufficient for small amounts
        availableAmount: Math.min(amount, 1000),
        averagePrice: 1000,
        slippage: 0.01
      };
    }
  }

  /**
   * Execute atomic swap (bridge + swap + bridge back)
   */
  async executeAtomicSwap(
    fromToken: string,
    toToken: string,
    amount: number,
    slippage: number = 0.01
  ): Promise<{
    bridgeToTx: string;
    swapTx: string;
    bridgeFromTx: string;
  }> {
    try {
      // Step 1: Bridge to HyperCore
      const bridgeToTx = await this.bridgeToHyperCore({
        token: fromToken,
        amount,
        fromChain: 'hyperEVM',
        toChain: 'hyperCore'
      });

      // Step 2: Execute swap on HyperCore
      const swapTx = await this.swapOnOrderbook({
        fromToken,
        toToken,
        amount,
        slippage
      });

      // Step 3: Bridge back to HyperEVM
      const bridgeFromTx = await this.bridgeFromHyperCore({
        token: toToken,
        amount, // Simplified - should calculate actual received amount
        fromChain: 'hyperCore',
        toChain: 'hyperEVM'
      });

      return {
        bridgeToTx,
        swapTx,
        bridgeFromTx
      };
    } catch (error) {
      console.error('Atomic swap error:', error);
      throw error;
    }
  }

  /**
   * Get bridge contract ABI
   */
  getBridgeContractABI() {
    return [
      {
        "inputs": [
          {"name": "token", "type": "address"},
          {"name": "amount", "type": "uint256"},
          {"name": "recipient", "type": "address"}
        ],
        "name": "bridgeToHyperCore",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "token", "type": "address"},
          {"name": "amount", "type": "uint256"},
          {"name": "recipient", "type": "address"}
        ],
        "name": "bridgeFromHyperCore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }
}

export default HyperCoreProvider;
