// NFT Contract Interface for MonstersInk! Creatures
export interface NFTContractInterface {
  // Contract address on testnet - will be set after deployment
  address: string;
  
  // Contract methods
  public_mint(): Promise<void>;
  mint_to(to: string): Promise<void>;
  set_collection_ipfs_uri(uri: string): Promise<void>;
  get_collection_ipfs_uri(): Promise<string | null>;
  get_next_id(): Promise<number>;
  total_supply(): Promise<number>;
  balance_of(owner: string): Promise<number>;
  owner_of(id: number): Promise<string | null>;
}

// Contract configuration
export const NFT_CONTRACT_CONFIG = {
  // Pop Network testnet configuration
  testnet: {
    address: "5GALB9ZyMoEHis6WbVL5hQDzzoP6MpCM6qh27UMgzVDt2G6H",
    rpc: "wss://rpc1.paseo.popnetwork.xyz",
    chainId: "pop-testnet"
  },
  
  // Shibuya testnet configuration (Astar Network)
  shibuya: {
    address: "5HNLhYcybokr625oTadE6sxBxAuneJRF48Qge6BaiByd4bnc",
    rpc: "wss://rpc.shibuya.astar.network",
    chainId: "shibuya"
  },
  
  // IPFS configuration for creature metadata
  ipfs: {
    baseUri: "ipfs://QmYourHashHere", // Will be set to actual IPFS hash
    gateway: "https://gateway.pinata.cloud/ipfs/"
  }
};

// Contract ABI metadata (simplified for the methods we need)
export const NFT_CONTRACT_ABI = {
  source: {
    hash: "0x...", // Contract code hash
    language: "ink! 5.1.1",
    compiler: "rustc 1.75.0"
  },
  spec: {
    constructors: [
      {
        name: "new",
        selector: "0x9bae9d5e",
        args: [],
        docs: ["Creates a new NFT contract instance"]
      }
    ],
    messages: [
      {
        name: "public_mint",
        selector: "0x...", // Will be filled from compiled contract
        args: [],
        returnType: "Result<(), PSP34Error>",
        docs: ["Mints a new creature NFT to the caller"]
      },
      {
        name: "mint_to",
        selector: "0x...",
        args: [
          { name: "to", type: "AccountId" },
          { name: "id", type: "Id" }
        ],
        returnType: "Result<(), PSP34Error>",
        docs: ["Mints an NFT to specified address (admin only)"]
      },
      {
        name: "set_collection_ipfs_uri",
        selector: "0x...",
        args: [{ name: "uri", type: "Vec<u8>" }],
        returnType: "Result<(), PSP34Error>",
        docs: ["Sets the IPFS base URI for collection metadata"]
      },
      {
        name: "get_collection_ipfs_uri",
        selector: "0x...",
        args: [],
        returnType: "Option<Vec<u8>>",
        docs: ["Gets the IPFS base URI for collection metadata"]
      },
      {
        name: "get_next_id",
        selector: "0x...",
        args: [],
        returnType: "u128",
        docs: ["Returns the next token ID that will be minted"]
      }
    ]
  }
};