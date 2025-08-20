'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function PrivyWalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="px-6 py-2 rounded-lg border-2 border-[#27FEE0]/40 text-[#27FEE0]/40 font-bold text-base">
        Loading...
      </div>
    );
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[#27FEE0] text-xs font-medium">
            {user.wallet?.address ? 
              `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 
              'Connected'
            }
          </div>
          <div className="text-white/60 text-xs">
            {user.email?.address || 'Wallet User'}
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg border border-[#27FEE0] text-[#27FEE0] font-semibold text-sm transition hover:bg-[#27FEE0] hover:text-[#0B1614]"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-6 py-2 rounded-lg border-2 border-[#27FEE0] bg-transparent text-[#27FEE0] font-bold text-base transition hover:bg-[#27FEE0] hover:text-[#0B1614]"
    >
      Connect Wallet
    </button>
  );
}
