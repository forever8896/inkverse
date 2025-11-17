"use client"

import { useState, useCallback, useEffect } from "react"
import { useChainId, useClient, useTypedApi } from "@reactive-dot/react"
import { createInkSdk } from "@polkadot-api/sdk-ink"
import { contracts } from "@polkadot-api/descriptors"
import { toast } from "sonner"
import { Button } from "./ui/button-extended"
import { Badge } from "./ui/badge"
import { useSignerAndAddress } from "@/hooks/use-signer-and-address"
import { monstersContract } from "@/lib/contracts/monsters-deployment"

interface MintCreatureNFTProps {
  lessonId: number
  onMintSuccess?: (txHash: string) => void
  mintedTokenId?: number | null
}

export function MintCreatureNFT({ lessonId, onMintSuccess, mintedTokenId }: MintCreatureNFTProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)
  const [isAccountMapped, setIsAccountMapped] = useState<boolean | null>(null)
  const [mintedTxHash, setMintedTxHash] = useState<string | null>(null)

  const chain = useChainId()
  const client = useClient()
  const typedApi = useTypedApi()
  const { signer, signerAddress } = useSignerAndAddress()

  // Get contract address for current chain
  const contractAddress = chain === 'pop' ? monstersContract.evmAddresses.pop : null

  // Check if account is mapped using SDK method
  useEffect(() => {
    const checkAccountMapping = async () => {
      if (!signerAddress || !contractAddress) return

      try {
        const sdk = createInkSdk(client)
        const isMapped = await sdk.addressIsMapped(signerAddress)
        setIsAccountMapped(isMapped)
      } catch (error) {
        console.error('Error checking account mapping:', error)
        setIsAccountMapped(false)
      }
    }

    checkAccountMapping()
  }, [client, signerAddress, contractAddress])

  const handleMapAccount = useCallback(async () => {
    if (!chain || !signer || !signerAddress || !typedApi) return

    try {
      // Call map_account extrinsic
      const tx = (typedApi.tx.Revive as any).map_account()
        .signAndSubmit(signer)
        .then(async (result: { ok: boolean; dispatchError?: any }) => {
          if (!result.ok) {
            throw new Error("Failed to map account", { cause: result.dispatchError })
          }

          // Recheck mapping status after successful mapping
          const sdk = createInkSdk(client)
          const isMapped = await sdk.addressIsMapped(signerAddress)
          setIsAccountMapped(isMapped)
        })

      toast.promise(tx, {
        loading: "Mapping account...",
        success: "Account mapped successfully! You can now mint NFTs.",
        error: "Failed to map account. Do you have enough funds?",
      })
    } catch (error) {
      console.error('Error mapping account:', error)
      toast.error("Failed to map account")
    }
  }, [typedApi, client, chain, signer, signerAddress])

  const handleMint = useCallback(async () => {
    if (!chain || !signer || !signerAddress || !contractAddress) return

    setIsMinting(true)

    try {
      const sdk = createInkSdk(client)
      const contract = sdk.getContract(contracts.monsters, contractAddress)

      // Check if account is mapped before sending transaction
      const isMapped = await sdk.addressIsMapped(signerAddress)
      if (!isMapped) {
        toast.error("Account not mapped. Please map your account first.")
        setIsMinting(false)
        return
      }

      // Send mint transaction
      const tx = contract
        .send("public_mint", { origin: signerAddress })
        .signAndSubmit(signer)
        .then((result) => {
          if (!result.ok) {
            throw new Error("Failed to mint NFT", { cause: result.dispatchError })
          }

          setHasMinted(true)
          const txHash = result.txHash?.toString() ?? ""
          setMintedTxHash(txHash)
          if (txHash) onMintSuccess?.(txHash)
        })

      toast.promise(tx, {
        loading: "Minting your creature NFT...",
        success: "Successfully minted your creature NFT!",
        error: "Failed to mint NFT",
      })

      await tx
    } catch (error) {
      console.error('Minting error:', error)
      toast.error("Error minting NFT")
    } finally {
      setIsMinting(false)
    }
  }, [client, chain, signer, signerAddress, contractAddress, onMintSuccess])

  if (!contractAddress) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
        <p className="text-orange-400">Contract not deployed on {chain}</p>
      </div>
    )
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
          <p><strong>Network:</strong> Pop Network Testnet</p>
          <p><strong>Lesson:</strong> {lessonId}</p>
          <p><strong>Contract:</strong> {contractAddress}</p>
        </div>

        {!signer ? (
          <p className="text-orange-400 text-sm">
            Please connect your wallet to mint an NFT
          </p>
        ) : isAccountMapped === false ? (
          <div className="space-y-2">
            <p className="text-orange-400 text-sm">
              Your account needs to be mapped before you can interact with contracts on Pop Network.
            </p>
            <Button
              onClick={handleMapAccount}
              className="w-full"
              variant="secondary"
            >
              Map Account
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Mint an NFT to commemorate completing lesson {lessonId}!
            </p>

            {!hasMinted ? (
              <Button
                onClick={handleMint}
                disabled={isMinting || hasMinted || !signer || isAccountMapped !== true}
                isLoading={isMinting}
                className="w-full"
              >
                {isMinting ? "Minting..." : "Mint Creature NFT"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-600/20 border border-emerald-500/50 rounded-lg text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h4 className="text-emerald-300 font-bold mb-1">Successfully Minted!</h4>
                  <p className="text-emerald-100 text-sm">Your creature NFT is ready to view</p>
                  {mintedTxHash && (
                    <p className="text-emerald-200/60 text-xs mt-1 font-mono">
                      TX: {mintedTxHash.substring(0, 10)}...
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base py-6"
                >
                  <a href={`/nft/${lessonId}`} target="_blank" rel="noopener noreferrer">
                    🖼️ View Your NFT
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
