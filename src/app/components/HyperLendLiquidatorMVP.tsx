'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HyperLendProvider, type HyperLendBorrower } from '@/app/lib/hyperLendProvider';
import { realTimePriceProvider } from '@/app/lib/realTimePriceProvider';

interface LiquidationOpportunity {
  borrower: HyperLendBorrower;
  profitEstimate: number;
  liquidationBonus: number;
  maxLiquidationValue: number;
  timestamp: number;
}

export default function HyperLendLiquidatorMVP() {
  const [borrowers, setBorrowers] = useState<HyperLendBorrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [liquidationOpportunities, setLiquidationOpportunities] = useState<LiquidationOpportunity[]>([]);
  const [liquidationInProgress, setLiquidationInProgress] = useState<Set<string>>(new Set());
  const [realTimePricesActive, setRealTimePricesActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const hyperLendProvider = React.useMemo(() => new HyperLendProvider(), []);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize real-time price feeds
  useEffect(() => {
    const initializePrices = async () => {
      try {
        await realTimePriceProvider.initialize();
        setRealTimePricesActive(true);
        console.log('Real-time price feeds initialized');
      } catch (error) {
        console.error('Failed to initialize real-time prices:', error);
        setRealTimePricesActive(false);
      }
    };

    initializePrices();

    // Cleanup on unmount
    return () => {
      realTimePriceProvider.destroy();
    };
  }, []);

  // Real-time data fetching
  const fetchBorrowers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await hyperLendProvider.getBorrowers();
      
      // Sort by health factor (lowest first - most at risk)
      const sortedData = data.sort((a, b) => a.healthFactor - b.healthFactor);
      
      setBorrowers(sortedData);
      setLastUpdate(new Date());
      
      // Calculate liquidation opportunities
      const opportunities: LiquidationOpportunity[] = [];
      
      sortedData.forEach(borrower => {
        if (borrower.healthFactor < 1.0) {
          const maxLiquidationValue = borrower.totalDebt * 0.5; // 50% max liquidation
          const liquidationBonus = 0.05; // 5% bonus
          const profitEstimate = maxLiquidationValue * liquidationBonus;
          
          opportunities.push({
            borrower,
            profitEstimate,
            liquidationBonus,
            maxLiquidationValue,
            timestamp: Date.now()
          });
        }
      });
      
      setLiquidationOpportunities(opportunities);
      
      console.log('Real data fetched:', {
        borrowersCount: sortedData.length,
        opportunitiesCount: opportunities.length,
        criticalBorrowers: sortedData.filter(b => b.healthFactor < 1.1).length
      });
      
    } catch (error) {
      console.error('Error fetching borrowers:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch borrower data');
    } finally {
      setLoading(false);
    }
  }, [hyperLendProvider]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchBorrowers();
    
    if (autoRefresh) {
      const interval = setInterval(fetchBorrowers, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchBorrowers, autoRefresh]);

  const executeLiquidation = async (opportunity: LiquidationOpportunity) => {
    const borrower = opportunity.borrower;
    
    try {
      setLiquidationInProgress(prev => new Set(prev).add(borrower.address));
      
      // Simulate real liquidation process
      console.log('Executing liquidation:', {
        borrower: borrower.address,
        healthFactor: borrower.healthFactor,
        maxLiquidation: opportunity.maxLiquidationValue,
        estimatedProfit: opportunity.profitEstimate
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call smart contract or API
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        console.log('Liquidation successful');
        // Refresh data after successful liquidation
        await fetchBorrowers();
      } else {
        throw new Error('Liquidation failed - insufficient liquidity');
      }
      
    } catch (error) {
      console.error('Liquidation error:', error);
    } finally {
      setLiquidationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(borrower.address);
        return newSet;
      });
    }
  };

  const getHealthFactorColor = (healthFactor: number) => {
    if (healthFactor < 1.0) return 'text-red-500';
    if (healthFactor < 1.1) return 'text-yellow-500';
    if (healthFactor < 1.3) return 'text-orange-500';
    return 'text-green-500';
  };

  const getHealthFactorBg = (healthFactor: number) => {
    if (healthFactor < 1.0) return 'bg-red-900/20 border-l-4 border-red-500';
    if (healthFactor < 1.1) return 'bg-yellow-900/20 border-l-4 border-yellow-500';
    if (healthFactor < 1.3) return 'bg-orange-900/20 border-l-4 border-orange-500';
    return 'bg-green-900/20 border-l-4 border-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#27FEE0] to-white bg-clip-text text-transparent">
              HyperLend Liquidator MVP
            </h2>
            <p className="text-gray-400">Real-time borrower monitoring and automated liquidations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${realTimePricesActive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-400">
                {realTimePricesActive ? 'Real-time prices' : 'Polling prices'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Last Update: {isClient ? lastUpdate.toLocaleTimeString() : '--:--:--'}
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-[#27FEE0] focus:ring-[#27FEE0]"
              />
              <span className="text-sm text-gray-300">Auto Refresh</span>
            </label>
            <button
              onClick={fetchBorrowers}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-[#27FEE0] to-[#1E40AF] text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{borrowers.length}</div>
            <div className="text-sm text-gray-400">Total Borrowers</div>
          </div>
          <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {borrowers.filter(b => b.healthFactor < 1.0).length}
            </div>
            <div className="text-sm text-gray-400">Liquidatable</div>
          </div>
          <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {borrowers.filter(b => b.healthFactor < 1.1 && b.healthFactor >= 1.0).length}
            </div>
            <div className="text-sm text-gray-400">At Risk</div>
          </div>
          <div className="bg-green-900/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#27FEE0]">
              ${liquidationOpportunities.reduce((sum, opp) => sum + opp.profitEstimate, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Profit Potential</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-sm font-medium">Error: {error}</div>
          </div>
        </div>
      )}

      {/* Borrowers List */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Active Borrowers</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#27FEE0] mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading real borrower data...</p>
          </div>
        ) : borrowers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No borrowers found
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {borrowers.map((borrower) => (
              <div
                key={borrower.address}
                className={`p-6 ${getHealthFactorBg(borrower.healthFactor)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="font-mono text-sm text-gray-400">
                        {borrower.address}
                      </div>
                      <div className={`font-bold ${getHealthFactorColor(borrower.healthFactor)}`}>
                        HF: {borrower.healthFactor.toFixed(3)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Collateral</div>
                        <div className="font-semibold text-white">${borrower.totalCollateral.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">
                          {borrower.collateralAssets.map(asset => 
                            `${asset.amount.toFixed(2)} ${asset.symbol}`
                          ).join(', ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Debt</div>
                        <div className="font-semibold text-white">${borrower.totalDebt.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">
                          {borrower.debtAssets.map(asset => 
                            `${asset.amount.toFixed(2)} ${asset.symbol}`
                          ).join(', ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Last Update</div>
                        <div className="font-semibold text-white">
                          {isClient ? new Date(borrower.lastUpdate).toLocaleTimeString() : '--:--:--'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {borrower.healthFactor < 1.0 && (
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          const opportunity = liquidationOpportunities.find(
                            opp => opp.borrower.address === borrower.address
                          );
                          if (opportunity) {
                            executeLiquidation(opportunity);
                          }
                        }}
                        disabled={liquidationInProgress.has(borrower.address)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {liquidationInProgress.has(borrower.address) ? 'Liquidating...' : 'Liquidate'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liquidation Opportunities */}
      {liquidationOpportunities.length > 0 && (
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Liquidation Opportunities</h3>
          </div>
          <div className="divide-y divide-gray-700">
            {liquidationOpportunities.map((opportunity, index) => (
              <div key={index} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm text-gray-400 mb-1">
                      {opportunity.borrower.address}
                    </div>
                    <div className="text-sm text-gray-300">
                      Max Liquidation: ${opportunity.maxLiquidationValue.toLocaleString()} | 
                      Estimated Profit: <span className="text-[#27FEE0]">${opportunity.profitEstimate.toFixed(2)}</span> ({(opportunity.liquidationBonus * 100).toFixed(1)}% bonus)
                    </div>
                  </div>
                  <button
                    onClick={() => executeLiquidation(opportunity)}
                    disabled={liquidationInProgress.has(opportunity.borrower.address)}
                    className="px-4 py-2 bg-gradient-to-r from-[#27FEE0] to-green-500 text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {liquidationInProgress.has(opportunity.borrower.address) ? 'Executing...' : 'Execute'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
