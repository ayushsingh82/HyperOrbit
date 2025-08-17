'use client';

import React from "react";
import { motion } from "framer-motion";

export function FloatingDots({ count = 70, minSize = 4, maxSize = 8, opacity = 0.7 }) {
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
        const duration = getRandom(8, 18);
        const delay = getRandom(0, 10);
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
      <div className="flex flex-col items-center justify-center flex-1 z-10 relative w-full">
        <h1 className="text-4xl sm:text-6xl font-medium mb-8 text-[#27FEE0] text-center tracking-tight">
          Create DAOs with a <span className="text-white">.hl</span> domain
        </h1>
        {/* Middle Card */}
        <div className="max-w-2xl w-full border border-[#27FEE0]/60 rounded-3xl bg-[#0B1614]/70 p-12 flex flex-col items-center shadow-xl backdrop-blur-md">
          <p className="text-md sm:text-xl text-white/90 mb-10 text-center leading-relaxed">
            Launch your DAO in minutes and secure your unique{" "}
            <span className="text-[#27FEE0] font-semibold">.hl</span> domain. Empower your community, manage governance, and own your on-chain identity — all in one seamless flow.
          </p>
          {/* Buttons */}
          <div className="flex flex-wrap gap-6 w-full justify-center">
            <button className="px-8 py-3 rounded-xl border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg shadow-md transition hover:scale-105 hover:bg-transparent hover:text-[#27FEE0]">
              <a href="/register">🚀 Create DAO</a>
            </button>
            <button className="px-8 py-3 rounded-xl border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-lg shadow-md transition hover:scale-105 hover:bg-[#27FEE0] hover:text-[#0B1614]">
              <a href="/dao">🔎 Explore DAOs</a>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
