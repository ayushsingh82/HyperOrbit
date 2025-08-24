/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import Providers from "./providers";
import PrivyWalletButton from "./components/PrivyWalletButton";
import { NotificationProvider } from "./components/NotificationSystem";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HyperOrbit",
  description: "HyperOrbit - Community-driven token discussions and DeFi liquidation platform",
};

function TopBar() {
  return (
    <div className="w-full flex justify-between items-center px-8 py-4 z-10 relative">
      <a href="/" className="text-2xl font-bold text-white hover:text-[#27FEE0] transition-colors cursor-pointer">HyperOrbit</a>
      
      {/* Centered Navigation */}
      <div className="flex items-center gap-4">
        <a href="/dao" className="px-4 py-2 rounded-lg bg-[#0B1614]/80 border border-[#27FEE0]/40 text-white/90 hover:text-[#27FEE0] hover:border-[#27FEE0] hover:bg-[#0B1614] transition-all duration-300 font-medium text-sm">Explore DAO</a>
        <a href="/group" className="px-4 py-2 rounded-lg bg-[#0B1614]/80 border border-[#27FEE0]/40 text-white/90 hover:text-[#27FEE0] hover:border-[#27FEE0] hover:bg-[#0B1614] transition-all duration-300 font-medium text-sm">Group</a>
      </div>
      
      <PrivyWalletButton />
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full flex items-center justify-center py-6 z-10 relative">
      <span className="text-[#27FEE0] text-sm opacity-80">© {new Date().getFullYear()} HyperOrbit. All rights reserved.</span>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen flex flex-col`}
      >
        <Providers>
          <NotificationProvider>
            <TopBar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
