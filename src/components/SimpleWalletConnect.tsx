"use client"

import { useState, useEffect } from "react"
import { useWallets, useWalletConnector, useWalletDisconnector, useAccounts, useConnectedWallets } from "@reactive-dot/react"
import { Button } from "./ui/button-extended"
import { toast } from "sonner"

export function SimpleWalletConnect() {
  const wallets = useWallets()
  const accounts = useAccounts()
  const connectedWallets = useConnectedWallets()
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Use array destructuring to get the connect function
  const connectWallet = useWalletConnector()[1]
  const disconnectWallet = useWalletDisconnector()[1]
  
  const handleConnect = async () => {
    if (wallets.length === 0) {
      toast.error("No wallets detected. Please install Talisman or Polkadot.js extension.")
      return
    }
    
    setIsConnecting(true)
    try {
      // Try to connect to the first available wallet
      await connectWallet(wallets[0])
      toast.success("Wallet connected successfully!")
    } catch (error) {
      console.error("Connection failed:", error)
      toast.error("Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }
  
  const handleDisconnect = async () => {
    try {
      if (connectedWallets[0]) {
        await disconnectWallet(connectedWallets[0])
        toast.success("Wallet disconnected")
      }
    } catch (error) {
      console.error("Disconnect failed:", error)
      toast.error("Failed to disconnect wallet")
    }
  }
  
  // Connected state
  if (accounts && accounts.length > 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-green-400">
          ✓ Connected: {accounts[0].name}
        </div>
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }
  
  // Disconnected state
  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleConnect}
        disabled={isConnecting || wallets.length === 0}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      {wallets.length === 0 && (
        <div className="text-xs text-slate-400 text-center">
          Install Talisman or Polkadot.js extension
        </div>
      )}
    </div>
  )
}