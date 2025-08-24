'use client'
import React, { useState } from "react";

const DAOS = [
  {
    name: "ETH.hl",
    description: "Ethereum community discussing DeFi, smart contracts, and ETH ecosystem developments.",
    members: 1247,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=eth",
  },
  {
    name: "SOL.hl",
    description: "Solana community focused on high-speed transactions and DeFi innovations.",
    members: 892,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=sol",
  },
  {
    name: "HYPE.hl",
    description: "Hypercore community exploring next-gen trading and order execution systems.",
    members: 456,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=hyoe",
  },
  {
    name: "BTC.hl",
    description: "Bitcoin community discussing market trends, adoption, and BTC ecosystem.",
    members: 2034,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=btc",
  },
];

function JoinModal({ open, dao, onConfirm, onCancel }: {
  open: boolean;
  dao: typeof DAOS[0] | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [inputName, setInputName] = useState("");

  if (!open || !dao) return null;

  const fullName = inputName.trim() ? `${inputName}.${dao.name}` : `yourname.${dao.name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0B1614] border border-[#27FEE0] rounded-2xl p-8 max-w-sm w-full flex flex-col items-center shadow-2xl">
        <img src={dao.image} alt={dao.name} className="w-16 h-16 rounded-full border border-[#27FEE0] mb-4" />
        <h2 className="text-xl font-bold text-[#27FEE0] mb-2 text-center">Join {dao.name}?</h2>
        
        {/* Name Input */}
        <div className="w-full mb-4">
          <label className="block text-[#27FEE0] font-semibold text-sm mb-2 text-center">Choose your name</label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg px-4 py-2 bg-black/80 border border-[#27FEE0]/40 text-white focus:outline-none focus:border-[#27FEE0] transition text-center"
          />
        </div>
        
        <p className="text-white/80 text-center mb-6 text-sm">
          You will join as: <span className="font-semibold text-[#27FEE0]">{fullName}</span>
        </p>
        
        <div className="flex gap-4 w-full justify-center">
          <button
            className="px-5 py-2 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-base transition hover:bg-transparent hover:text-[#27FEE0] w-28"
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className="px-5 py-2 rounded-lg border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-base transition hover:bg-transparent hover:text-[#27FEE0] w-28"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExploreDaosPage() {
  const [modalDao, setModalDao] = useState<typeof DAOS[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleJoin(dao: typeof DAOS[0]) {
    setModalDao(dao);
    setModalOpen(true);
  }
  function handleConfirm() {
    setModalOpen(false);
    // Add join logic here
  }
  function handleCancel() {
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-16 px-6 relative">
      <JoinModal open={modalOpen} dao={modalDao} onConfirm={handleConfirm} onCancel={handleCancel} />
      
      {/* Register DAO Button - Top Right */}
      <div className="absolute top-8 right-8 z-10">
        <a 
          href="/register" 
          className="px-6 py-3 rounded-xl border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:bg-transparent hover:text-[#27FEE0] hover:shadow-[#27FEE0]/40"
        >
          🚀 Register DAO
        </a>
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-semibold mb-6 text-[#27FEE0] text-center tracking-wide">
        <span className="text-white">Explore</span> DAOs
      </h1>
      <p className="text-[#27FEE0]/80 text-center mb-12 max-w-2xl">
        Discover, join, and build with DAOs shaping the future of decentralized communities.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">
        {DAOS.map((dao) => (
          <div
            key={dao.name}
            className="flex flex-col items-center border border-[#27FEE0]/50 rounded-2xl bg-[#0B1614]/80 p-6 shadow-lg backdrop-blur-sm hover:shadow-[#27FEE0]/40 hover:scale-[1.04] hover:border-white transition duration-300 ease-in-out group"
          >
            <img
              src={dao.image}
              alt={dao.name}
              className="w-20 h-20 rounded-full mb-4 border border-[#27FEE0] bg-black object-cover group-hover:border-white transition"
              loading="lazy"
            />
            <span className="text-xl font-bold text-[#27FEE0] mb-2 text-center tracking-wide">
              {dao.name}
            </span>
            <span className="text-white/80 text-sm mb-4 text-center min-h-[50px] leading-relaxed">
              {dao.description}
            </span>
            <div className="flex items-center justify-between w-full mt-auto">
              <span className="text-[#27FEE0] text-xs font-mono">{dao.members} members</span>
              <button
                className="px-5 py-1.5 rounded-lg border border-[#27FEE0] text-[#27FEE0] font-semibold text-sm transition hover:bg-[#27FEE0] hover:text-[#0B1614] ml-auto"
                onClick={() => handleJoin(dao)}
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
