import React from "react";
import HypercoreOrderbook from "../components/HypercoreOrderbook";
import HyperLendLiquidatorMVP from '../components/HyperLendLiquidatorMVP';

export default function HypercorePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
      <div className="w-full max-w-7xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#27FEE0] to-white bg-clip-text text-transparent">
            Hypercore Trading
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Experience lightning-fast perpetual trading with real-time orderbook data and automated liquidation flows
          </p>
        </div>
        
        {/* Trading Section */}
        <div className="mb-8">
          <HypercoreOrderbook />
        </div>
        
        {/* Liquidation Section */}
        <div className="mb-8">
          <HyperLendLiquidatorMVP />
        </div>
      </div>
    </div>
  );
}
