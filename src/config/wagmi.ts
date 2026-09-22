import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "6cb1b68a9c27a42e4bea9a17271f2680";
export const networks = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as any,
  defaultNetwork: bsc,
  metadata: {
    name: "Infinity Six",
    description: "Infinity Six Protocol",
    url: "https://infinitysix.io",
    icons: ["https://infinitysix.io/i6-logo.webp"],
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0072ED",
    "--w3m-border-radius-master": "3px",
    "--w3m-font-family": "'Plus Jakarta Sans', sans-serif",
  },
  features: {
    analytics: true,
  },
});
