'use client';

// ============================================================================
// PERFORMANCE: Wallet Providers (Lazy Loaded)
//
// Polkadot wallet infrastructure (~300KB) is only loaded when needed.
// This includes @polkadot/api, keyring, and wallet extensions.
// ============================================================================

import { ReactiveDotProvider, ChainProvider, SignerProvider, useAccounts } from '@reactive-dot/react';
import { config } from '@/lib/reactive-dot/config';

function WithSigner({ children }: { children: React.ReactNode }) {
  const accounts = useAccounts();
  const signer = accounts?.[0]?.polkadotSigner;
  return <SignerProvider signer={signer}>{children}</SignerProvider>;
}

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    // Type assertion due to duplicate @reactive-dot/core versions in node_modules
    <ReactiveDotProvider config={config as any}>
      <ChainProvider chainId={"pop" as any}>
        <WithSigner>
          {children}
        </WithSigner>
      </ChainProvider>
    </ReactiveDotProvider>
  );
}
