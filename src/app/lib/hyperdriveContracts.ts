// Hyperdrive Smart Contract Integration
// Based on: https://hyperdrive-2.gitbook.io/hyperdrive/for-developers/contract-addresses
// ABIs: https://github.com/ambitlabsxyz/hyperdrive-abis

export interface HyperdriveContractAddresses {
  // Core Contracts
  router: string;
  factory: string;
  oracle: string;
  liquidationEngine: string;
  
  // Markets (IMarket.json + IERC4626.json)
  markets: {
    usde: string;
    usdc: string;
    weth: string;
    wbtc: string;
  };
  
  // Vaults
  vaults: {
    hlpVault: string;
    hyeVault: string;
    stakeVault: string;
  };
}

// HyperEVM Mainnet Addresses
export const HYPERDRIVE_MAINNET_CONTRACTS: HyperdriveContractAddresses = {
  // Core protocol contracts
  router: "0x1234567890123456789012345678901234567890", // Replace with actual addresses
  factory: "0x2345678901234567890123456789012345678901",
  oracle: "0x3456789012345678901234567890123456789012",
  liquidationEngine: "0x4567890123456789012345678901234567890123",
  
  // Lending markets
  markets: {
    usde: "0x5678901234567890123456789012345678901234", // USDe Primary Market
    usdc: "0x6789012345678901234567890123456789012345", // USDC Market
    weth: "0x7890123456789012345678901234567890123456", // WETH Market
    wbtc: "0x8901234567890123456789012345678901234567", // WBTC Market
  },
  
  // Vault contracts
  vaults: {
    hlpVault: "0x9012345678901234567890123456789012345678", // HLP Vault
    hyeVault: "0x0123456789012345678901234567890123456789", // HYE Vault
    stakeVault: "0x1123456789012345678901234567890123456789", // Staking Vault
  }
};

// HyperEVM Testnet Addresses
export const HYPERDRIVE_TESTNET_CONTRACTS: HyperdriveContractAddresses = {
  router: "0xabc1234567890123456789012345678901234567",
  factory: "0xbcd2345678901234567890123456789012345678",
  oracle: "0xcde3456789012345678901234567890123456789",
  liquidationEngine: "0xdef4567890123456789012345678901234567890",
  
  markets: {
    usde: "0xefg5678901234567890123456789012345678901",
    usdc: "0xfgh6789012345678901234567890123456789012",
    weth: "0xghi7890123456789012345678901234567890123",
    wbtc: "0xhij8901234567890123456789012345678901234",
  },
  
  vaults: {
    hlpVault: "0xijk9012345678901234567890123456789012345",
    hyeVault: "0xjkl0123456789012345678901234567890123456",
    stakeVault: "0xklm1123456789012345678901234567890123456",
  }
};

// Simplified ABIs for core functions
export const HYPERDRIVE_MARKET_ABI = [
  // ERC4626 Vault functions
  {
    "inputs": [{"name": "assets", "type": "uint256"}],
    "name": "deposit",
    "outputs": [{"name": "shares", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "shares", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [{"name": "assets", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "assets", "type": "uint256"}],
    "name": "borrow",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "repay",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserPosition",
    "outputs": [
      {"name": "collateral", "type": "uint256"},
      {"name": "debt", "type": "uint256"},
      {"name": "healthFactor", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketInfo",
    "outputs": [
      {"name": "totalSupply", "type": "uint256"},
      {"name": "totalBorrow", "type": "uint256"},
      {"name": "borrowRate", "type": "uint256"},
      {"name": "supplyRate", "type": "uint256"},
      {"name": "utilization", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const HYPERDRIVE_ROUTER_ABI = [
  {
    "inputs": [
      {"name": "market", "type": "address"},
      {"name": "collateralAmount", "type": "uint256"},
      {"name": "borrowAmount", "type": "uint256"}
    ],
    "name": "supplyAndBorrow",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "markets", "type": "address[]"},
      {"name": "amounts", "type": "uint256[]"},
      {"name": "strategies", "type": "bytes[]"}
    ],
    "name": "executeMultiMarketStrategy",
    "outputs": [{"name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "market", "type": "address"},
      {"name": "leverage", "type": "uint256"}
    ],
    "name": "createLeveragedPosition",
    "outputs": [{"name": "positionId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Strategy-specific contract functions
export const YIELD_STRATEGY_FUNCTIONS = {
  // Leveraged Liquid Staking
  leveragedLiquidStaking: {
    deposit: "supplyCollateralAndBorrow",
    withdraw: "repayAndWithdraw",
    compound: "compoundRewards",
    rebalance: "rebalanceLeverage"
  },
  
  // Recursive Yield Farming
  recursiveYieldFarming: {
    deposit: "recursiveDeposit",
    withdraw: "recursiveWithdraw",
    compound: "compoundFarmRewards",
    autoLoop: "autoLoopDeposit"
  },
  
  // Delta Neutral Farming
  deltaNeutralFarming: {
    deposit: "createDeltaNeutralPosition",
    withdraw: "closeDeltaNeutralPosition",
    hedge: "adjustHedgeRatio",
    rebalance: "rebalanceDeltaNeutral"
  },
  
  // Cross-Chain Rate Arbitrage
  crossChainArbitrage: {
    deposit: "initiateCrossChainPosition",
    withdraw: "closeCrossChainPosition",
    bridge: "bridgeAndDeploy",
    monitor: "monitorRateDifferential"
  }
};

// Utility functions
export function getContractAddresses(isTestnet: boolean = false): HyperdriveContractAddresses {
  return isTestnet ? HYPERDRIVE_TESTNET_CONTRACTS : HYPERDRIVE_MAINNET_CONTRACTS;
}

export function getMarketAddress(asset: 'usde' | 'usdc' | 'weth' | 'wbtc', isTestnet: boolean = false): string {
  const contracts = getContractAddresses(isTestnet);
  return contracts.markets[asset];
}

export function getVaultAddress(vault: keyof HyperdriveContractAddresses['vaults'], isTestnet: boolean = false): string {
  const contracts = getContractAddresses(isTestnet);
  return contracts.vaults[vault];
}

// Market configuration for different assets
export const MARKET_CONFIGS = {
  'HYPE-USDe': {
    address: HYPERDRIVE_MAINNET_CONTRACTS.markets.usde,
    collateralAsset: 'HYPE',
    borrowAsset: 'USDe',
    maxLTV: 0.75,
    liquidationThreshold: 0.8,
    minimumCollateral: 100
  },
  'ETH-USDC': {
    address: HYPERDRIVE_MAINNET_CONTRACTS.markets.usdc,
    collateralAsset: 'ETH',
    borrowAsset: 'USDC',
    maxLTV: 0.8,
    liquidationThreshold: 0.85,
    minimumCollateral: 0.1
  },
  'BTC-USDC': {
    address: HYPERDRIVE_MAINNET_CONTRACTS.markets.wbtc,
    collateralAsset: 'BTC',
    borrowAsset: 'USDC',
    maxLTV: 0.7,
    liquidationThreshold: 0.75,
    minimumCollateral: 0.01
  }
} as const;

export type MarketKey = keyof typeof MARKET_CONFIGS;
