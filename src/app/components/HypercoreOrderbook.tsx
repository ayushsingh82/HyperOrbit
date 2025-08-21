'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { motion } from "framer-motion";
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

export default function HypercoreOrderbook() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [selectedCoin, setSelectedCoin] = useState<string>("BTC");
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Trading form state
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [isMarketOrder, setIsMarketOrder] = useState<boolean>(false);

  // Fetch orderbook data
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
    fetchOrderbook(selectedCoin);
  }, [selectedCoin, fetchOrderbook]);

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      fetchUserData(user.wallet.address);
    }
  }, [authenticated, user, fetchUserData]);

  // Auto-refresh orderbook every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCoin) {
        fetchOrderbook(selectedCoin);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedCoin, fetchOrderbook]);

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
    <div className="w-full max-w-6xl space-y-6">
      {/* Header with wallet connection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#27FEE0]">Hypercore Trading</h1>
          <PrivyWalletButton />
        </div>
        
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orderbook */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-[#0B1614] rounded-xl p-6 shadow-lg border border-[#27FEE0]/20"
        >
          <h2 className="text-xl font-bold mb-4 text-[#27FEE0]">
            {selectedCoin} Orderbook
            {orderbook && (
              <span className="text-sm text-gray-400 ml-2">
                Last updated: {new Date(orderbook.time).toLocaleTimeString()}
              </span>
            )}
          </h2>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#27FEE0] border-t-transparent rounded-full mx-auto"></div>
              <p className="text-white/60 mt-2">Loading orderbook...</p>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-center py-4 bg-red-500/10 rounded-lg">
              {error}
            </div>
          )}
          
          {orderbook && !loading && (
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
                  {orderbook.levels[0].slice(0, 10).map((bid, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-sm hover:bg-green-500/10 p-1 rounded">
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
                  {orderbook.levels[1].slice(0, 10).map((ask, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-sm hover:bg-red-500/10 p-1 rounded">
                      <span className="text-red-400 font-mono">{formatPrice(ask.px)}</span>
                      <span className="text-white/80 font-mono">{formatSize(ask.sz)}</span>
                      <span className="text-white/60 font-mono text-xs">{ask.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Trading Panel */}
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
                  <label className="block text-sm text-gray-400 mb-1">Price</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#27FEE0] focus:outline-none"
                  />
                </div>
              )}

              {/* Size input */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Size</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#27FEE0] focus:outline-none"
                />
              </div>

              {/* Submit button */}
              <button
                onClick={handlePlaceOrder}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  orderType === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {orderType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin}
              </button>
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
