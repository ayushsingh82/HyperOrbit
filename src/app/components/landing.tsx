'use client';

import React from "react";
import { motion } from "framer-motion";

export function FloatingDots({ count = 70, minSize = 4, maxSize = 8, opacity = 0.7, minDuration = 3, maxDuration = 7 }) {
  const DOTS = Array.from({ length: count });
  function getRandom(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {DOTS.map((_, i) => {
        const size = getRandom(minSize, maxSize);
        const left = getRandom(0, 100);
        const top = getRandom(0, 100);
        const duration = getRandom(minDuration, maxDuration);
        const delay = getRandom(0, 4);
        const floatY = getRandom(30, 80);
        return (
          <motion.div
            key={i}
            initial={{ y: 0, opacity }}
            animate={{ y: [0, -floatY, 0], opacity: [opacity, 1, opacity] }}
            transition={{
              repeat: Infinity,
              duration,
              delay,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#27FEE0",
              opacity,
              zIndex: 0,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-0 relative overflow-hidden">
      <FloatingDots />
      
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 relative w-full px-4">
        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 text-[#27FEE0] tracking-tight leading-tight">
            Build Token
            <br />
            <span className="text-white">Communities</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Create DAOs with <span className="text-[#27FEE0] font-semibold">.hl</span> domains where communities discuss tokens, track prices, and trade using Hypercore
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-5xl"
        >
          <div className="bg-gradient-to-br from-[#27FEE0]/10 to-transparent border border-[#27FEE0]/30 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-[#27FEE0] font-bold text-lg mb-2">Community Chat</h3>
            <p className="text-white/70 text-sm">Discuss token strategies, market analysis, and community decisions</p>
          </div>
          <div className="bg-gradient-to-br from-[#27FEE0]/10 to-transparent border border-[#27FEE0]/30 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-[#27FEE0] font-bold text-lg mb-2">Price Tracking</h3>
            <p className="text-white/70 text-sm">Real-time token price monitoring and market insights</p>
          </div>
          <div className="bg-gradient-to-br from-[#27FEE0]/10 to-transparent border border-[#27FEE0]/30 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-[#27FEE0] font-bold text-lg mb-2">Hypercore Trading</h3>
            <p className="text-white/70 text-sm">Place orders and trade tokens with lightning-fast execution</p>
          </div>
        </motion.div>

        {/* Main CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl w-full border border-[#27FEE0]/40 rounded-3xl bg-gradient-to-br from-[#0B1614]/90 to-[#0B1614]/70 p-12 flex flex-col items-center shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
            Ready to Launch Your Token Community?
          </h2>
          <p className="text-lg text-white/80 mb-10 text-center leading-relaxed max-w-2xl">
            Join the future of decentralized trading communities. Create your DAO, secure your <span className="text-[#27FEE0] font-semibold">.hl</span> domain, and start building with Hypercore-powered trading.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-6 w-full justify-center">
            <a href="/register" className="group relative px-10 py-4 rounded-xl border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:bg-transparent hover:text-[#27FEE0] hover:shadow-[#27FEE0]/40">
              🚀 Launch DAO
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#27FEE0] to-[#27FEE0]/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </a>
            <a href="/dao" className="px-10 py-4 rounded-xl border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#27FEE0] hover:text-[#0B1614] hover:shadow-[#27FEE0]/40">
              🔍 Explore Communities
            </a>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-12 mt-16 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-[#27FEE0]">100+</div>
            <div className="text-white/70 text-sm">Active Communities</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#27FEE0]">$50M+</div>
            <div className="text-white/70 text-sm">Trading Volume</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#27FEE0]">10K+</div>
            <div className="text-white/70 text-sm">Community Members</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
