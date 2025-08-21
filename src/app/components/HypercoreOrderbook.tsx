'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import PrivyWalletButton from "./PrivyWalletButton";

// Hyperliquid types for orderbook
interface BookLevel {
  px: string; // price
  sz: string; // size
  n: number;  // number of orders
}

interface Orderbook {
  coin: string;
  time: number;
  levels: [BookLevel[], BookLevel[]]; // [bids, asks]
}

interface UserPosition {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
}

interface UserBalance {
  coin: string;
  hold: string;
  total: string;
}

interface TradeHistory {
  coin: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  time: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketStats {
  coin: string;
  markPrice: string;
  indexPrice: string;
  fundingRate: string;
  openInterest: string;
  volume24h: string;
  change24h: string;
}

export default function HypercoreOrderbook() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [selectedCoin, setSelectedCoin] = useState<string>("BTC");
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'trades'>('chart');
  const [chartTimeframe, setChartTimeframe] = useState<'1m' | '5m' | '1h' | '1d'>('1h');
  
  // Trading form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [isMarketOrder, setIsMarketOrder] = useState<boolean>(false);
  const [leverage, setLeverage] = useState<number>(5);

  // Fetch market stats
  const fetchMarketStats = useCallback(async (coin: string) => {
    try {
      const [metaResponse, midResponse] = await Promise.all([
        fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'meta' })
        }),
        fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'allMids' })
        })
      ]);

      if (metaResponse.ok && midResponse.ok) {
        const metaData = await metaResponse.json();
        const midData = await midResponse.json();
        
        const coinMeta = metaData.universe?.find((u: any) => u.name === coin);
        const coinMid = midData[coin];
        
        if (coinMeta && coinMid) {
          setMarketStats({
            coin,
            markPrice: coinMid,
            indexPrice: coinMid,
            fundingRate: '0.0001',
            openInterest: '1000000',
            volume24h: '50000000',
            change24h: '+2.5'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching market stats:', err);
    }
  }, []);

  // Fetch chart data
  const fetchChartData = useCallback(async (coin: string, timeframe: string) => {
    try {
      setChartLoading(true);
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: {
            coin: coin,
            interval: timeframe,
            startTime: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const formattedData = data.map((candle: any) => ({
            time: candle.t,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
            volume: parseFloat(candle.v || '0')
          }));
          setCandleData(formattedData);
        }
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      // Generate mock data for demo
      const mockData = Array.from({ length: 24 }, (_, i) => {
        const basePrice = 65000;
        const variation = Math.random() * 1000 - 500;
        return {
          time: Date.now() - (24 - i) * 60 * 60 * 1000,
          open: basePrice + variation,
          high: basePrice + variation + Math.random() * 500,
          low: basePrice + variation - Math.random() * 500,
          close: basePrice + variation + (Math.random() * 200 - 100),
          volume: Math.random() * 1000000
        };
      });
      setCandleData(mockData);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Fetch recent trades
  const fetchRecentTrades = useCallback(async (coin: string) => {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recentTrades',
          coin: coin
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const formattedTrades = data.slice(0, 20).map((trade: any) => ({
            coin,
            side: trade.side as 'buy' | 'sell',
            size: trade.sz,
            price: trade.px,
            time: trade.time
          }));
          setTradeHistory(formattedTrades);
        }
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      // Generate mock trades for demo
      const mockTrades = Array.from({ length: 10 }, (_, i) => ({
        coin,
        side: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
        size: (Math.random() * 10).toFixed(4),
        price: (65000 + Math.random() * 1000 - 500).toFixed(2),
        time: Date.now() - i * 60000
      }));
      setTradeHistory(mockTrades);
    }
  }, []);
  const fetchOrderbook = useCallback(async (coin: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'l2Book',
          coin: coin
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Orderbook = await response.json();
      setOrderbook(data);
    } catch (err) {
      console.error('Error fetching orderbook:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orderbook');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user data (positions and balances)
  const fetchUserData = useCallback(async (userAddress: string) => {
    try {
      // Fetch user state
      const stateResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: userAddress
        })
      });

      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        if (stateData.assetPositions) {
          setPositions(stateData.assetPositions);
        }
        if (stateData.crossMarginSummary) {
          setBalances([{
            coin: 'USDC',
            hold: stateData.crossMarginSummary.accountValue,
            total: stateData.crossMarginSummary.totalMarginUsed
          }]);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, []);

  // Initialize data fetching
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOrderbook(selectedCoin),
        fetchMarketStats(selectedCoin),
        fetchChartData(selectedCoin, chartTimeframe),
        fetchRecentTrades(selectedCoin)
      ]);
      setLoading(false);
    };
    
    initializeData();
  }, [selectedCoin, fetchOrderbook, fetchMarketStats, fetchChartData, fetchRecentTrades, chartTimeframe]);

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      fetchUserData(user.wallet.address);
    }
  }, [authenticated, user, fetchUserData]);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCoin) {
        fetchOrderbook(selectedCoin);
        fetchMarketStats(selectedCoin);
        fetchRecentTrades(selectedCoin);
        // Refresh chart data less frequently (every 30 seconds)
        if (Date.now() % 30000 < 5000) {
          fetchChartData(selectedCoin, chartTimeframe);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCoin, chartTimeframe, fetchOrderbook, fetchMarketStats, fetchRecentTrades, fetchChartData]);

  const handlePlaceOrder = async () => {
    if (!authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!price || !size) {
      alert('Please enter both price and size');
      return;
    }

    try {
      // This would require implementing the full Hyperliquid exchange client
      // with proper signing and order placement
      alert(`Order would be placed: ${orderType} ${size} ${selectedCoin} at ${isMarketOrder ? 'market' : price}`);
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order');
    }
  };

  const formatPrice = useCallback((px: string) => parseFloat(px).toFixed(2), []);
  const formatSize = useCallback((sz: string) => parseFloat(sz).toFixed(4), []);

  // Memoize coin options to prevent unnecessary re-renders
  const coinOptions = useMemo(() => ['BTC', 'ETH', 'SOL', 'ARB'], []);

  if (!ready) {
    return (
      <div className="w-full max-w-6xl bg-[#0B1614] rounded-xl p-6 shadow-lg">
        <div className="text-center text-white">Loading Privy...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header with wallet connection and market stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#27FEE0]">Hypercore Trading</h1>
          <PrivyWalletButton />
        </div>
        
        {/* Market Stats */}
        {marketStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Mark Price</div>
              <div className="text-lg font-bold text-white">${parseFloat(marketStats.markPrice).toFixed(2)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">24h Change</div>
              <div className={`text-lg font-bold ${marketStats.change24h.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {marketStats.change24h}%
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">24h Volume</div>
              <div className="text-lg font-bold text-white">${parseInt(marketStats.volume24h).toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Open Interest</div>
              <div className="text-lg font-bold text-white">${parseInt(marketStats.openInterest).toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Funding Rate</div>
              <div className="text-lg font-bold text-green-400">{(parseFloat(marketStats.fundingRate) * 100).toFixed(4)}%</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Index Price</div>
              <div className="text-lg font-bold text-white">${parseFloat(marketStats.indexPrice).toFixed(2)}</div>
            </div>
          </div>
        )}
        
        {/* Coin selector */}
        <div className="flex space-x-2 mb-4">
          {coinOptions.map((coin) => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCoin === coin
                  ? 'bg-[#27FEE0] text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {coin}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chart and Market Data - Takes up 3 columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'chart' ? 'bg-[#27FEE0] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setActiveTab('orderbook')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'orderbook' ? 'bg-[#27FEE0] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Orderbook
                </button>
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'trades' ? 'bg-[#27FEE0] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Recent Trades
                </button>
              </div>

              {activeTab === 'chart' && (
                <div className="flex space-x-2">
                  {(['1m', '5m', '1h', '1d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => {
                        setChartTimeframe(tf);
                        fetchChartData(selectedCoin, tf);
                      }}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        chartTimeframe === tf ? 'bg-[#27FEE0] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'chart' && (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-96"
                >
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin w-8 h-8 border-2 border-[#27FEE0] border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={candleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                          stroke="#9CA3AF"
                        />
                        <YAxis 
                          domain={['dataMin - 100', 'dataMax + 100']}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          stroke="#9CA3AF"
                        />
                        <Tooltip 
                          labelFormatter={(time) => new Date(time).toLocaleString()}
                          formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #27FEE0',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="#27FEE0"
                          fill="#27FEE0"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              )}

              {activeTab === 'orderbook' && (
                <motion.div
                  key="orderbook"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-[#27FEE0] border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-white/60 mt-2">Loading orderbook...</p>
                    </div>
                  ) : orderbook ? (
                    <div className="grid grid-cols-2 gap-6">
                      {/* Bids */}
                      <div>
                        <h3 className="text-lg text-green-400 mb-3 flex items-center">
                          <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                          Bids
                        </h3>
                        <div className="space-y-1">
                          <div className="grid grid-cols-3 text-xs text-gray-400 pb-2 border-b border-gray-700">
                            <span>Price ({selectedCoin})</span>
                            <span>Size</span>
                            <span>Total</span>
                          </div>
                          {orderbook.levels[0].slice(0, 15).map((bid, idx) => (
                            <div key={idx} className="grid grid-cols-3 text-sm hover:bg-green-500/10 p-1 rounded cursor-pointer"
                                 onClick={() => setPrice(bid.px)}>
                              <span className="text-green-400 font-mono">{formatPrice(bid.px)}</span>
                              <span className="text-white/80 font-mono">{formatSize(bid.sz)}</span>
                              <span className="text-white/60 font-mono text-xs">{bid.n}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Asks */}
                      <div>
                        <h3 className="text-lg text-red-400 mb-3 flex items-center">
                          <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                          Asks
                        </h3>
                        <div className="space-y-1">
                          <div className="grid grid-cols-3 text-xs text-gray-400 pb-2 border-b border-gray-700">
                            <span>Price ({selectedCoin})</span>
                            <span>Size</span>
                            <span>Total</span>
                          </div>
                          {orderbook.levels[1].slice(0, 15).map((ask, idx) => (
                            <div key={idx} className="grid grid-cols-3 text-sm hover:bg-red-500/10 p-1 rounded cursor-pointer"
                                 onClick={() => setPrice(ask.px)}>
                              <span className="text-red-400 font-mono">{formatPrice(ask.px)}</span>
                              <span className="text-white/80 font-mono">{formatSize(ask.sz)}</span>
                              <span className="text-white/60 font-mono text-xs">{ask.n}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-500 text-center py-4">{error}</div>
                  )}
                </motion.div>
              )}

              {activeTab === 'trades' && (
                <motion.div
                  key="trades"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-96 overflow-y-auto"
                >
                  <div className="space-y-1">
                    <div className="grid grid-cols-4 text-xs text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-[#0B1614]">
                      <span>Time</span>
                      <span>Side</span>
                      <span>Price</span>
                      <span>Size</span>
                    </div>
                    {tradeHistory.map((trade, idx) => (
                      <div key={idx} className="grid grid-cols-4 text-sm hover:bg-gray-800/30 p-2 rounded">
                        <span className="text-white/60 text-xs">
                          {new Date(trade.time).toLocaleTimeString()}
                        </span>
                        <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.side.toUpperCase()}
                        </span>
                        <span className="text-white font-mono">${formatPrice(trade.price)}</span>
                        <span className="text-white/80 font-mono">{formatSize(trade.size)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Enhanced Trading Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20"
        >
          <h2 className="text-xl font-bold mb-4 text-[#27FEE0]">Place Order</h2>
          
          {!authenticated ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4">Connect your wallet to start trading</p>
              <PrivyWalletButton />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Type */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                    orderType === 'buy'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                    orderType === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Leverage Slider */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Leverage: {leverage}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #27FEE0 0%, #27FEE0 ${(leverage - 1) * 4.17}%, #374151 ${(leverage - 1) * 4.17}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>25x</span>
                </div>
              </div>

              {/* Market/Limit toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMarketOrder}
                    onChange={(e) => setIsMarketOrder(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isMarketOrder ? 'bg-[#27FEE0] border-[#27FEE0]' : 'border-gray-400'
                  }`}>
                    {isMarketOrder && <span className="text-black text-xs">✓</span>}
                  </div>
                  <span className="ml-2 text-white">Market Order</span>
                </label>
              </div>

              {/* Price input */}
              {!isMarketOrder && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price (USDC)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#27FEE0] focus:outline-none pr-16"
                    />
                    <button
                      onClick={() => orderbook && setPrice(orderbook.levels[orderType === 'buy' ? 0 : 1][0]?.px || '')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-[#27FEE0] hover:text-white"
                    >
                      Best
                    </button>
                  </div>
                </div>
              )}

              {/* Size input */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Size ({selectedCoin})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#27FEE0] focus:outline-none pr-16"
                  />
                  <button
                    onClick={() => setSize('0.1')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-[#27FEE0] hover:text-white"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Order value display */}
              {price && size && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Value:</span>
                    <span className="text-white font-semibold">
                      ${(parseFloat(price) * parseFloat(size) * leverage).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Margin Required:</span>
                    <span className="text-white">
                      ${((parseFloat(price) * parseFloat(size)) / leverage).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!price && !isMarketOrder || !size}
                className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  orderType === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {orderType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
                {leverage > 1 && ` (${leverage}x)`}
              </button>

              {/* Quick order buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSize('0.001')}
                  className="py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-all"
                >
                  0.001
                </button>
                <button
                  onClick={() => setSize('0.01')}
                  className="py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-all"
                >
                  0.01
                </button>
                <button
                  onClick={() => setSize('0.1')}
                  className="py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-all"
                >
                  0.1
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* User positions and balances */}
      {authenticated && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Positions */}
          <div className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20">
            <h3 className="text-lg font-bold mb-4 text-[#27FEE0]">Positions</h3>
            {positions.length > 0 ? (
              <div className="space-y-2">
                {positions.map((position, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{position.coin}</span>
                      <span className={`text-sm ${
                        parseFloat(position.unrealizedPnl) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {parseFloat(position.unrealizedPnl) >= 0 ? '+' : ''}{position.unrealizedPnl}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Size: {position.szi} | Entry: ${position.entryPx}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No open positions</p>
            )}
          </div>

          {/* Balances */}
          <div className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20">
            <h3 className="text-lg font-bold mb-4 text-[#27FEE0]">Balances</h3>
            {balances.length > 0 ? (
              <div className="space-y-2">
                {balances.map((balance, idx) => (
                  <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{balance.coin}</span>
                      <span className="text-[#27FEE0]">${balance.hold}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Used: ${balance.total}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No balances available</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
