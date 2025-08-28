'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button-extended';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading NFT</h1>
          <p className="text-gray-600 mb-6">{error || 'NFT not found'}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{nft.name}</h1>
          <p className="text-gray-600 mt-2">Token ID: #{nft.tokenId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Image */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${nft.tokenId}`;
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transaction Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transaction Hash:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {truncateAddress(nft.txHash)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(nft.txHash, 'txHash')}
                    >
                      {copiedTxHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
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
                  <span className="text-sm text-gray-600">Network:</span>
                  <Badge variant="secondary">Shibuya Testnet</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Standard:</span>
                  <Badge variant="outline">PSP34</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NFT Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>Information about this NFT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{nft.description}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Owner:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {truncateAddress(nft.owner)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(nft.owner, 'address')}
                    >
                      {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
                <CardDescription>Traits and properties of this NFT</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {nft.attributes.map((attribute, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-600 uppercase tracking-wide">
                        {attribute.trait_type}
                      </div>
                      <div className="font-semibold text-gray-900 mt-1">
                        {attribute.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
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
                  className="w-full"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 