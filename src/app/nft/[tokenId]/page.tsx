'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button-extended';
import { ArrowLeft, ExternalLink, Copy, Check, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import ShaderBackground from '@/components/ShaderBackground';

interface NFTMetadata {
  tokenId: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  mintedAt: string;
  txHash: string;
}

export default function NFTExplorerPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const searchParams = useSearchParams();
  const txHashFromParams = searchParams.get('tx');
  const [nft, setNft] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchNFTData();
  }, [tokenId]);

  const fetchNFTData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Import polkadot.js API
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { ContractPromise } = await import('@polkadot/api-contract');
      
      // Connect to Shibuya
      const wsProvider = new WsProvider('wss://rpc.shibuya.astar.network');
      const api = await ApiPromise.create({ provider: wsProvider });
      
      // Import contract metadata and deployment addresses
      const monstersMetadata = await import('@/lib/contracts/monsters.json');
      const { monstersDeployments } = await import('@/lib/contracts/monsters-deployment');
      
      // Use the correct contract address for the current chain (defaulting to shibuya for now)
      const contractAddress = monstersDeployments.shibuya;
      
      const contract = new ContractPromise(api, monstersMetadata.default, contractAddress);

      // Debug: Log available methods
      console.log('Contract query methods:', Object.keys(contract.query));
      console.log('Contract tx methods:', Object.keys(contract.tx));

      // Query NFT owner using the correct namespaced method
      const ownerResult = await contract.query['psp34::ownerOf'](
        contractAddress,
        {
          gasLimit: api.registry.createType('WeightV2', {
            refTime: 10_000_000_000,
            proofSize: 100_000,
          }) as any,
          storageDepositLimit: null,
        },
        { u128: parseInt(tokenId) }
      );

      console.log('Owner result:', ownerResult.output?.toHuman());
      console.log('Owner result raw:', ownerResult);

      // Check if the NFT exists
      if (ownerResult.result.isErr || !ownerResult.output) {
        throw new Error(`NFT #${tokenId} does not exist or query failed`);
      }

      // Parse the owner address from the result
      let ownerAddress = 'Unknown';
      const ownerOutput = ownerResult.output.toHuman();
      
      if (ownerOutput && typeof ownerOutput === 'object' && 'Ok' in ownerOutput) {
        // PSP34 returns Ok(address) for successful queries
        ownerAddress = (ownerOutput as any).Ok || 'Unknown';
      } else if (typeof ownerOutput === 'string') {
        ownerAddress = ownerOutput;
      }

      // Try to get total supply to verify the NFT exists
      const totalSupplyResult = await contract.query['psp34::totalSupply'](
        contractAddress,
        {
          gasLimit: api.registry.createType('WeightV2', {
            refTime: 10_000_000_000,
            proofSize: 100_000,
          }) as any,
          storageDepositLimit: null,
        }
      );

      console.log('Total supply:', totalSupplyResult?.output?.toHuman());

      // Query token metadata (IPFS URI)
      let tokenURI = null;
      try {
        const tokenURIResult = await contract.query['psp34Metadata::getAttribute'](
          contractAddress,
          {
            gasLimit: api.registry.createType('WeightV2', {
              refTime: 10_000_000_000,
              proofSize: 100_000,
            }) as any,
            storageDepositLimit: null,
          },
          { u128: parseInt(tokenId) },
          'tokenURI'.split('').map(c => c.charCodeAt(0)) // Convert string to bytes
        );
        
        console.log('Token URI result:', tokenURIResult.output?.toHuman());
        
        if (tokenURIResult.output && !tokenURIResult.result.isErr) {
          const uriOutput = tokenURIResult.output.toHuman();
          console.log('URI output:', uriOutput);
          
          if (uriOutput && typeof uriOutput === 'object' && 'Ok' in uriOutput) {
            const okValue = (uriOutput as any).Ok;
            
            if (typeof okValue === 'string') {
              // Direct string value
              tokenURI = okValue;
            } else if (Array.isArray(okValue)) {
              // Convert bytes back to string
              tokenURI = String.fromCharCode(...okValue);
            }
          } else if (typeof uriOutput === 'string') {
            // Direct string response
            tokenURI = uriOutput;
          }
        }
      } catch (uriError) {
        console.error('Error fetching token URI:', uriError);
      }

      console.log('Extracted token URI:', tokenURI);

      // Fetch actual metadata from IPFS if we have a URI
      let realMetadata = null;
      if (tokenURI && tokenURI.startsWith('ipfs://')) {
        try {
          // Convert IPFS URI to HTTP gateway URL with multiple fallbacks
          const ipfsHash = tokenURI.replace('ipfs://', '');
          const gateways: { url: string; headers: Record<string, string> }[] = [
            // Authenticated Pinata gateway with query parameter (client-side compatible)
            {
              url: `https://jade-worrying-horse-775.mypinata.cloud/ipfs/${ipfsHash}?pinataGatewayToken=f_eiLW2hGNBZBDCz0Keu07dD-RZSbvY5uD2kn3YwpETR8fm3pBizdznfYeLBrMxe`,
              headers: {}
            },
            // Public fallback gateways
            { url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`, headers: {} },
            { url: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`, headers: {} },
            { url: `https://ipfs.io/ipfs/${ipfsHash}`, headers: {} },
            { url: `https://dweb.link/ipfs/${ipfsHash}`, headers: {} }
          ];
          
          console.log('Trying IPFS gateways for hash:', ipfsHash);
          
          // Try each gateway until one works
          for (const gateway of gateways) {
            try {
              console.log('Trying gateway:', gateway.url);
              const metadataResponse = await fetch(gateway.url, {
                headers: gateway.headers
              });
              
              if (metadataResponse.ok) {
                realMetadata = await metadataResponse.json();
                console.log('Successfully fetched IPFS metadata from:', gateway.url);
                console.log('Metadata:', realMetadata);
                break; // Exit loop on success
              } else {
                console.warn(`Gateway ${gateway.url} returned status:`, metadataResponse.status);
              }
            } catch (gatewayError) {
              console.warn(`Gateway ${gateway.url} failed:`, gatewayError);
              // Continue to next gateway
            }
          }
          
          if (!realMetadata) {
            console.error('All IPFS gateways failed for hash:', ipfsHash);
          }
        } catch (ipfsError) {
          console.error('Error fetching IPFS metadata:', ipfsError);
        }
      }

      // Helper function to convert IPFS URLs to HTTP gateway URLs
      const convertIpfsUrl = (url: string) => {
        if (url && url.startsWith('ipfs://')) {
          const hash = url.replace('ipfs://', '');
          return `https://jade-worrying-horse-775.mypinata.cloud/ipfs/${hash}?pinataGatewayToken=f_eiLW2hGNBZBDCz0Keu07dD-RZSbvY5uD2kn3YwpETR8fm3pBizdznfYeLBrMxe`;
        }
        return url;
      };

      // Create the NFT metadata with real IPFS data or fallback
      const nftData: NFTMetadata = {
        tokenId,
        owner: ownerAddress,
        name: realMetadata?.name || `Inkverse Creature #${tokenId}`,
        description: realMetadata?.description || `A unique digital creature minted during your Inkverse learning journey. This NFT represents your completion of lesson ${tokenId} and your progress in mastering ink! smart contract development.`,
        image: convertIpfsUrl(realMetadata?.image) || (tokenURI ? convertIpfsUrl(tokenURI) : null) || `https://api.dicebear.com/7.x/monsters/svg?seed=creature${tokenId}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        attributes: realMetadata?.attributes || [
          { trait_type: 'Lesson', value: `Lesson ${tokenId}` },
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Type', value: 'Learning Achievement' },
          { trait_type: 'Network', value: 'Shibuya Testnet' },
          { trait_type: 'Standard', value: 'PSP34' },
          { trait_type: 'Contract', value: contractAddress.slice(0, 8) + '...' }
        ],
        mintedAt: new Date().toISOString(),
        txHash: txHashFromParams || '0x894944d2f4929ad8f511648bbd77974d03036ef086f3a7ad5943f1aff8f4e22e'
      };

      setNft(nftData);
      
      await api.disconnect();
    } catch (err) {
      console.error('Error fetching NFT data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NFT data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'address' | 'txHash') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedTxHash(true);
        setTimeout(() => setCopiedTxHash(false), 2000);
      }
      toast.success(`${type === 'address' ? 'Address' : 'Transaction hash'} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ShaderBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-fade-in">
              {/* Header skeleton */}
              <div className="mb-8">
                <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
                <div className="h-8 bg-white/10 rounded w-64 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-40"></div>
              </div>
              
              {/* Content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="h-96 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse"></div>
                  <div className="h-40 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse"></div>
                  <div className="h-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse"></div>
                  <div className="h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ShaderBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-2xl p-8 animate-fade-in">
              <div className="text-6xl mb-6">💥</div>
              <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading NFT</h1>
              <p className="text-slate-300 mb-6">{error || 'NFT not found'}</p>
              <Link href="/">
                <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ShaderBackground />
      
      {/* Floating background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float-slow"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-cyan-500/15 rounded-full blur-lg animate-float-medium"></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-float-fast"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-green-500/15 rounded-full blur-lg animate-float-slow"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors duration-200 group">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="font-pixel text-xs">Back to Lessons</span>
            </Link>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2 font-pixel">{nft.name}</h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-purple-400/50 text-purple-300 bg-purple-500/10">
                      Token #{nft.tokenId}
                    </Badge>
                    <Badge variant="outline" className="border-cyan-400/50 text-cyan-300 bg-cyan-500/10">
                      <Sparkles className="w-3 h-3 mr-1" />
                      PSP34
                    </Badge>
                  </div>
                </div>
                <div className="text-4xl animate-bounce">🧬</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: NFT Image and Transaction Info */}
            <div className="space-y-6">
              {/* NFT Image */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-pink-500/20 rounded-xl overflow-hidden relative group">
                    {/* Glow effect behind image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-cyan-400/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className={`w-full h-full object-cover rounded-xl transition-all duration-500 ${
                        imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      } group-hover:scale-105`}
                      onLoad={() => setImageLoaded(true)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.tokenId}`;
                        setImageLoaded(true);
                      }}
                    />
                    
                    {/* Overlay with view icon */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10">
                <h3 className="font-pixel text-sm text-purple-300 mb-4 flex items-center">
                  <span className="text-lg mr-2">⛓️</span>
                  Blockchain Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Transaction Hash:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-slate-800/50 text-cyan-300 px-3 py-1 rounded-lg border border-slate-700/50">
                        {truncateAddress(nft.txHash)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/10"
                        onClick={() => copyToClipboard(nft.txHash, 'txHash')}
                      >
                        {copiedTxHash ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/10"
                        asChild
                      >
                        <a 
                          href={`https://shibuya.subscan.io/extrinsic/${nft.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Network:</span>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                      Shibuya Testnet
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Standard:</span>
                    <Badge variant="outline" className="border-purple-400/50 text-purple-300 bg-purple-500/10">
                      PSP34
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: NFT Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10">
                <h3 className="font-pixel text-sm text-cyan-300 mb-4 flex items-center">
                  <span className="text-lg mr-2">📊</span>
                  Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2 text-sm">Description</h4>
                    <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                      {nft.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-slate-400">Owner:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-slate-800/50 text-green-300 px-3 py-1 rounded-lg border border-slate-700/50">
                        {truncateAddress(nft.owner)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/10"
                        onClick={() => copyToClipboard(nft.owner, 'address')}
                      >
                        {copiedAddress ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10">
                <h3 className="font-pixel text-sm text-pink-300 mb-4 flex items-center">
                  <span className="text-lg mr-2">🏷️</span>
                  Attributes
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {nft.attributes.map((attribute, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 text-center transition-all duration-200 hover:bg-slate-700/50 hover:border-slate-600/50 hover:scale-105"
                    >
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-pixel mb-1">
                        {attribute.trait_type}
                      </div>
                      <div className="font-semibold text-white text-sm">
                        {attribute.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10">
                <h3 className="font-pixel text-sm text-green-300 mb-4 flex items-center">
                  <span className="text-lg mr-2">🚀</span>
                  Actions
                </h3>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 transition-all duration-200 hover:scale-105" 
                    asChild
                  >
                    <a 
                      href={`https://shibuya.subscan.io/account/${nft.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Owner on Explorer
                    </a>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 transition-all duration-200 hover:scale-105"
                    asChild
                  >
                    <a 
                      href={`https://shibuya.subscan.io/extrinsic/${nft.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Transaction
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 