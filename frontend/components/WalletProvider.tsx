"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

interface WalletContextType {
  publicKey: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTx: (
    xdr: string,
    opts: { networkPassphrase: string }
  ) => Promise<{ signedTxXdr: string }>;
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  signTx: async () => ({ signedTxXdr: "" }),
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connectionResult = await isConnected();
        if (connectionResult.isConnected) {
          const addrResult = await getAddress();
          if (addrResult.address && !addrResult.error) {
            setPublicKey(addrResult.address);
          }
        }
      } catch (error) {
        console.error("Error checking Freighter connection:", error);
      }
    };
    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(String(accessResult.error));
      }
      // Freighter v6 returns { publicKey }, fallback to getAddress()
      const key = (accessResult as any).publicKey || (accessResult as any).address;
      if (key) {
        setPublicKey(key);
      } else {
        // Fallback: fetch address separately
        const addrResult = await getAddress();
        if (addrResult.address && !addrResult.error) {
          setPublicKey(addrResult.address);
        }
      }
    } catch (error) {
      console.error("Error connecting to Freighter:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setPublicKey(null);
  }, []);

  const signTx = useCallback(
    async (
      xdr: string,
      opts: { networkPassphrase: string }
    ): Promise<{ signedTxXdr: string }> => {
      console.log("[StratFlow] signTx called, publicKey:", publicKey);
      const result = await signTransaction(xdr, {
        networkPassphrase: opts.networkPassphrase,
        address: publicKey || undefined,
      });
      if (result.error) {
        console.error("[StratFlow] Freighter signTransaction error:", result.error);
        throw new Error(String(result.error));
      }
      return { signedTxXdr: result.signedTxXdr };
    },
    [publicKey]
  );

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnecting,
        connectWallet,
        disconnectWallet,
        signTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
