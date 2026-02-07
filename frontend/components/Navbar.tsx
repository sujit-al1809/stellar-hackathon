"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Publish Strategy" },
  { href: "/execute", label: "Buy & Trade" },
  { href: "/verify", label: "Verify Trades" },
  { href: "/dashboard", label: "My Earnings" },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey, isConnecting, connectWallet, disconnectWallet } =
    useWallet();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <nav className="border-b border-primary-900/30 bg-dark-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
              SF
            </div>
            <span className="text-xl font-bold text-white">
              Strat<span className="text-primary-400">Flow</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-primary-600/20 text-primary-300"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div>
            {publicKey ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-accent-600/10 border border-accent-600/20">
                  <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                  <span className="text-sm text-accent-400 font-mono">
                    {truncateAddress(publicKey)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-primary-900/20 px-4 py-2 flex space-x-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              pathname === item.href
                ? "bg-primary-600/20 text-primary-300"
                : "text-gray-400"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
