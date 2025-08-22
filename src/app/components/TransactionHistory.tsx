'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StoredTrade {
  sz: string;
  executionPrice: string;
  timestamp: number;
  coin: string;
  is_buy: boolean;
}

interface StoredStrategy {
  txHash: string;
  timestamp: number;
  status?: string;
  strategyType: string;
  gasUsed: number;
  deploymentCost: string;
}

interface Transaction {
  txHash: string;
  type: 'trade' | 'strategy';
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  amount?: string;
  price?: string;
  symbol?: string;
  side?: 'buy' | 'sell';
  strategyName?: string;
  gasUsed?: number;
  deploymentCost?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'trades' | 'strategies'>('all');

  useEffect(() => {
    // Load transactions from localStorage
    const loadTransactions = () => {
      const trades = JSON.parse(localStorage.getItem('hyperliquid-orders') || '[]');
      const strategies = JSON.parse(localStorage.getItem('strategy-deployments') || '[]');
      
      const allTransactions: Transaction[] = [
        ...trades.map((trade: StoredTrade) => ({
          txHash: trade.executionPrice ? `0x${Date.now().toString(16)}trade${Math.random().toString(16).substr(2, 8)}` : 'pending',
          type: 'trade' as const,
          timestamp: trade.timestamp,
          status: 'confirmed' as const,
          amount: trade.sz,
          price: trade.executionPrice,
          symbol: trade.coin,
          side: trade.is_buy ? 'buy' as const : 'sell' as const
        })),
        ...strategies.map((strategy: StoredStrategy) => ({
          txHash: strategy.txHash,
          type: 'strategy' as const,
          timestamp: strategy.timestamp,
          status: strategy.status || 'confirmed' as const,
          strategyName: strategy.strategyType,
          gasUsed: strategy.gasUsed,
          deploymentCost: strategy.deploymentCost
        }))
      ];
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTransactions);
    };

    loadTransactions();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'trades') return tx.type === 'trade';
    if (filter === 'strategies') return tx.type === 'strategy';
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTxHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Transaction History</h3>
        <div className="flex space-x-2">
          {(['all', 'trades', 'strategies'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                filter === filterType 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions found. Start trading or deploy a strategy!
          </div>
        ) : (
          filteredTransactions.map((tx, index) => (
            <motion.div
              key={tx.txHash + index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tx.type === 'trade' 
                        ? 'bg-green-600/20 text-green-300' 
                        : 'bg-purple-600/20 text-purple-300'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'confirmed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : tx.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {tx.type === 'trade' ? (
                    <div className="text-white">
                      <span className={`font-medium ${
                        tx.side === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.side?.toUpperCase()}
                      </span>
                      {' '}{tx.amount} {tx.symbol} @ ${tx.price}
                    </div>
                  ) : (
                    <div className="text-white">
                      <span className="font-medium text-purple-400">
                        {tx.strategyName}
                      </span>
                      {tx.deploymentCost && (
                        <span className="text-gray-400 ml-2">
                          (Cost: ${tx.deploymentCost})
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <span>{formatTime(tx.timestamp)}</span>
                    <span className="font-mono">{formatTxHash(tx.txHash)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tx.txHash);
                    alert('Transaction hash copied to clipboard!');
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Copy transaction hash"
                >
                  📋
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {filteredTransactions.length > 0 && (
        <div className="mt-4 text-center text-gray-400 text-sm">
          Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
