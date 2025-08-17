'use client';

import React from "react";
import { motion } from "framer-motion";

const DOTS = Array.from({ length: 18 });

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function FloatingDots() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {DOTS.map((_, i) => {
        const size = getRandom(10, 18);
        const left = getRandom(0, 100);
        const top = getRandom(0, 100);
        const duration = getRandom(6, 14);
        const delay = getRandom(0, 6);
        return (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0.7 }}
            animate={{ y: [0, -30, 0], opacity: [0.7, 1, 0.7] }}
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
              border: "2px dotted #27FEE0",
              background: "#27FEE0",
              opacity: 0.5,
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
    <div className="min-h-screen flex flex-col justify-between bg-black p-0 relative overflow-hidden">
      <FloatingDots />
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center px-8 py-6 z-10 relative">
        <span className="text-2xl font-bold text-[#27FEE0] tracking-tight select-none">Privy.hl</span>
        <button className="px-6 py-2 rounded-lg border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-base transition hover:bg-[#27FEE0] hover:text-[#0B1614]">
          + Create DAO
        </button>
      </div>
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 relative">
        <h1 className="text-4xl sm:text-5xl font-bold mb-10 text-[#27FEE0] text-center">
          Create DAOs with a <span className="text-white">.hl</span> domain
        </h1>
        <div className="max-w-xl w-full border-2 border-[#27FEE0] rounded-2xl bg-[#0B1614] p-10 flex flex-col items-center shadow-lg">
          <p className="text-lg sm:text-xl text-white mb-8 text-center">
            We are building a platform where you can easily launch your own DAO and get a unique <span className="text-[#27FEE0] font-semibold">.hl</span> domain. Empower your community, manage governance, and own your identity on the blockchain.
          </p>
          <div className="flex gap-6 w-full justify-center">
            <button className="px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg transition hover:bg-transparent hover:text-[#27FEE0] w-40">
              Login
            </button>
            <button className="px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-lg transition hover:bg-[#27FEE0] hover:text-[#0B1614] w-40">
              Explore DAOs
            </button>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full flex items-center justify-center py-6 z-10 relative">
        <span className="text-[#27FEE0] text-sm opacity-80">© {new Date().getFullYear()} Privy.hl. All rights reserved.</span>
      </footer>
    </div>
  );
}
