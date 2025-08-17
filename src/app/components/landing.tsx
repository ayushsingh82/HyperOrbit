import React from "react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1614] p-6">
      <div className="max-w-xl w-full border-2 border-[#27FEE0] rounded-2xl bg-[#0B1614] p-10 flex flex-col items-center shadow-lg">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-[#27FEE0] text-center">
          Create DAOs with a <span className="text-white">.hl</span> domain
        </h1>
        <p className="text-lg sm:text-xl text-white mb-8 text-center">
          We are building a platform where you can easily launch your own DAO and get a unique <span className="text-[#27FEE0] font-semibold">.hl</span> domain. Empower your community, manage governance, and own your identity on the blockchain.
        </p>
        <button className="mt-4 px-8 py-3 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-lg transition hover:bg-transparent hover:text-[#27FEE0]">
          Get Early Access
        </button>
      </div>
    </div>
  );
}
