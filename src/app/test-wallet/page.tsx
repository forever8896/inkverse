"use client"

import { ReactiveDotProvider, useWallets, useWalletConnector } from '@reactive-dot/react'
import { config } from '@/lib/reactive-dot/config'

function SimpleWalletTest() {
  const wallets = useWallets()
  const connectWallet = useWalletConnector()[1]
  
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h2 className="text-white text-xl mb-4">Wallet Detection Test</h2>
      
      <div className="mb-4">
        <p className="text-slate-300">Available Wallets: {wallets.length}</p>
        {wallets.map((wallet, i) => (
          <div key={i} className="text-slate-400 text-sm">
            - {wallet.name} ({wallet.accounts?.length || 0} accounts)
          </div>
        ))}
      </div>
      
      <button 
        onClick={async () => {
          console.log('Wallets:', wallets)
          if (wallets[0]) {
            try {
              await connectWallet(wallets[0])
              console.log('Connected successfully!')
            } catch (error) {
              console.error('Connection failed:', error)
            }
          }
        }}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
      >
        Test Connect First Wallet
      </button>
    </div>
  )
}

export default function TestWalletPage() {
  return (
    <ReactiveDotProvider config={config}>
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Wallet Detection Test</h1>
          <SimpleWalletTest />
        </div>
      </div>
    </ReactiveDotProvider>
  )
}