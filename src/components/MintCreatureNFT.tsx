"use client"

import { useState, useEffect } from "react"
import { useAccounts } from "@reactive-dot/react"
import { toast } from "sonner"
import { Button } from "./ui/button-extended"
import { Badge } from "./ui/badge"
import { NFT_CONTRACT_CONFIG } from "@/lib/contracts/nft-contract"
import { monstersContract } from "@/lib/contracts/monsters-deployment"

interface MintCreatureNFTProps {
  lessonId: number
  onMintSuccess?: (txHash: string) => void
}

export function MintCreatureNFT({ lessonId, onMintSuccess }: MintCreatureNFTProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const accounts = useAccounts()
  
  const connectedAccount = accounts?.[0]

  // Check balance when account changes
  useEffect(() => {
    const checkBalance = async () => {
      if (!connectedAccount?.address) {
        setIsLoadingBalance(false)
        return
      }

      try {
        setIsLoadingBalance(true)
        
        // Import polkadot.js API to check balance
        const { ApiPromise, WsProvider } = await import('@polkadot/api')
        
        // Connect to Pop Network
        const wsProvider = new WsProvider('wss://rpc1.paseo.popnetwork.xyz')
        const api = await ApiPromise.create({ provider: wsProvider })
        
        // Get account balance
        const accountInfo = await api.query.system.account(connectedAccount.address)
        const balance = (accountInfo as any).data.free.toString()
        
        // Convert from smallest unit (12 decimals for POP) to readable format
        const readable = (BigInt(balance) / BigInt(10 ** 12)).toString()
        setBalance(readable)
        
        await api.disconnect()
      } catch (error) {
        console.error('Error checking balance:', error)
        setBalance('0')
      } finally {
        setIsLoadingBalance(false)
      }
    }

    checkBalance()
  }, [connectedAccount?.address])

  const hasInsufficientFunds = parseFloat(balance) < 1 // Need at least 1 POP for transaction fees

  const handleFaucet = () => {
    // Open both the faucet and bridge links to help users get tokens
    window.open('https://learn.onpop.io/contracts/guides/bridge-tokens-to-pop-network', '_blank')
    
    // Also show a toast with instructions
    toast.info('Token Setup Guide', {
      description: '1. Get PAS from Paseo faucet → 2. Bridge PAS to Pop Network',
      duration: 8000
    })
  }

  const handleMint = async () => {
    if (!connectedAccount?.polkadotSigner) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsMinting(true)
    
    try {
      console.log("Starting mint transaction...")
      
      // Import polkadot.js API to make the actual contract call
      const { ApiPromise, WsProvider } = await import('@polkadot/api')
      const { ContractPromise } = await import('@polkadot/api-contract')
      
      // Connect to Pop Network
      const wsProvider = new WsProvider('wss://rpc1.paseo.popnetwork.xyz')
      const api = await ApiPromise.create({ provider: wsProvider })
      
      // Create contract instance
      const contractAddress = monstersContract.ss58Addresses.pop
      const contract = new ContractPromise(api, monstersContract.metadata, contractAddress)
      
      console.log("Contract created, calling public_mint...")
      
      // Use a simpler approach - just use the direct polkadot-api method
      // since the reactive-dot signer is not compatible with polkadot.js contract calls
      
      console.log("Calling contract public_mint function...")
      
      // Get the injected web3 extension directly to bypass reactive-dot signer issues
      const { web3Enable, web3Accounts, web3FromSource } = await import('@polkadot/extension-dapp')
      
      await web3Enable('Inkverse NFT Minting')
      const allAccounts = await web3Accounts()
      const userAccount = allAccounts.find(account => account.address === connectedAccount.address)
      
      if (!userAccount) {
        throw new Error('Account not found in wallet extension')
      }
      
      const injector = await web3FromSource(userAccount.meta.source)
      
      // Use a fixed gas limit
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 50_000_000_000,
        proofSize: 1_000_000,
      })
      
      const result = await new Promise<string>((resolve, reject) => {
        contract.tx
          .publicMint({
            gasLimit: gasLimit as any,
            storageDepositLimit: null,
          })
          .signAndSend(
            connectedAccount.address,
            { signer: injector.signer },
            ({ status, dispatchError }: any) => {
            if (dispatchError) {
              reject(new Error(`Dispatch error: ${dispatchError}`))
            } else if (status.isInBlock) {
              console.log(`Transaction included in block: ${status.asInBlock}`)
              resolve(status.asInBlock.toString())
            }
          })
          .catch(reject)
      })
      
      // Cleanup
      await api.disconnect()
      
      console.log("NFT minted successfully:", result)
      
      setHasMinted(true)
      toast.success("🎉 Creature NFT minted successfully!", {
        description: `Your lesson ${lessonId} creature is now immortalized on Pop Network testnet! TX: ${result.toString().substring(0, 8)}...`
      })
      
      onMintSuccess?.(result.toString())
      
    } catch (error: any) {
      console.error("Minting failed:", error)
      toast.error("Failed to mint NFT", {
        description: error.message || "Please try again or check your wallet connection"
      })
    } finally {
      setIsMinting(false)
    }
  }

  if (!connectedAccount) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 border border-orange-500/20 rounded-xl bg-orange-500/5">
        <div className="text-center">
          <h3 className="font-semibold text-orange-600">🏆 Lesson Complete!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your wallet to mint your creature as an NFT
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-500/30">
          NFT Reward Available
        </Badge>
      </div>
    )
  }

  if (hasMinted) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 border border-green-500/20 rounded-xl bg-green-500/5">
        <div className="text-center">
          <h3 className="font-semibold text-green-600">🎉 NFT Minted!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your creature NFT has been successfully minted
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-500/30">
          NFT Minted
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 border border-blue-500/20 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-semibold text-blue-600">🏆 Lesson Complete!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Mint your creature as an NFT on Pop Network testnet
        </p>
        {/* Balance display */}
        <div className="mt-2 text-xs text-gray-600">
          Balance: <span className={`font-medium ${hasInsufficientFunds ? "text-orange-600" : "text-green-600"}`}>
            {isLoadingBalance ? "Loading..." : `${balance} PAS`}
          </span>
        </div>
      </div>
      
      {/* Faucet button - only when needed */}
      {hasInsufficientFunds && !isLoadingBalance && (
        <div className="w-full">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-orange-800 mb-2">
              ⚠️ You need PAS tokens to pay for transaction fees
            </p>
            <Button
              onClick={handleFaucet}
              variant="outline"
              size="sm"
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
            >
              📖 Get PAS Tokens Guide
            </Button>
          </div>
        </div>
      )}
      
      {/* Mint Button */}
      <Button
        onClick={handleMint}
        disabled={isMinting || hasInsufficientFunds || isLoadingBalance}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
      >
        {isMinting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Minting...
          </span>
        ) : hasInsufficientFunds ? (
          "Get Tokens First"
        ) : (
          "Mint NFT"
        )}
      </Button>
    </div>
  )
}