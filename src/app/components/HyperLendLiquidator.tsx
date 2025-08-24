'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HyperLendProvider } from '@/app/lib/hyperLendProvider';
// TODO: Integrate these providers for enhanced functionality
// import HyperLendProvider from '../lib/hyperLendProvider';
// import HyperCoreProvider from '../lib/hyperCoreProvider';

// HyperLend types
interface Borrower {
  address: string;
  healthFactor: number;
  totalCollateral: number;
  totalDebt: number;
  collateralAssets: CollateralAsset[];
  debtAssets: DebtAsset[];
  lastUpdate: number;
}

interface CollateralAsset {
  symbol: string;
  amount: number;
  valueUSD: number;
  liquidationThreshold: number;
}

interface DebtAsset {
  symbol: string;
  amount: number;
  valueUSD: number;
  borrowRate: number;
}

interface InventoryAsset {
  symbol: string;
  amount: number;
  valueUSD: number;
  targetAmount: number;
}

interface LiquidationOpportunity {
  borrower: Borrower;
  collateralToSeize: CollateralAsset;
  debtToRepay: DebtAsset;
  profitEstimate: number;
  liquidationBonus: number;
  timestamp: number;
  executedAt?: number;
  status?: 'success' | 'failed';
}

export default function HyperLendLiquidator() {
  // Mock authentication and notification functions for demo
  const authenticated = true;
  const isConnected = true;
  const addNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }) => {
    console.log('Notification:', notification);
  }, []);

  // State management
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [inventory, setInventory] = useState<InventoryAsset[]>([]);
  const [liquidationOpportunities, setLiquidationOpportunities] = useState<LiquidationOpportunity[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'inventory' | 'opportunities' | 'history'>('monitor');
  const [autoLiquidationEnabled, setAutoLiquidationEnabled] = useState(false);
  const [minProfitThreshold] = useState(100); // USD
  const [liquidationHistory, setLiquidationHistory] = useState<LiquidationOpportunity[]>([]);

  // Monitoring refs
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize inventory with default assets
  useEffect(() => {
    setInventory([
      { symbol: 'HYPE', amount: 0, valueUSD: 0, targetAmount: 10000 },
      { symbol: 'USDe', amount: 0, valueUSD: 0, targetAmount: 50000 },
      { symbol: 'USDC', amount: 0, valueUSD: 0, targetAmount: 25000 },
      { symbol: 'ETH', amount: 0, valueUSD: 0, targetAmount: 10 },
    ]);
  }, []);

  // Fetch borrower data from HyperLend
  const fetchBorrowers = useCallback(async () => {
    try {
      // Use real HyperLend provider for MVP functionality
      const hyperLendProvider = new HyperLendProvider();
      const borrowersData = await hyperLendProvider.getBorrowers();
      
      // Convert to component's expected format
      const convertedBorrowers: Borrower[] = borrowersData.map(borrower => ({
        address: borrower.address,
        healthFactor: borrower.healthFactor,
        totalCollateral: borrower.totalCollateral,
        totalDebt: borrower.totalDebt,
        collateralAssets: borrower.collateralAssets,
        debtAssets: borrower.debtAssets,
        lastUpdate: borrower.lastUpdate
      }));
      
      setBorrowers(convertedBorrowers);
      
      // Log real data for debugging
      console.log('Real borrower data fetched:', convertedBorrowers);
      
      // Add notification for critical borrowers
      const criticalBorrowers = convertedBorrowers.filter(b => b.healthFactor < 1.1);
      if (criticalBorrowers.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Critical Borrowers Detected',
          message: `${criticalBorrowers.length} borrower(s) near liquidation (Health Factor < 1.1)`
        });
      }
      
    } catch (error) {
      console.error('Error fetching real borrowers:', error);
      
      addNotification({
        type: 'error',
        title: 'Data Fetch Failed',
        message: 'Failed to fetch real borrower data from HyperLend. Please check your connection.'
      });
      
      // Keep borrowers empty on error instead of using mock data
      setBorrowers([]);
    }
  }, [addNotification]);

  // Check for liquidation opportunities
  const checkLiquidationOpportunities = useCallback((borrowersData: Borrower[]) => {
    const opportunities: LiquidationOpportunity[] = [];
    
    borrowersData.forEach(borrower => {
      if (borrower.healthFactor < 1.0) {
        borrower.collateralAssets.forEach(collateral => {
          borrower.debtAssets.forEach(debt => {
            const liquidationBonus = 0.05; // 5% liquidation bonus
            const maxLiquidation = Math.min(debt.valueUSD * 0.5, collateral.valueUSD); // Max 50% liquidation
            const profitEstimate = maxLiquidation * liquidationBonus;
            
            opportunities.push({
              borrower,
              collateralToSeize: collateral,
              debtToRepay: debt,
              profitEstimate,
              liquidationBonus,
              timestamp: Date.now()
            });
          });
        });
      }
    });
    
    setLiquidationOpportunities(opportunities);
  }, []);

  // Execute liquidation flow
  const executeLiquidationFlow = useCallback(async (opportunity: LiquidationOpportunity) => {
    try {
      addNotification({
        type: 'info',
        title: 'Liquidation Started',
        message: 'Executing liquidation flow...'
      });
      
      // Simple liquidation flow - can be enhanced later
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock execution
      
      addNotification({
        type: 'success',
        title: 'Liquidation Successful',
        message: `Liquidation completed! Profit: $${opportunity.profitEstimate.toFixed(2)}`
      });
      
      // Update history
      setLiquidationHistory(prev => [...prev, {
        ...opportunity,
        executedAt: Date.now(),
        status: 'success' as const
      }]);
      
    } catch (error) {
      console.error('Liquidation execution error:', error);
      addNotification({
        type: 'error',
        title: 'Liquidation Failed',
        message: (error as Error).message
      });
    }
  }, [addNotification]);

  // Auto-liquidate opportunities when they are found
  useEffect(() => {
    const executeAutoLiquidation = async () => {
      if (autoLiquidationEnabled && liquidationOpportunities.length > 0) {
        for (const opportunity of liquidationOpportunities) {
          if (opportunity.profitEstimate >= minProfitThreshold) {
            await executeLiquidationFlow(opportunity);
          }
        }
      }
    };

    executeAutoLiquidation();
  }, [autoLiquidationEnabled, minProfitThreshold, liquidationOpportunities, executeLiquidationFlow]);

  // Effect to check liquidation opportunities when borrowers change
  useEffect(() => {
    if (borrowers.length > 0) {
      checkLiquidationOpportunities(borrowers);
    }
  }, [borrowers, checkLiquidationOpportunities]);

  // Manual liquidation trigger
  const executeLiquidation = useCallback(async (opportunity: LiquidationOpportunity) => {
    await executeLiquidationFlow(opportunity);
  }, [executeLiquidationFlow]);

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
        monitoringIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsMonitoring(false);
      addNotification({
        type: 'info',
        title: 'Monitoring Stopped',
        message: 'Liquidation monitoring stopped'
      });
    } else {
      // Start monitoring
      fetchBorrowers();
      monitoringIntervalRef.current = setInterval(fetchBorrowers, 30000); // Check every 30 seconds
      setIsMonitoring(true);
      addNotification({
        type: 'success',
        title: 'Monitoring Started',
        message: 'Liquidation monitoring started'
      });
    }
  }, [isMonitoring, fetchBorrowers, addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    const ws = wsRef.current;
    const interval = monitoringIntervalRef.current;
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">HyperLend Liquidator</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Auto Liquidation</span>
            <button
              onClick={() => setAutoLiquidationEnabled(!autoLiquidationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoLiquidationEnabled ? 'bg-[#27FEE0]' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoLiquidationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={toggleMonitoring}
            disabled={!authenticated}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#27FEE0] hover:bg-[#27FEE0]/80 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-800">
        {[
          { id: 'monitor', label: 'Monitor' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'opportunities', label: 'Opportunities' },
          { id: 'history', label: 'History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'monitor' | 'inventory' | 'opportunities' | 'history')}
            className={`py-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#27FEE0] text-[#27FEE0]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
            <div>
        <div
          key={activeTab}
          className="min-h-[400px]"
        >
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Monitored Borrowers</h3>
                  <p className="text-2xl font-bold text-white">{borrowers.length}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">At Risk (HF &lt; 1.1)</h3>
                  <p className="text-2xl font-bold text-orange-400">
                    {borrowers.filter(b => b.healthFactor < 1.1).length}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm text-gray-400 mb-2">Liquidatable (HF &lt; 1.0)</h3>
                  <p className="text-2xl font-bold text-red-400">
                    {borrowers.filter(b => b.healthFactor < 1.0).length}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {borrowers.map((borrower) => (
                  <div
                    key={borrower.address}
                    className={`bg-gray-800/30 rounded-lg p-4 border ${
                      borrower.healthFactor < 1.0
                        ? 'border-red-600'
                        : borrower.healthFactor < 1.1
                        ? 'border-orange-600'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{borrower.address}</p>
                        <p className="text-sm text-gray-400">
                          Collateral: ${borrower.totalCollateral.toLocaleString()} | 
                          Debt: ${borrower.totalDebt.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          borrower.healthFactor < 1.0
                            ? 'text-red-400'
                            : borrower.healthFactor < 1.1
                            ? 'text-orange-400'
                            : 'text-green-400'
                        }`}>
                          HF: {borrower.healthFactor.toFixed(3)}
                        </p>
                        {borrower.healthFactor < 1.0 && (
                          <button
                            onClick={() => {
                              const opportunity = liquidationOpportunities.find(
                                op => op.borrower.address === borrower.address
                              );
                              if (opportunity) executeLiquidation(opportunity);
                            }}
                            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                          >
                            Liquidate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map((asset) => (
                  <div key={asset.symbol} className="bg-gray-800/30 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-2">{asset.symbol}</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-400">Current</p>
                        <p className="text-white">{asset.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Target</p>
                        <p className="text-white">{asset.targetAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Value USD</p>
                        <p className="text-white">${asset.valueUSD.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              {liquidationOpportunities.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No liquidation opportunities found</p>
              ) : (
                liquidationOpportunities.map((opportunity, index) => (
                  <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-red-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">
                        Liquidation Opportunity #{index + 1}
                      </h3>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          Profit: ${opportunity.profitEstimate.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                          Bonus: {(opportunity.liquidationBonus * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Borrower</p>
                        <p className="text-white">{opportunity.borrower.address}</p>
                        <p className="text-red-400">HF: {opportunity.borrower.healthFactor.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Debt to Repay</p>
                        <p className="text-white">
                          {opportunity.debtToRepay.amount.toLocaleString()} {opportunity.debtToRepay.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Collateral to Seize</p>
                        <p className="text-white">
                          {opportunity.collateralToSeize.amount.toLocaleString()} {opportunity.collateralToSeize.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => executeLiquidation(opportunity)}
                        disabled={!authenticated || !isConnected}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Execute Liquidation
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {liquidationHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No liquidation history</p>
              ) : (
                liquidationHistory.map((liquidation, index) => (
                  <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{liquidation.borrower.address}</p>
                        <p className="text-sm text-gray-400">
                          {liquidation.executedAt ? new Date(liquidation.executedAt).toLocaleString() : 'Pending'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          +${liquidation.profitEstimate.toFixed(2)}
                        </p>
                        <p className={`text-sm ${
                          liquidation.status === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {liquidation.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {!authenticated && (
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <p className="text-yellow-400 text-center">
            Connect your wallet to start liquidation monitoring
          </p>
        </div>
      )}
    </div>
  );
}
