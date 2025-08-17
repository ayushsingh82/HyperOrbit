'use client'
import React, { useRef, useState } from "react";
import { FloatingDots } from "../components/landing";

export default function RegisterDaoPage() {
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-16 px-4 relative overflow-hidden">
      <FloatingDots minDuration={3} maxDuration={7} />
      <h1 className="text-2xl sm:text-3xl font-medium mb-6 text-[#27FEE0] text-center tracking-wide">
        <span className="text-white">Register</span> DAO
      </h1>
      <form className="w-full max-w-lg bg-[#0B1614]/90 border border-[#27FEE0]/50 rounded-2xl p-8 flex flex-col gap-6 shadow-lg z-10">
        {/* Profile Image Section - now at the top and visually enhanced */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <label className="text-[#27FEE0] font-semibold text-base mb-1">Profile Image</label>
          <div className="relative flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border-2 border-[#27FEE0] bg-black flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-[#27FEE0]/30 mb-2">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#27FEE0]/60 text-xs">No Image</span>
              )}
            </div>
            <button
              type="button"
              className="mt-1 px-5 py-2 rounded-lg border border-[#27FEE0] text-[#27FEE0] font-semibold text-sm transition hover:bg-[#27FEE0] hover:text-[#0B1614] shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileChange}
            />
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
