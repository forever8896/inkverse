"use client"

import { useState, useEffect } from "react"
import { useAccounts, useChainId } from "@reactive-dot/react"
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
  
  // Handle missing chain context gracefully
  let chainId: string | undefined;
  try {
    chainId = useChainId();
  } catch (error) {
    console.warn("No chain context available, using default 'shibuya':", error);
    chainId = undefined;
  }
  
  const connectedAccount = accounts?.[0]
  
  // Get chain-specific configuration
  const getChainConfig = () => {
    const currentChainId = chainId || 'shibuya' // Default to shibuya
    
    switch (currentChainId) {
      case 'pop':
        return {
          rpc: 'wss://rpc1.paseo.popnetwork.xyz',
          contractAddress: monstersContract.ss58Addresses.pop,
          nativeSymbol: 'POP',
          decimals: 12
        }
      case 'passethub':
        return {
          rpc: 'wss://testnet-passet-hub.polkadot.io',
          contractAddress: monstersContract.ss58Addresses.passethub,
          nativeSymbol: 'PAS',
          decimals: 12
        }
      case 'shibuya':
      default:
        return {
          rpc: 'wss://rpc.shibuya.astar.network',
          contractAddress: monstersContract.ss58Addresses.shibuya,
          nativeSymbol: 'SBY',
          decimals: 18
        }
    }
  }

  const chainConfig = getChainConfig()

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
        
        // Connect to the current chain
        const wsProvider = new WsProvider(chainConfig.rpc)
        const api = await ApiPromise.create({ provider: wsProvider })
        
        // Get account balance
        const accountInfo = await api.query.system.account(connectedAccount.address)
        const balance = (accountInfo as any).data.free.toString()
        
        // Convert from smallest unit to readable format
        const readable = (BigInt(balance) / BigInt(10 ** chainConfig.decimals)).toString()
        setBalance(readable)
        
        await api.disconnect()
      } catch (error) {
        console.error('Error checking balance:', error)
        setBalance('Error')
      } finally {
        setIsLoadingBalance(false)
      }
    }

    checkBalance()
  }, [connectedAccount?.address, chainConfig.rpc, chainConfig.decimals])

  const handleMint = async () => {
    if (!connectedAccount?.address) {
      console.log("Please connect your wallet first")
      return
    }

    setIsMinting(true)
    
    try {
      console.log("Starting mint transaction...")
      
      // Import polkadot.js API to make the actual contract call
      const { ApiPromise, WsProvider } = await import('@polkadot/api')
      const { ContractPromise } = await import('@polkadot/api-contract')
      
      // Connect to the configured chain
      const wsProvider = new WsProvider(chainConfig.rpc)
      const api = await ApiPromise.create({ provider: wsProvider })
      
      // Create contract instance
      const contract = new ContractPromise(api, monstersContract.metadata, chainConfig.contractAddress)
      
      // Get the injected web3 extension for signing
      const { web3Enable, web3Accounts, web3FromSource } = await import('@polkadot/extension-dapp')
      
      await web3Enable('Inkverse NFT Minting')
      const allAccounts = await web3Accounts()
      const userAccount = allAccounts.find(account => account.address === connectedAccount.address)
      
      if (!userAccount) {
        throw new Error('Account not found in wallet extension')
      }
      
      const injector = await web3FromSource(userAccount.meta.source)
      
      // Call the mint function
      const gasLimit = api.registry.createType('WeightV2', {
        refTime: 50_000_000_000,
        proofSize: 1_000_000,
      });

      // Submit the transaction
      const tx = contract.tx.publicMint(
        {
          gasLimit: gasLimit as any,
          storageDepositLimit: null,
        }
      );

      // Sign and send the transaction
      const result = await new Promise<{txHash: string, blockHash: string}>((resolve, reject) => {
        tx.signAndSend(connectedAccount.address, { signer: injector.signer }, (result) => {
          if (result.status.isInBlock) {
            console.log(`Transaction in block: ${result.status.asInBlock.toString()}`);
            resolve({
              txHash: result.txHash.toString(),
              blockHash: result.status.asInBlock.toString()
            });
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized: ${result.status.asFinalized.toString()}`);
          } else if (result.dispatchError) {
            reject(new Error(`Transaction failed: ${result.dispatchError.toString()}`));
          }
        }).catch(reject);
      });

      console.log(`✅ Transaction successful! Hash: ${result.txHash}`);
      console.log(`🔗 View on Shibuya Explorer: https://shibuya.subscan.io/extrinsic/${result.txHash}`);
      
      setHasMinted(true);
      onMintSuccess?.(result.txHash);
      
    } catch (error) {
      console.error('Minting failed:', error)
      setHasMinted(false)
      console.error("Failed to mint NFT:", error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Mint Your Creature NFT</h3>
        <Badge variant={hasMinted ? "default" : "secondary"}>
          {hasMinted ? "Minted" : "Ready to Mint"}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm text-gray-300">
          <p><strong>Network:</strong> {chainId || 'shibuya'}</p>
          <p><strong>Lesson:</strong> {lessonId}</p>
          <p>
            <strong>Balance:</strong> {' '}
            {isLoadingBalance ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              <span className="text-green-400">{balance} {chainConfig.nativeSymbol}</span>
            )}
          </p>
        </div>
        
        {!connectedAccount ? (
          <p className="text-orange-400 text-sm">
            Please connect your wallet to mint an NFT
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Mint an NFT to commemorate completing lesson {lessonId}!
            </p>
            
            <Button
              onClick={handleMint}
              disabled={isMinting || hasMinted || !connectedAccount}
              isLoading={isMinting}
              className="w-full"
            >
              {hasMinted 
                ? "NFT Already Minted" 
                : isMinting 
                  ? "Minting..." 
                  : "Mint Creature NFT"
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}