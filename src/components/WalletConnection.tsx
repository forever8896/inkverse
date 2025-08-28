'use client';

import { ChainProvider, SignerProvider } from '@reactive-dot/react';
import { useState } from 'react';
import { AccountSelect } from '@/components/web3/account-select';
import { ChainSelect } from '@/components/web3/chain-select';
import type { WalletAccount, ChainId } from '@/lib/reactive-dot/custom-types';

export function WalletConnection() {
  const [account, setAccount] = useState<WalletAccount>();
  const [chainId, setChainId] = useState<ChainId>('shibuya'); // Changed default to shibuya

  return (
    <SignerProvider signer={account?.polkadotSigner}>
      <ChainProvider chainId={chainId}>
        <div className="flex items-center space-x-3">
          <div className="min-w-[150px]">
            <AccountSelect account={account} setAccount={setAccount} />
          </div>
          <div className="min-w-[120px]">
            <ChainSelect chainId={chainId} setChainId={setChainId} />
          </div>
        </div>
      </ChainProvider>
    </SignerProvider>
  );
}
