"use client"

import { ReactiveDotProvider, ChainProvider, useAccounts, useConnectedWallets } from '@reactive-dot/react'
import { config } from '@/lib/reactive-dot/config'
import { MintCreatureNFT } from '@/components/MintCreatureNFT'
import { WalletConnection } from '@/components/WalletConnection'

function DebugInfo() {
  const accounts = useAccounts()
  const connectedWallets = useConnectedWallets()
  
  return (
    <div className="bg-slate-700 p-4 rounded-lg mb-4 text-sm">
      <h3 className="text-white font-semibold mb-2">Debug Info:</h3>
      <p className="text-slate-300">Connected Wallets: {connectedWallets.length}</p>
      <p className="text-slate-300">Accounts: {accounts?.length || 0}</p>
      <p className="text-slate-300">
        Account Names: {accounts?.map(acc => acc.name).join(', ') || 'None'}
      </p>
    </div>
  )
}

export default function TestNFTPage() {
  return (
    <ReactiveDotProvider config={config}>
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              NFT Minting Test Page
            </h1>
            
            <WalletConnection />
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6">
            <ChainProvider chainId="pop">
              <MintCreatureNFT 
                lessonId={1} 
                onMintSuccess={(txHash) => {
                  console.log("NFT Minted Successfully:", txHash)
                  alert(`NFT Minted! TX: ${txHash}`)
                }}
              />
            </ChainProvider>
            </div>
        
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Contract Address: 5GALB9ZyMoEHis6WbVL5hQDzzoP6MpCM6qh27UMgzVDt2G6H
            </p>
            <p className="text-slate-400 text-sm">
              Network: Pop Network Testnet
            </p>
          </div>
        </div>
      </div>
    </ReactiveDotProvider>
  )
}