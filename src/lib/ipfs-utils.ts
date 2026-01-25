/**
 * IPFS Utilities for NFT Metadata Fetching
 *
 * Provides utilities for fetching NFT metadata from IPFS with
 * multiple gateway fallbacks for reliability.
 */

// ============================================================================
// Types
// ============================================================================

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: NFTAttribute[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number | boolean;
  display_type?: string;
}

export interface IPFSGateway {
  name: string;
  url: (cid: string) => string;
  authenticated: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PINATA_GATEWAY_KEY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_KEY || '';
const PINATA_GATEWAY_HOST = 'jade-worrying-horse-775.mypinata.cloud';

/**
 * IPFS gateways in order of preference.
 * Pinata (authenticated) is fastest and most reliable.
 * Public gateways serve as fallbacks.
 */
export const IPFS_GATEWAYS: IPFSGateway[] = [
  // Primary: Pinata authenticated gateway (fastest)
  {
    name: 'Pinata (Authenticated)',
    url: (cid: string) =>
      PINATA_GATEWAY_KEY
        ? `https://${PINATA_GATEWAY_HOST}/ipfs/${cid}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`
        : `https://gateway.pinata.cloud/ipfs/${cid}`,
    authenticated: true,
  },
  // Fallback: Cloudflare IPFS gateway (fast, reliable)
  {
    name: 'Cloudflare',
    url: (cid: string) => `https://cloudflare-ipfs.com/ipfs/${cid}`,
    authenticated: false,
  },
  // Fallback: ipfs.io (official gateway)
  {
    name: 'IPFS.io',
    url: (cid: string) => `https://ipfs.io/ipfs/${cid}`,
    authenticated: false,
  },
  // Fallback: dweb.link (Protocol Labs)
  {
    name: 'dweb.link',
    url: (cid: string) => `https://dweb.link/ipfs/${cid}`,
    authenticated: false,
  },
];

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert an IPFS URI to an HTTP gateway URL.
 *
 * @param ipfsUri - IPFS URI (e.g., "ipfs://QmXxx..." or just "QmXxx...")
 * @param gatewayIndex - Optional gateway index to use (default: 0 = Pinata)
 * @returns HTTP URL for the gateway
 *
 * @example
 * ```typescript
 * ipfsToHttpUrl('ipfs://QmXxx...')
 * // => 'https://jade-worrying-horse-775.mypinata.cloud/ipfs/QmXxx...?pinataGatewayToken=...'
 * ```
 */
export function ipfsToHttpUrl(ipfsUri: string, gatewayIndex: number = 0): string {
  if (!ipfsUri) {
    return '';
  }

  // Handle already HTTP URLs
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }

  // Extract CID from various formats
  let cid = ipfsUri;
  if (ipfsUri.startsWith('ipfs://')) {
    cid = ipfsUri.replace('ipfs://', '');
  }

  // Use specified gateway or fall back to first
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return gateway.url(cid);
}

/**
 * Fetch JSON data from IPFS with automatic gateway fallback.
 *
 * Tries each gateway in order with a 10-second timeout per attempt.
 * If all gateways fail, throws an error.
 *
 * @param cid - IPFS CID or URI
 * @returns Parsed JSON data
 * @throws Error if all gateways fail
 *
 * @example
 * ```typescript
 * const metadata = await fetchFromIPFS<NFTMetadata>('QmXxx...');
 * console.log(metadata.name);
 * ```
 */
export async function fetchFromIPFS<T>(cid: string): Promise<T> {
  // Normalize CID
  const normalizedCid = cid.startsWith('ipfs://') ? cid.replace('ipfs://', '') : cid;

  const errors: string[] = [];

  for (const gateway of IPFS_GATEWAYS) {
    const url = gateway.url(normalizedCid);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000), // 10 second timeout per gateway
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      errors.push(`${gateway.name}: HTTP ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${gateway.name}: ${message}`);
      console.warn(`[IPFS] Gateway ${gateway.name} failed:`, message);
    }
  }

  throw new Error(`All IPFS gateways failed: ${errors.join(', ')}`);
}

/**
 * Fetch an image from IPFS and return a Blob URL.
 *
 * This is useful for loading images into canvas or img elements
 * while benefiting from gateway fallbacks.
 *
 * @param cid - IPFS CID or URI
 * @returns Blob URL for the image
 * @throws Error if all gateways fail
 */
export async function fetchImageFromIPFS(cid: string): Promise<string> {
  const normalizedCid = cid.startsWith('ipfs://') ? cid.replace('ipfs://', '') : cid;

  for (const gateway of IPFS_GATEWAYS) {
    const url = gateway.url(normalizedCid);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000), // 30 second timeout for images
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn(`[IPFS] Image fetch from ${gateway.name} failed`);
    }
  }

  throw new Error('Failed to fetch image from all IPFS gateways');
}

/**
 * Check if a string looks like an IPFS CID or URI.
 *
 * @param value - String to check
 * @returns true if it looks like an IPFS reference
 */
export function isIPFSUri(value: string): boolean {
  if (!value) return false;

  // Check for ipfs:// protocol
  if (value.startsWith('ipfs://')) return true;

  // Check for CIDv0 (starts with Qm, 46 chars)
  if (value.startsWith('Qm') && value.length === 46) return true;

  // Check for CIDv1 (starts with bafy, 59+ chars)
  if (value.startsWith('bafy') && value.length >= 59) return true;

  return false;
}

// ============================================================================
// Display Helpers
// ============================================================================

export type MonsterStage = 'egg' | 'young' | 'adult';
export type MonsterStyle = 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';

export const STAGE_DISPLAY: Record<MonsterStage, { emoji: string; label: string }> = {
  egg: { emoji: '🥚', label: 'Egg' },
  young: { emoji: '🐣', label: 'Young' },
  adult: { emoji: '🦖', label: 'Adult' },
};

export const STYLE_DISPLAY: Record<MonsterStyle, { color: string; label: string }> = {
  cute: { color: '#FFB6C1', label: 'Cute' },
  fierce: { color: '#FF4444', label: 'Fierce' },
  mysterious: { color: '#9B59B6', label: 'Mysterious' },
  playful: { color: '#F39C12', label: 'Playful' },
  cosmic: { color: '#3498DB', label: 'Cosmic' },
};
