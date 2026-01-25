'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchFromIPFS,
  ipfsToHttpUrl,
  type NFTMetadata,
  type NFTAttribute,
} from '@/lib/ipfs-utils';

// ============================================================================
// Types
// ============================================================================

export interface UseIPFSMetadataOptions {
  /** The IPFS CID of the metadata JSON */
  metadataCid?: string | null;
  /** Fallback image URL (e.g., from S3) if IPFS fails */
  fallbackImageUrl?: string | null;
  /** Fallback model URL (e.g., from S3) if IPFS fails */
  fallbackModelUrl?: string | null;
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseIPFSMetadataReturn {
  /** The fetched metadata */
  metadata: NFTMetadata | null;
  /** Resolved HTTP URL for the image */
  resolvedImageUrl: string | null;
  /** Resolved HTTP URL for the 3D model (if available) */
  resolvedModelUrl: string | null;
  /** Whether the monster has a 3D model */
  has3DModel: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether using fallback URLs instead of IPFS */
  usingFallback: boolean;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for fetching NFT metadata from IPFS with gateway fallbacks.
 *
 * Automatically resolves IPFS URIs to HTTP gateway URLs and provides
 * fallback to S3 URLs if IPFS is unavailable.
 *
 * @example
 * ```tsx
 * function MonsterViewer({ metadataCid, fallbackImageUrl }) {
 *   const { metadata, resolvedImageUrl, isLoading, error } = useIPFSMetadata({
 *     metadataCid,
 *     fallbackImageUrl,
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return <Image src={resolvedImageUrl} alt={metadata?.name} />;
 * }
 * ```
 */
export function useIPFSMetadata({
  metadataCid,
  fallbackImageUrl = null,
  fallbackModelUrl = null,
  autoFetch = true,
}: UseIPFSMetadataOptions): UseIPFSMetadataReturn {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchMetadata = useCallback(async () => {
    // If no CID, use fallbacks directly
    if (!metadataCid) {
      setUsingFallback(true);
      setResolvedImageUrl(fallbackImageUrl);
      setResolvedModelUrl(fallbackModelUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      // Fetch metadata JSON from IPFS
      const fetchedMetadata = await fetchFromIPFS<NFTMetadata>(metadataCid);
      setMetadata(fetchedMetadata);

      // Resolve image URL
      if (fetchedMetadata.image) {
        setResolvedImageUrl(ipfsToHttpUrl(fetchedMetadata.image));
      } else {
        setResolvedImageUrl(fallbackImageUrl);
      }

      // Resolve model URL (animation_url)
      if (fetchedMetadata.animation_url) {
        setResolvedModelUrl(ipfsToHttpUrl(fetchedMetadata.animation_url));
      } else {
        setResolvedModelUrl(fallbackModelUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
      console.error('[useIPFSMetadata] IPFS fetch failed:', errorMessage);
      setError(errorMessage);

      // Fall back to S3 URLs
      setUsingFallback(true);
      setResolvedImageUrl(fallbackImageUrl);
      setResolvedModelUrl(fallbackModelUrl);
    } finally {
      setIsLoading(false);
    }
  }, [metadataCid, fallbackImageUrl, fallbackModelUrl]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchMetadata();
    }
  }, [autoFetch, fetchMetadata]);

  const has3DModel = Boolean(
    metadata?.animation_url || resolvedModelUrl
  );

  return {
    metadata,
    resolvedImageUrl,
    resolvedModelUrl,
    has3DModel,
    isLoading,
    error,
    usingFallback,
    refetch: fetchMetadata,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract a specific attribute from NFT metadata.
 *
 * @param attributes - Array of NFT attributes
 * @param traitType - The trait_type to find
 * @returns The attribute value or undefined
 */
export function getAttribute<T extends string | number | boolean>(
  attributes: NFTAttribute[] | undefined,
  traitType: string
): T | undefined {
  const attr = attributes?.find(
    (a) => a.trait_type.toLowerCase() === traitType.toLowerCase()
  );
  return attr?.value as T | undefined;
}

/**
 * Check if metadata indicates the monster has a 3D model.
 *
 * @param metadata - NFT metadata
 * @returns true if monster has a 3D model
 */
export function metadataHas3DModel(metadata: NFTMetadata | null): boolean {
  if (!metadata) return false;

  // Check animation_url
  if (metadata.animation_url) return true;

  // Check "Has 3D Model" attribute
  const has3D = getAttribute<string>(metadata.attributes, 'Has 3D Model');
  return has3D === 'Yes' || has3D === 'true';
}
