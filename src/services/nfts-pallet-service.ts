/**
 * NFTs Pallet Service
 * Handles interaction with Passet Hub's NFTs pallet for minting
 *
 * NOTE: Uses dynamic imports for @polkadot packages to avoid Turbopack
 * octal escape error in @polkadot/util-crypto during build
 */

import { getPool } from '@/lib/postgres';

// Type-only imports (stripped at build time, don't cause bundling)
import type { ApiPromise as ApiPromiseType } from '@polkadot/api';
import type { Keyring as KeyringType } from '@polkadot/keyring';

// Lazy-loaded polkadot modules (avoids Turbopack bundling issue)
let ApiPromise: typeof import('@polkadot/api').ApiPromise;
let WsProvider: typeof import('@polkadot/api').WsProvider;
let Keyring: typeof import('@polkadot/keyring').Keyring;
let cryptoWaitReady: typeof import('@polkadot/util-crypto').cryptoWaitReady;

async function loadPolkadotModules() {
  if (!ApiPromise) {
    const api = await import('@polkadot/api');
    ApiPromise = api.ApiPromise;
    WsProvider = api.WsProvider;

    const keyring = await import('@polkadot/keyring');
    Keyring = keyring.Keyring;

    const utilCrypto = await import('@polkadot/util-crypto');
    cryptoWaitReady = utilCrypto.cryptoWaitReady;
  }
}

// Suppress Polkadot API warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0]?.toString() || '';
  if (msg.includes('REGISTRY:') || msg.includes('API/INIT:') || msg.includes('multiple versions')) {
    return;
  }
  originalWarn.apply(console, args);
};

export interface MintNFTParams {
  collectionId: number;
  itemId: number;
  ownerAddress: string;
  metadataUri: string;  // ipfs://CID
}

export interface MintNFTResult {
  success: boolean;
  txHash?: string;
  blockHash?: string;
  error?: string;
}

export class NFTsPalletService {
  private static instance: NFTsPalletService;
  private api: ApiPromiseType | null = null;
  private platformAccount: ReturnType<KeyringType['addFromMnemonic']> | null = null;
  private rpcUrl: string;
  private collectionId: number;

  private constructor() {
    this.rpcUrl = process.env.ASSET_HUB_RPC_URL || 'wss://passet-hub-paseo.ibp.network';
    this.collectionId = parseInt(process.env.NFTS_COLLECTION_ID || '11', 10);

    if (!process.env.PLATFORM_ACCOUNT_SEED) {
      throw new Error('PLATFORM_ACCOUNT_SEED environment variable is required');
    }
  }

  static getInstance(): NFTsPalletService {
    if (!NFTsPalletService.instance) {
      NFTsPalletService.instance = new NFTsPalletService();
    }
    return NFTsPalletService.instance;
  }

  /**
   * Validate SS58 address format using regex
   * FIX #5: Add owner address validation
   */
  static validateSS58Address(address: string): boolean {
    // SS58 addresses are base58 encoded, typically 47-48 characters
    // Base58 excludes 0, O, I, l to avoid ambiguity
    const ss58Regex = /^[1-9A-HJ-NP-Za-km-z]{45,50}$/;
    return ss58Regex.test(address);
  }

  /**
   * Connect to blockchain and initialize platform account
   */
  private async connect(): Promise<void> {
    if (this.api && this.api.isConnected) {
      return;
    }

    console.log(`[NFTsPallet] Connecting to ${this.rpcUrl}...`);

    // Load polkadot modules dynamically
    await loadPolkadotModules();
    await cryptoWaitReady();

    const provider = new WsProvider(this.rpcUrl, 5000);

    // Connection timeout
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 30s')), 30000);
    });

    this.api = await Promise.race([
      ApiPromise.create({ provider }),
      timeout,
    ]);

    // Load platform account
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
    this.platformAccount = keyring.addFromMnemonic(process.env.PLATFORM_ACCOUNT_SEED!);

    console.log(`[NFTsPallet] Connected. Platform: ${this.platformAccount.address}`);
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  /**
   * Get next NFT item ID atomically from database
   */
  async getNextItemId(): Promise<number> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT get_next_nft_item_id($1) as item_id',
      [this.collectionId]
    );
    return result.rows[0].item_id;
  }

  /**
   * Check platform account balance
   */
  async checkBalance(): Promise<{ ok: boolean; balance: bigint; error?: string }> {
    try {
      await this.connect();

      const { data: balance } = await this.api!.query.system.account(
        this.platformAccount!.address
      ) as any;
      const freeBalance = balance.free.toBigInt();
      const existentialDeposit = this.api!.consts.balances.existentialDeposit as any;
      const edBigInt = existentialDeposit.toBigInt();

      // Need at least 2x existential deposit for safety
      const minRequired = edBigInt * 2n;

      if (freeBalance < minRequired) {
        return {
          ok: false,
          balance: freeBalance,
          error: `Insufficient balance: ${freeBalance} < ${minRequired}`,
        };
      }

      return { ok: true, balance: freeBalance };
    } catch (error) {
      return {
        ok: false,
        balance: 0n,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test blockchain connectivity
   */
  async testConnectivity(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.connect();
      const chain = await this.api!.rpc.system.chain();
      console.log(`[NFTsPallet] Connected to chain: ${chain}`);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * FIX #3: Verify if NFT exists on-chain (for crash recovery)
   * Checks if an NFT with given collection+item exists on blockchain
   */
  async verifyNFTExists(collectionId: number, itemId: number): Promise<boolean> {
    try {
      await this.connect();

      // Query the NFT item storage
      const item = await this.api!.query.nfts.item(collectionId, itemId);

      // item.isSome means the NFT exists
      return (item as any).isSome;
    } catch (error) {
      console.error(`[NFTsPallet] Error verifying NFT existence:`, error);
      return false;
    }
  }

  /**
   * Mint NFT and set metadata in a single batch transaction
   */
  async mintNFT(params: MintNFTParams): Promise<MintNFTResult> {
    const { collectionId, itemId, ownerAddress, metadataUri } = params;

    console.log(`[NFTsPallet] Minting NFT #${itemId} in collection ${collectionId}`);
    console.log(`  Owner: ${ownerAddress}`);
    console.log(`  Metadata: ${metadataUri}`);

    // FIX #5: Validate owner address before attempting mint
    if (!NFTsPalletService.validateSS58Address(ownerAddress)) {
      return {
        success: false,
        error: `Invalid owner address format: ${ownerAddress}`,
      };
    }

    try {
      await this.connect();

      // Build batch transaction: mint + setMetadata
      const mintTx = this.api!.tx.nfts.mint(
        collectionId,
        itemId,
        ownerAddress,
        null  // No witness data
      );

      const metadataTx = this.api!.tx.nfts.setMetadata(
        collectionId,
        itemId,
        metadataUri
      );

      const batchTx = this.api!.tx.utility.batchAll([mintTx, metadataTx]);

      // Sign and send
      return new Promise<MintNFTResult>((resolve, reject) => {
        let resolved = false;

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: 'Transaction timeout after 120 seconds',
            });
          }
        }, 120000);

        batchTx.signAndSend(
          this.platformAccount!,
          ({ status, events, dispatchError }) => {
            console.log(`[NFTsPallet] Tx status: ${status.type}`);

            if (status.isFinalized) {
              clearTimeout(timeout);

              if (dispatchError) {
                let errorMsg = dispatchError.toString();

                if (dispatchError.isModule) {
                  try {
                    const decoded = this.api!.registry.findMetaError(
                      dispatchError.asModule
                    );
                    errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                  } catch {
                    // Use default error message
                  }
                }

                if (!resolved) {
                  resolved = true;
                  resolve({
                    success: false,
                    error: errorMsg,
                  });
                }
                return;
              }

              // Find nfts.Issued event to confirm mint
              let mintConfirmed = false;
              events.forEach(({ event }) => {
                if (this.api!.events.nfts.Issued.is(event)) {
                  mintConfirmed = true;
                }
              });

              if (!resolved) {
                resolved = true;
                resolve({
                  success: mintConfirmed,
                  txHash: batchTx.hash.toHex(),
                  blockHash: status.asFinalized.toHex(),
                  error: mintConfirmed ? undefined : 'Mint event not found',
                });
              }
            }
          }
        ).catch((error) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            // FIX: Actually reject on dispatch error so callers know it failed
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update NFT metadata on-chain (for evolution)
   * @param collectionId NFT collection ID
   * @param itemId NFT item ID
   * @param metadataUri New IPFS metadata URI
   */
  async setMetadata(
    collectionId: number,
    itemId: number,
    metadataUri: string
  ): Promise<{ success: boolean; txHash?: string; blockHash?: string; error?: string }> {
    console.log(`[NFTsPallet] Setting metadata for collection ${collectionId}, item ${itemId}`);

    try {
      await this.connect();

      const metadataTx = this.api!.tx.nfts.setMetadata(
        collectionId,
        itemId,
        metadataUri
      );

      return new Promise((resolve, reject) => {
        let resolved = false;

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: 'Transaction timeout after 120 seconds',
            });
          }
        }, 120000);

        metadataTx.signAndSend(
          this.platformAccount!,
          ({ status, dispatchError }) => {
            console.log(`[NFTsPallet] setMetadata Tx status: ${status.type}`);

            if (status.isFinalized) {
              clearTimeout(timeout);

              if (dispatchError) {
                let errorMsg = dispatchError.toString();

                if (dispatchError.isModule) {
                  try {
                    const decoded = this.api!.registry.findMetaError(
                      dispatchError.asModule
                    );
                    errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                  } catch {
                    // Use default error message
                  }
                }

                if (!resolved) {
                  resolved = true;
                  resolve({
                    success: false,
                    error: errorMsg,
                  });
                }
                return;
              }

              if (!resolved) {
                resolved = true;
                resolve({
                  success: true,
                  txHash: metadataTx.hash.toHex(),
                  blockHash: status.asFinalized.toHex(),
                });
              }
            }
          }
        ).catch((error) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get collection ID
   */
  getCollectionId(): number {
    return this.collectionId;
  }
}
