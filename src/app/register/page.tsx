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
  const [daoName, setDaoName] = useState<string>("");

  const getPreviewUrl = (name: string) => {
    if (!name.trim()) return "";
    // Remove .hl extension if user types it, otherwise add it
    const cleanName = name.replace(/\.hl$/, "");
    return `https://app.hlnames.xyz/name/${cleanName}.hl`;
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center w-full min-h-screen bg-black py-16 px-4 relative overflow-hidden gap-8">
      <FloatingDots minDuration={3} maxDuration={7} />
      
      {/* Left Side - Form */}
      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <div className="bg-[#0B1614]/90 border border-[#27FEE0]/50 rounded-2xl p-6 flex flex-col gap-4 shadow-lg z-10">
          <h1 className="text-2xl sm:text-3xl font-medium mb-4 text-[#27FEE0] text-center lg:text-left tracking-wide">
            <span className="text-white">Register</span> DAO
          </h1>
          
          {/* Profile Image Selection */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <label className="text-[#27FEE0] font-semibold text-base mb-1">Choose Profile Image</label>
            <div className="grid grid-cols-3 gap-3 w-full">
              {AVATAR_OPTIONS.map((avatar, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 rounded-full border-2 cursor-pointer transition-all duration-200 ${
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
              value={daoName}
              onChange={(e) => setDaoName(e.target.value)}
              placeholder="e.g. dev3"
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
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="w-full lg:w-[500px] lg:flex-shrink-0">
        <div className="bg-[#0B1614]/90 border border-[#27FEE0]/50 rounded-2xl p-8 flex flex-col gap-6 shadow-lg z-10 h-full">
          <h2 className="text-2xl sm:text-3xl font-medium mb-6 text-[#27FEE0] text-center lg:text-left tracking-wide">
            HL Names <span className="text-white">Preview</span>
          </h2>
          
          {daoName.trim() ? (
            <div className="flex flex-col gap-4 flex-1">
              <div className="text-center">
                <p className="text-white text-sm mb-2">Preview for:</p>
                <p className="text-[#27FEE0] font-mono text-xl font-bold">{daoName.replace(/\.hl$/, "")}.hl</p>
              </div>
              <div className="flex-1 border border-[#27FEE0]/30 rounded-lg overflow-hidden bg-gray-900 min-h-[100px]">
                <iframe
                  src={getPreviewUrl(daoName)}
                  className="w-full h-full bg-transparent"
                  title="HL Names Preview"
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                />
              </div>
              <div className="text-center mt-auto">
                <a
                  href={getPreviewUrl(daoName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 rounded-lg border border-[#27FEE0] text-[#27FEE0] hover:bg-[#27FEE0] hover:text-[#0B1614] transition-colors font-medium"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-[#27FEE0]/60">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 border-2 border-[#27FEE0]/30 rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#27FEE0]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-center text-lg">
                  Type a DAO name above<br />
                  to see the preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
