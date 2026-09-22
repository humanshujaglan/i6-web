"use client";

import React, { type ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { WagmiProvider, State, useAccount, useConfig } from "wagmi";
import { watchAccount, reconnect } from "@wagmi/core";
import { config } from "@/config/wagmi";

function AccountSync() {
  const wagmiConfig = useConfig();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  // 1. Listen to wagmi core account changes
  useEffect(() => {
    const unwatch = watchAccount(wagmiConfig, {
      onChange(account, prevAccount) {
        if (
          account.address &&
          prevAccount?.address &&
          account.address.toLowerCase() !== prevAccount.address.toLowerCase()
        ) {
          const newAddr = account.address.toLowerCase();
          localStorage.setItem("user_wallet", newAddr);
          document.cookie = `user_wallet=${newAddr}; path=/; max-age=2592000; SameSite=Strict`;
          queryClient.invalidateQueries();
        }
      },
    });
    return () => unwatch();
  }, [wagmiConfig, queryClient]);

  // 2. Direct EIP-1193 accountsChanged event listener for injected wallets (MetaMask, OKX, Rabby, Trust, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ethereum = (window as any).ethereum;
    if (!ethereum || !ethereum.on) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const newAddress = accounts[0].toLowerCase();
        localStorage.setItem("user_wallet", newAddress);
        document.cookie = `user_wallet=${newAddress}; path=/; max-age=2592000; SameSite=Strict`;
        queryClient.invalidateQueries();
        try {
          await reconnect(wagmiConfig);
        } catch (err) {
          console.error("Wagmi reconnect on accountsChanged error:", err);
        }
      } else {
        localStorage.removeItem("user_wallet");
        document.cookie = "user_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        queryClient.invalidateQueries();
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [wagmiConfig, queryClient]);

  return null;
}

export default function Web3Provider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <AccountSync />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
