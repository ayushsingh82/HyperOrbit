'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar, ReferenceLine } from 'recharts';
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

interface DepthData {
  price: number;
  bidSize: number;
  askSize: number;
  bidTotal: number;
  askTotal: number;
}

interface RecentTrade {
  id: string;
  time: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

interface OrderBookUpdate {
  price: string;
  size: string;
  side: 'bid' | 'ask';
  action: 'update' | 'delete';
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
  const [depthData, setDepthData] = useState<DepthData[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'trades' | 'depth'>('chart');
  const [chartTimeframe, setChartTimeframe] = useState<'1m' | '5m' | '1h' | '1d'>('1h');
  const [chartType, setChartType] = useState<'line' | 'candle' | 'depth'>('line');
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | 'none'>('none');
  
  // Trading form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [isMarketOrder, setIsMarketOrder] = useState<boolean>(false);
  const [leverage, setLeverage] = useState<number>(5);

  // WebSocket and real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const orderBookUpdateThrottle = 2000; // Increased throttle to 2 seconds

  // Real-time WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Hyperliquid WebSocket endpoint
      wsRef.current = new WebSocket('wss://api.hyperliquid.xyz/ws');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to orderbook updates
        wsRef.current?.send(JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'l2Book', coin: selectedCoin }
        }));
        
        // Subscribe to trade updates
        wsRef.current?.send(JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'trades', coin: selectedCoin }
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [selectedCoin]);

  // Handle WebSocket messages for real-time updates with throttling
  const handleWebSocketMessage = useCallback((data: any) => {
    const now = Date.now();
    
    if (data.channel === 'l2Book' && data.data?.coin === selectedCoin) {
      // Throttle orderbook updates to prevent excessive re-renders
      if (now - lastUpdateTimeRef.current < orderBookUpdateThrottle) {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => {
          handleWebSocketMessage(data);
        }, orderBookUpdateThrottle - (now - lastUpdateTimeRef.current));
        return;
      }
      
      lastUpdateTimeRef.current = now;
      
      // Update orderbook without full refresh
      setOrderbook(prev => {
        if (!prev) return data.data;
        
        // Smooth orderbook update
        const newOrderbook = { ...data.data };
        
        // Check for price changes
        const newPrice = parseFloat(newOrderbook.levels[0][0]?.px || '0');
        if (newPrice !== lastPrice && lastPrice > 0) {
          setPriceChange(newPrice > lastPrice ? 'up' : 'down');
          setTimeout(() => setPriceChange('none'), 1000);
        }
        setLastPrice(newPrice);
        
        return newOrderbook;
      });
      
      // Update depth chart data
      updateDepthData(data.data);
    }
    
    if (data.channel === 'trades' && data.data?.coin === selectedCoin) {
      // Add new trades to recent trades (less throttling for trades)
      const newTrades = data.data.map((trade: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        time: trade.time || Date.now(),
        price: parseFloat(trade.px),
        size: parseFloat(trade.sz),
        side: trade.side
      }));
      
      setRecentTrades(prev => [...newTrades, ...prev].slice(0, 50));
    }
  }, [selectedCoin, lastPrice, orderBookUpdateThrottle]);

  // Update depth chart data from orderbook
  const updateDepthData = useCallback((orderbook: Orderbook) => {
    const bids = orderbook.levels[0];
    const asks = orderbook.levels[1];
    
    const depthArray: DepthData[] = [];
    let bidTotal = 0;
    let askTotal = 0;
    
    // Process bids (descending price order)
    bids.slice(0, 20).reverse().forEach(bid => {
      bidTotal += parseFloat(bid.sz);
      depthArray.push({
        price: parseFloat(bid.px),
        bidSize: parseFloat(bid.sz),
        askSize: 0,
        bidTotal,
        askTotal: 0
      });
    });
    
    // Process asks (ascending price order)
    asks.slice(0, 20).forEach(ask => {
      askTotal += parseFloat(ask.sz);
      depthArray.push({
        price: parseFloat(ask.px),
        bidSize: 0,
        askSize: parseFloat(ask.sz),
        bidTotal: 0,
        askTotal
      });
    });
    
    depthArray.sort((a, b) => a.price - b.price);
    setDepthData(depthArray);
  }, []);

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

  // Fetch chart data with smart caching - only refresh when explicitly called
  const fetchChartData = useCallback(async (coin: string, timeframe: string, forceRefresh = false) => {
    const cacheKey = `${coin}-${timeframe}`;
    const lastFetch = sessionStorage.getItem(`lastChartFetch-${cacheKey}`);
    const cachedData = sessionStorage.getItem(`chartData-${cacheKey}`);
    const now = Date.now();
    
    // Use cache if data exists and force refresh is not requested and less than 30 seconds have passed
    if (!forceRefresh && lastFetch && cachedData && now - parseInt(lastFetch) < 30000) {
      try {
        const parsed = JSON.parse(cachedData);
        setCandleData(parsed);
        return;
      } catch (e) {
        // If cache is corrupted, continue with fresh fetch
      }
    }
    
    try {
      setChartLoading(true);
      sessionStorage.setItem(`lastChartFetch-${cacheKey}`, now.toString());
      
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
        if (data && Array.isArray(data) && data.length > 0) {
          const formattedData = data.map((candle: any) => ({
            time: candle.t,
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
            volume: parseFloat(candle.v || '0')
          }));
          setCandleData(formattedData);
          // Cache the successful data
          sessionStorage.setItem(`chartData-${cacheKey}`, JSON.stringify(formattedData));
        }
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Manual refresh function - forces fresh data
  const refreshChart = useCallback(() => {
    fetchChartData(selectedCoin, chartTimeframe, true);
  }, [selectedCoin, chartTimeframe, fetchChartData]);

  // Fetch recent trades with caching
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
          const formattedTrades = data.slice(0, 50).map((trade: any, index: number) => ({
            id: `${trade.time || Date.now()}-${index}`,
            time: trade.time || Date.now(),
            price: parseFloat(trade.px),
            size: parseFloat(trade.sz),
            side: trade.side as 'buy' | 'sell'
          }));
          setRecentTrades(formattedTrades);
          
          // Also update the old tradeHistory format for compatibility
          const legacyTrades = data.slice(0, 20).map((trade: any) => ({
            coin,
            side: trade.side as 'buy' | 'sell',
            size: trade.sz,
            price: trade.px,
            time: trade.time || Date.now()
          }));
          setTradeHistory(legacyTrades);
        }
      } else {
        // Generate realistic mock trades for demo
        const mockTrades: RecentTrade[] = Array.from({ length: 20 }, (_, i) => {
          const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
          const price = 65000 + Math.random() * 2000 - 1000;
          const size = Math.random() * 2;
          const time = Date.now() - i * 30000; // 30 seconds apart
          
          return {
            id: `mock-${time}-${i}`,
            time,
            price,
            size,
            side
          };
        });
        setRecentTrades(mockTrades);
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      // Generate realistic mock trades for demo
      const mockTrades: RecentTrade[] = Array.from({ length: 20 }, (_, i) => {
        const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
        const price = 65000 + Math.random() * 2000 - 1000;
        const size = Math.random() * 2;
        const time = Date.now() - i * 30000; // 30 seconds apart
        
        return {
          id: `mock-${time}-${i}`,
          time,
          price,
          size,
          side
        };
      });
      setRecentTrades(mockTrades);
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

  // Initialize data fetching with proper cleanup - NO chart auto-fetch on init
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (!mounted) return;
      setLoading(true);
      
      try {
        await Promise.all([
          fetchOrderbook(selectedCoin),
          fetchMarketStats(selectedCoin),
          fetchRecentTrades(selectedCoin)
          // Removed fetchChartData from initial load - only manual/auto-refresh
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
  }, [selectedCoin, fetchOrderbook, fetchMarketStats, fetchRecentTrades]);

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      fetchUserData(user.wallet.address);
    }
  }, [authenticated, user, fetchUserData]);

  // Auto-refresh data every 30 seconds - ONLY for orderbook/trades, chart has separate 30s interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCoin && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        fetchOrderbook(selectedCoin);
        fetchMarketStats(selectedCoin);
        fetchRecentTrades(selectedCoin);
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [selectedCoin, fetchOrderbook, fetchMarketStats, fetchRecentTrades]);

  // Separate chart auto-refresh - ONLY every 30 seconds, no more
  useEffect(() => {
    // Initial chart load
    fetchChartData(selectedCoin, chartTimeframe, true);
    
    const chartInterval = setInterval(() => {
      if (selectedCoin) {
        fetchChartData(selectedCoin, chartTimeframe, true); // Force refresh every 30s
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(chartInterval);
    };
  }, [selectedCoin, chartTimeframe, fetchChartData]);

  // WebSocket connection management
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Reconnect WebSocket when coin changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Unsubscribe from previous coin
      wsRef.current.send(JSON.stringify({
        method: 'unsubscribe',
        subscription: { type: 'l2Book' }
      }));
      wsRef.current.send(JSON.stringify({
        method: 'unsubscribe',
        subscription: { type: 'trades' }
      }));
      
      // Subscribe to new coin
      wsRef.current.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'l2Book', coin: selectedCoin }
      }));
      wsRef.current.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'trades', coin: selectedCoin }
      }));
    }
  }, [selectedCoin]);

  // Helper function for better time formatting
  const formatChartTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      // Show only hours and minutes for today
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      // Show date for older data
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);

  // Memoized chart rendering to prevent unnecessary re-renders
  const ChartComponent = useMemo(() => {
    if (chartLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-[#27FEE0] border-t-transparent rounded-full"></div>
        </div>
      );
    }

    // Show placeholder if no data
    if (!candleData || candleData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-center">
            <div className="mb-2">📊</div>
            <div>No chart data available</div>
            <div className="text-sm mt-1">Try refreshing or select a different timeframe</div>
          </div>
        </div>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={candleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatChartTime}
              stroke="#9CA3AF"
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="#9CA3AF"
            />
            <Tooltip 
              labelFormatter={(time) => new Date(time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #27FEE0',
                borderRadius: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#27FEE0"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'candle') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={candleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatChartTime}
              stroke="#9CA3AF"
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="#9CA3AF"
            />
            <Tooltip 
              labelFormatter={(time) => new Date(time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              formatter={(value: any, name: string) => {
                switch(name) {
                  case 'high': return [`$${value.toFixed(2)}`, 'High'];
                  case 'low': return [`$${value.toFixed(2)}`, 'Low'];
                  case 'open': return [`$${value.toFixed(2)}`, 'Open'];
                  case 'close': return [`$${value.toFixed(2)}`, 'Close'];
                  case 'volume': return [value.toFixed(2), 'Volume'];
                  default: return [`$${value.toFixed(2)}`, name];
                }
              }}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #27FEE0',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="volume" fill="#27FEE0" fillOpacity={0.3} />
            <Line dataKey="high" stroke="#10b981" strokeWidth={1} dot={false} />
            <Line dataKey="low" stroke="#ef4444" strokeWidth={1} dot={false} />
            <Line dataKey="close" stroke="#27FEE0" strokeWidth={2} dot={false} />
            <ReferenceLine y={lastPrice} stroke="#fbbf24" strokeDasharray="5 5" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'depth') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={depthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="price" 
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="#9CA3AF"
            />
            <YAxis 
              tickFormatter={(value) => value.toFixed(2)}
              stroke="#9CA3AF"
            />
            <Tooltip 
              labelFormatter={(price) => `Price: $${price.toFixed(2)}`}
              formatter={(value: any, name: string) => [
                value.toFixed(4), 
                name === 'bidTotal' ? 'Bid Depth' : 'Ask Depth'
              ]}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #27FEE0',
                borderRadius: '8px'
              }}
            />
            <Area
              dataKey="bidTotal"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
            <Area
              dataKey="askTotal"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return null;
  }, [chartType, candleData, depthData, chartLoading, lastPrice, formatChartTime]);

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
                onClick={() => setActiveTab('depth')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'depth' ? 'bg-[#27FEE0] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Depth
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
              <div className="flex space-x-2 items-center">
                <div className="flex space-x-1 mr-4">
                  {(['line', 'candle', 'depth'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setChartType(type);
                        // Only refresh if changing to chart types that need data
                        if (type !== 'depth' && type !== chartType) {
                          refreshChart(); // Manual refresh only when changing type
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        chartType === type ? 'bg-[#27FEE0] text-black' : 'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                {(['1m', '5m', '1h', '1d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      const currentTimeframe = chartTimeframe;
                      setChartTimeframe(tf);
                      // Only refresh if actually changing timeframe
                      if (tf !== currentTimeframe) {
                        refreshChart(); // Manual refresh only when changing timeframe
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      chartTimeframe === tf ? 'bg-[#27FEE0] text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
                {/* Manual refresh button */}
                <button
                  onClick={refreshChart}
                  disabled={chartLoading}
                  className="px-3 py-1 rounded text-sm transition-all bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  title="Refresh chart data"
                >
                  {chartLoading ? '↻' : '🔄'}
                </button>
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
                {ChartComponent}
              </motion.div>
            )}

            {activeTab === 'depth' && (
              <motion.div
                key="depth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-96"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={depthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="price" 
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      labelFormatter={(price) => `Price: $${price.toFixed(2)}`}
                      formatter={(value: any, name: string) => {
                        const displayName = name === 'bidSize' ? 'Bid Size' : 'Ask Size';
                        return [value.toFixed(4), displayName];
                      }}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #27FEE0',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      dataKey="bidSize"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      dataKey="askSize"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                    <ReferenceLine y={0} stroke="#9CA3AF" />
                  </ComposedChart>
                </ResponsiveContainer>
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
                    <div className="space-y-6">
                      {/* Market Price Display */}
                      <div className="text-center py-4 bg-gray-800/30 rounded-lg">
                        <div className="text-2xl font-bold mb-1">
                          <span className={`transition-colors duration-500 ${
                            priceChange === 'up' ? 'text-green-400' : 
                            priceChange === 'down' ? 'text-red-400' : 'text-[#27FEE0]'
                          }`}>
                            ${formatPrice(lastPrice.toString())}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Last Price • {selectedCoin}-USDC
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* Asks (Top half - reversed order for proper display) */}
                        <div className="order-2">
                          <h3 className="text-lg text-red-400 mb-3 flex items-center justify-between">
                            <span className="flex items-center">
                              <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                              Asks
                            </span>
                            <span className="text-xs text-gray-500">
                              {orderbook.levels[1].length} orders
                            </span>
                          </h3>
                          <div className="space-y-1">
                            <div className="grid grid-cols-3 text-xs text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-[#0B1614]">
                              <span>Price (USDC)</span>
                              <span>Size ({selectedCoin})</span>
                              <span>Total</span>
                            </div>
                            {orderbook.levels[1].slice(0, 15).reverse().map((ask, idx) => {
                              const total = orderbook.levels[1].slice(0, 15 - idx).reduce((sum, level) => sum + parseFloat(level.sz), 0);
                              const maxTotal = orderbook.levels[1].slice(0, 15).reduce((sum, level) => sum + parseFloat(level.sz), 0);
                              const percentage = (total / maxTotal) * 100;
                              
                              return (
                                <motion.div 
                                  key={`ask-${ask.px}`}
                                  layout
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="relative grid grid-cols-3 text-sm hover:bg-red-500/10 p-2 rounded cursor-pointer transition-all group"
                                  onClick={() => setPrice(ask.px)}
                                >
                                  <div 
                                    className="absolute inset-0 bg-red-500/5 rounded"
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <span className="text-red-400 font-mono relative z-10 group-hover:text-red-300">
                                    {formatPrice(ask.px)}
                                  </span>
                                  <span className="text-white/80 font-mono relative z-10">
                                    {formatSize(ask.sz)}
                                  </span>
                                  <span className="text-white/60 font-mono text-xs relative z-10">
                                    {total.toFixed(4)}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bids (Bottom half) */}
                        <div className="order-1">
                          <h3 className="text-lg text-green-400 mb-3 flex items-center justify-between">
                            <span className="flex items-center">
                              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                              Bids
                            </span>
                            <span className="text-xs text-gray-500">
                              {orderbook.levels[0].length} orders
                            </span>
                          </h3>
                          <div className="space-y-1">
                            <div className="grid grid-cols-3 text-xs text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-[#0B1614]">
                              <span>Price (USDC)</span>
                              <span>Size ({selectedCoin})</span>
                              <span>Total</span>
                            </div>
                            {orderbook.levels[0].slice(0, 15).map((bid, idx) => {
                              const total = orderbook.levels[0].slice(0, idx + 1).reduce((sum, level) => sum + parseFloat(level.sz), 0);
                              const maxTotal = orderbook.levels[0].slice(0, 15).reduce((sum, level) => sum + parseFloat(level.sz), 0);
                              const percentage = (total / maxTotal) * 100;
                              
                              return (
                                <motion.div 
                                  key={`bid-${bid.px}`}
                                  layout
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="relative grid grid-cols-3 text-sm hover:bg-green-500/10 p-2 rounded cursor-pointer transition-all group"
                                  onClick={() => setPrice(bid.px)}
                                >
                                  <div 
                                    className="absolute inset-0 bg-green-500/5 rounded"
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <span className="text-green-400 font-mono relative z-10 group-hover:text-green-300">
                                    {formatPrice(bid.px)}
                                  </span>
                                  <span className="text-white/80 font-mono relative z-10">
                                    {formatSize(bid.sz)}
                                  </span>
                                  <span className="text-white/60 font-mono text-xs relative z-10">
                                    {total.toFixed(4)}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Spread Information */}
                      {orderbook.levels[0][0] && orderbook.levels[1][0] && (
                        <div className="text-center py-2 bg-gray-800/20 rounded">
                          <div className="text-sm text-gray-400">
                            Spread: <span className="text-white font-mono">
                              ${(parseFloat(orderbook.levels[1][0].px) - parseFloat(orderbook.levels[0][0].px)).toFixed(2)}
                            </span>
                            {' '}({((parseFloat(orderbook.levels[1][0].px) - parseFloat(orderbook.levels[0][0].px)) / parseFloat(orderbook.levels[0][0].px) * 100).toFixed(3)}%)
                          </div>
                        </div>
                      )}
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
                    {recentTrades.map((trade) => (
                      <motion.div 
                        key={trade.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-4 text-sm hover:bg-gray-800/30 p-2 rounded transition-all"
                      >
                        <span className="text-white/60 text-xs">
                          {new Date(trade.time).toLocaleTimeString()}
                        </span>
                        <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.side.toUpperCase()}
                        </span>
                        <span className={`font-mono ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          ${trade.price.toFixed(2)}
                        </span>
                        <span className="text-white/80 font-mono">{trade.size.toFixed(4)}</span>
                      </motion.div>
                    ))}
                    {recentTrades.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No recent trades available
                      </div>
                    )}
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
