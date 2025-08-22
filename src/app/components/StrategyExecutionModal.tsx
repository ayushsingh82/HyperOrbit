'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useYieldStrategy } from '../hooks/useHyperdriveContracts';
import { MarketKey, MARKET_CONFIGS } from '../lib/hyperdriveContracts';

interface StrategyExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyId: string;
  strategyName: string;
}

interface ExecutionParams {
  collateralAmount: string;
  leverage: number;
  market: MarketKey;
  slippage: number;
  deadline: number; // minutes
}

export default function StrategyExecutionModal({ 
  isOpen, 
  onClose, 
  strategyId, 
  strategyName 
}: StrategyExecutionModalProps) {
  const {
    loading,
    error,
    executeLeveragedStaking,
    executeRecursiveYieldFarming,
    executeDeltaNeutralStrategy,
    supplyAndBorrow
  } = useYieldStrategy();

  const [params, setParams] = useState<ExecutionParams>({
    collateralAmount: '1000',
    leverage: 2,
    market: 'HYPE-USDe',
    slippage: 0.5,
    deadline: 20
  });

  const [currentStep, setCurrentStep] = useState<'config' | 'confirm' | 'executing' | 'success' | 'error'>('config');
  const [txHash, setTxHash] = useState<string>('');

  const handleExecute = useCallback(async () => {
    setCurrentStep('executing');
    
    try {
      let result;
      
      console.log('Executing strategy:', {
        strategyId,
        params,
        user: 'authenticated'
      });
      
      // Add strategy validation
      if (!params.collateralAmount || parseFloat(params.collateralAmount) <= 0) {
        throw new Error('Invalid collateral amount');
      }
      
      if (params.leverage < 1 || params.leverage > 10) {
        throw new Error('Leverage must be between 1x and 10x');
      }
      
      switch (strategyId) {
        case 'leveraged_liquid_staking':
          result = await executeLeveragedStaking(
            params.collateralAmount,
            params.leverage,
            params.market.startsWith('HYPE') ? 'HYPE' : 'ETH'
          );
          break;
          
        case 'yield_farming_recursive':
          result = await executeRecursiveYieldFarming(
            params.collateralAmount,
            Math.floor(params.leverage),
            params.market
          );
          break;
          
        case 'delta_neutral_farming':
          result = await executeDeltaNeutralStrategy(
            params.collateralAmount,
            1.0,
            params.market
          );
          break;
          
        default:
          // Simple supply and borrow for other strategies
          const borrowAmount = (parseFloat(params.collateralAmount) * (params.leverage - 1) * 0.9).toString();
          result = await supplyAndBorrow(
            params.market,
            params.collateralAmount,
            borrowAmount
          );
      }

      if (result?.success) {
        setTxHash(result.hash);
        setCurrentStep('success');
        
        // Save successful strategy deployment
        const deploymentRecord = {
          strategyId,
          strategyName,
          params,
          txHash: result.hash,
          timestamp: Date.now(),
          status: 'completed'
        };
        
        const savedDeployments = JSON.parse(localStorage.getItem('strategy-deployments') || '[]');
        savedDeployments.push(deploymentRecord);
        localStorage.setItem('strategy-deployments', JSON.stringify(savedDeployments));
        
        console.log('Strategy deployed successfully:', deploymentRecord);
      } else {
        setCurrentStep('error');
      }
    } catch (err) {
      console.error('Strategy execution failed:', err);
      setCurrentStep('error');
    }
  }, [strategyId, strategyName, params, executeLeveragedStaking, executeRecursiveYieldFarming, executeDeltaNeutralStrategy, supplyAndBorrow]);

  const calculateExpectedReturns = useCallback(() => {
    const amount = parseFloat(params.collateralAmount);
    const leverage = params.leverage;
    
    // Mock calculation based on strategy type
    const baseAPY = {
      'leveraged_liquid_staking': 18.5,
      'yield_farming_recursive': 22.3,
      'delta_neutral_farming': 15.2,
      'cross_chain_arbitrage': 28.7,
      'volatile_carry_trade': 35.4,
      'liquidation_protection': 12.8
    }[strategyId] || 15;

    const leveragedAPY = baseAPY + (leverage - 1) * 5; // Simplified calculation
    const yearlyReturn = amount * leverage * (leveragedAPY / 100);
    const monthlyReturn = yearlyReturn / 12;

    return { yearlyReturn, monthlyReturn, leveragedAPY };
  }, [params, strategyId]);

  const returns = calculateExpectedReturns();

  if (!isOpen) {
    console.log('❌ StrategyExecutionModal: isOpen is false');
    return null;
  }

  console.log('✅ StrategyExecutionModal: Rendering modal', { strategyId, strategyName, isOpen });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-slate-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Execute Strategy</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mt-1">{strategyName}</p>
          </div>

          <div className="p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {['Config', 'Confirm', 'Execute', 'Complete'].map((step, index) => {
                const stepNames = ['config', 'confirm', 'executing', 'success'];
                const isActive = stepNames.indexOf(currentStep) >= index;
                const isCurrent = stepNames.indexOf(currentStep) === index;
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive 
                        ? isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {stepNames.indexOf(currentStep) > index ? '✓' : index + 1}
                    </div>
                    {index < 3 && (
                      <div className={`w-16 h-1 mx-2 ${isActive ? 'bg-blue-600' : 'bg-gray-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Configuration Step */}
            {currentStep === 'config' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collateral Amount
                  </label>
                  <input
                    type="number"
                    value={params.collateralAmount}
                    onChange={(e) => setParams(prev => ({ ...prev, collateralAmount: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Leverage: {params.leverage}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={params.leverage}
                    onChange={(e) => setParams(prev => ({ ...prev, leverage: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1x (No Leverage)</span>
                    <span>5x (Maximum)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Market
                  </label>
                  <select
                    value={params.market}
                    onChange={(e) => setParams(prev => ({ ...prev, market: e.target.value as MarketKey }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                  >
                    {Object.entries(MARKET_CONFIGS).map(([key, config]) => (
                      <option key={key} value={key} className="bg-slate-800">
                        {config.collateralAsset} → {config.borrowAsset}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slippage Tolerance (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={params.slippage}
                      onChange={(e) => setParams(prev => ({ ...prev, slippage: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Deadline (minutes)
                    </label>
                    <input
                      type="number"
                      value={params.deadline}
                      onChange={(e) => setParams(prev => ({ ...prev, deadline: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Expected Returns */}
                <div className="bg-blue-600/10 border border-blue-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">Expected Returns</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {returns.leveragedAPY.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">APY</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${returns.monthlyReturn.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">Monthly</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">
                        ${returns.yearlyReturn.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">Yearly</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep('confirm')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all"
                >
                  Continue to Confirmation
                </button>
              </div>
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-yellow-600/10 border border-yellow-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">⚠️ Important Notice</h3>
                  <ul className="text-sm text-yellow-200 space-y-1">
                    <li>• This strategy involves leveraged positions with liquidation risks</li>
                    <li>• Smart contract interactions are irreversible</li>
                    <li>• Monitor your health factor to avoid liquidation</li>
                    <li>• Past performance does not guarantee future results</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Collateral</div>
                    <div className="text-xl font-bold text-white">{params.collateralAmount} {MARKET_CONFIGS[params.market].collateralAsset}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Leverage</div>
                    <div className="text-xl font-bold text-purple-400">{params.leverage}x</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('config')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    {loading ? 'Executing...' : 'Execute Strategy'}
                  </button>
                </div>
              </div>
            )}

            {/* Executing Step */}
            {currentStep === 'executing' && (
              <div className="text-center py-8">
                <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-white mb-2">Executing Strategy</h3>
                <p className="text-gray-400">
                  Please confirm the transaction in your wallet and wait for confirmation...
                </p>
                {error && (
                  <div className="bg-red-600/10 border border-red-400/20 rounded-lg p-4 mt-4">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Success Step */}
            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Strategy Deployed Successfully! 🎉</h3>
                <p className="text-gray-400 mb-6">Your yield strategy is now active and earning</p>
                
                {/* Deployment Summary */}
                <div className="bg-green-600/10 border border-green-400/20 rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-lg font-semibold text-green-300 mb-3">Deployment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Strategy:</span>
                      <span className="text-white">{strategyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collateral:</span>
                      <span className="text-white">${params.collateralAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Leverage:</span>
                      <span className="text-white">{params.leverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market:</span>
                      <span className="text-white">{params.market}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected APY:</span>
                      <span className="text-green-400">{returns.leveragedAPY.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                
                {txHash && (
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-400 mb-2">Transaction Hash</div>
                    <div className="text-sm font-mono text-blue-400 break-all mb-3">{txHash}</div>
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(txHash);
                        alert('Transaction hash copied to clipboard!');
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-all"
                    >
                      Copy Hash
                    </button>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      // Navigate to positions view
                      onClose();
                      // You could add router navigation here
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    View Position
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep('config');
                      setParams({
                        collateralAmount: '1000',
                        leverage: 2,
                        market: 'HYPE-USDe',
                        slippage: 0.5,
                        deadline: 20
                      });
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Deploy Another
                  </button>
                </div>
              </div>
            )}

            {/* Error Step */}
            {currentStep === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Strategy Execution Failed</h3>
                <p className="text-gray-400 mb-4">
                  {error || 'The transaction was rejected or failed to execute'}
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep('config')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
