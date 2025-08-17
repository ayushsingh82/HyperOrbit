import React from "react";

const DAOS = [
  { name: "alpha.hl" },
  { name: "beta.hl" },
  { name: "gamma.hl" },
  { name: "delta.hl" },
  { name: "omega.hl" },
  { name: "zeta.hl" },
  { name: "dao123.hl" },
  { name: "builder.hl" },
];

export default function ExploreDaosPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-12">
      <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-[#27FEE0] text-center">Explore DAOs</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
        {DAOS.map((dao) => (
          <div
            key={dao.name}
            className="border-4 border-[#27FEE0] rounded-2xl bg-[#0B1614] p-8 flex flex-col items-center shadow-lg transition hover:scale-105 hover:border-white cursor-pointer"
          >
            <span className="text-2xl font-bold text-[#27FEE0] mb-2">{dao.name}</span>
            <span className="text-white opacity-70 text-sm">A sample DAO on Privy.hl</span>
          </div>
        ))}
      </div>
    </div>
  );
}