'use client'
import React, { useState } from "react";
import { FloatingDots } from "../components/landing";

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/identicon/svg?seed=eth",
  "https://api.dicebear.com/7.x/identicon/svg?seed=sol",
  "https://api.dicebear.com/7.x/identicon/svg?seed=btc",
  "https://api.dicebear.com/7.x/identicon/svg?seed=hype",
  "https://api.dicebear.com/7.x/identicon/svg?seed=dao",
  "https://api.dicebear.com/7.x/identicon/svg?seed=community"
];

export default function RegisterDaoPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0]);

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-16 px-4 relative overflow-hidden">
      <FloatingDots minDuration={3} maxDuration={7} />
      <h1 className="text-2xl sm:text-3xl font-medium mb-6 text-[#27FEE0] text-center tracking-wide">
        <span className="text-white">Register</span> DAO
      </h1>
      <form className="w-full max-w-lg bg-[#0B1614]/90 border border-[#27FEE0]/50 rounded-2xl p-8 flex flex-col gap-6 shadow-lg z-10">
        {/* Profile Image Selection */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <label className="text-[#27FEE0] font-semibold text-base mb-1">Choose Profile Image</label>
          <div className="grid grid-cols-3 gap-3 w-full">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <div
                key={index}
                className={`w-20 h-20 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                  selectedAvatar === avatar
                    ? 'border-[#27FEE0] ring-2 ring-[#27FEE0]/50 scale-110'
                    : 'border-[#27FEE0]/40 hover:border-[#27FEE0]/70 hover:scale-105'
                }`}
                onClick={() => setSelectedAvatar(avatar)}
              >
                <img
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* DAO Name */}
        <div className="flex flex-col gap-2">
          <label className="text-[#27FEE0] font-semibold text-sm" htmlFor="daoName">DAO Name</label>
          <input
            id="daoName"
            name="daoName"
            type="text"
            required
            placeholder="e.g. alpha.hl"
            className="rounded-lg px-4 py-2 bg-black/80 border border-[#27FEE0]/40 text-white focus:outline-none focus:border-[#27FEE0] transition"
          />
        </div>
        
        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[#27FEE0] font-semibold text-sm" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            placeholder="Describe your DAO..."
            rows={3}
            className="rounded-lg px-4 py-2 bg-black/80 border border-[#27FEE0]/40 text-white focus:outline-none focus:border-[#27FEE0] transition resize-none"
          />
        </div>
        
        <button
          type="submit"
          className="mt-4 px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg transition hover:bg-transparent hover:text-[#27FEE0]"
        >
          Register DAO
        </button>
      </form>
    </div>
  );
}
