'use client';

import React from "react";
import { motion } from "framer-motion";

const DOTS = Array.from({ length: 40 });

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function FloatingDots() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {DOTS.map((_, i) => {
        const size = getRandom(8, 14);
        const left = getRandom(0, 100);
        const top = getRandom(0, 100);
        const duration = getRandom(8, 18);
        const delay = getRandom(0, 10);
        const floatY = getRandom(40, 120);
        return (
          <motion.div
            key={i}
            initial={{ y: 0, opacity: 0.4 }}
            animate={{ y: [0, -floatY, 0], opacity: [0.4, 0.7, 0.4] }}
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
              border: "1px dotted #27FEE0",
              background: "transparent",
              opacity: 0.4,
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
      <div className="flex flex-col items-center justify-center flex-1 z-10 relative w-full">
        <h1 className="text-4xl sm:text-5xl font-semibold mb-10 text-[#27FEE0] text-center">
          Create DAOs with a <span className="text-white">.hl</span> domain
        </h1>
        <div className="max-w-xl w-full border-2 border-[#27FEE0] rounded-2xl bg-[#0B1614] p-10 flex flex-col items-center shadow-lg">
          <p className="text-lg sm:text-xl text-white mb-8 text-center">
            We are building a platform where you can easily launch your own DAO and get a unique <span className="text-[#27FEE0] font-semibold">.hl</span> domain. Empower your community, manage governance, and own your identity on the blockchain.
          </p>
          <div className="flex gap-6 w-full justify-center">
            <button className="px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg transition hover:bg-transparent hover:text-[#27FEE0] w-40">
              Create DAO
            </button>
            <button className="px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-lg transition hover:bg-[#27FEE0] hover:text-[#0B1614] w-40">
              Explore DAOs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
