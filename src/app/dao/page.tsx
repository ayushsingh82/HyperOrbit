import React from "react";

const DAOS = [
  {
    name: "alpha.hl",
    description: "Alpha DAO is pioneering decentralized governance for creators.",
    members: 128,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=alpha",
  },
  {
    name: "beta.hl",
    description: "Beta DAO empowers communities to build together.",
    members: 87,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=beta",
  },
  {
    name: "gamma.hl",
    description: "Gamma DAO is focused on open-source innovation.",
    members: 203,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=gamma",
  },
  {
    name: "delta.hl",
    description: "Delta DAO supports social impact projects worldwide.",
    members: 54,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=delta",
  },
  {
    name: "omega.hl",
    description: "Omega DAO is a hub for blockchain enthusiasts.",
    members: 312,
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=omega",
  },
  
 
];

export default function ExploreDaosPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-16 px-6">
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
            className="flex flex-col items-center border border-[#27FEE0]/50 rounded-2xl bg-[#0B1614]/80 p-6 shadow-lg backdrop-blur-sm 
                       hover:shadow-[#27FEE0]/40 hover:scale-[1.04] hover:border-white transition duration-300 ease-in-out group"
          >
            <img
              src={dao.image}
              alt={dao.name}
              className="w-20 h-20 rounded-full mb-4 border border-[#27FEE0] bg-black object-cover 
                         group-hover:border-white transition"
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
              <button className="px-5 py-1.5 rounded-lg border border-[#27FEE0] text-[#27FEE0] font-semibold text-sm transition 
                                 hover:bg-[#27FEE0] hover:text-[#0B1614] hover:border-white ml-auto">
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
