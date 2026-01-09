import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from '@reown/appkit/networks';

const queryClient = new QueryClient();
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID';
const appOrigin = globalThis.location?.origin ?? 'https://questlayer.com';

const metadata = {
  name: 'QuestLayer Builder Pro',
  description:
    'A high-end quest and reward widget builder with theme customization, task management, and a real-time interactive preview.',
  url: appOrigin,
  icons: [`${appOrigin}/logoLayer.webp`]
};

const networks = [mainnet, arbitrum, optimism, base, polygon, avalanche, bsc] as [any, ...any[]];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
