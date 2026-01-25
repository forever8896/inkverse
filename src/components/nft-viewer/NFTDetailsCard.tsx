'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface NFTDetails {
  itemId: number;
  collectionId: number;
  ownerAddress: string;
  txHash?: string;
  blockHash?: string;
  mintedAt: string;
}

interface NFTDetailsCardProps {
  nft: NFTDetails;
  className?: string;
}

/**
 * Truncate an address for display.
 */
function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a hash for display.
 */
function formatHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

/**
 * Build Paseo Subscan explorer URL for a transaction.
 */
function getExplorerUrl(txHash: string): string {
  return `https://paseo.subscan.io/extrinsic/${txHash}`;
}

/**
 * Copy button with feedback animation.
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check size={14} className="text-[var(--mi-mint)]" />
      ) : (
        <Copy size={14} className="text-slate-500 hover:text-slate-300" />
      )}
    </button>
  );
}

/**
 * Card displaying on-chain NFT details.
 * Shows token ID, collection, owner, transaction hash, and mint date.
 */
export default function NFTDetailsCard({ nft, className = '' }: NFTDetailsCardProps) {
  const mintDate = new Date(nft.mintedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`rounded-xl p-5 ${className}`}
      style={{
        background: 'rgba(46, 204, 113, 0.08)',
        border: '1px solid rgba(46, 204, 113, 0.25)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs"
          style={{ background: 'rgba(46, 204, 113, 0.2)' }}
        >
          ✓
        </div>
        <span className="text-sm font-pixel text-[var(--color-mi-grass)] tracking-wider uppercase">
          Minted On-Chain
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        {/* Token ID & Collection */}
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Token ID</span>
          <span className="text-white font-mono">
            #{nft.itemId}
            <span className="text-slate-500 ml-1 text-xs">
              (Collection {nft.collectionId})
            </span>
          </span>
        </div>

        {/* Owner Address */}
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Owner</span>
          <div className="flex items-center">
            <span className="text-[var(--mi-mint)] font-mono">
              {formatAddress(nft.ownerAddress)}
            </span>
            <CopyButton text={nft.ownerAddress} label="address" />
          </div>
        </div>

        {/* Transaction Hash */}
        {nft.txHash && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Tx Hash</span>
            <div className="flex items-center">
              <span className="text-slate-300 font-mono text-xs">
                {formatHash(nft.txHash)}
              </span>
              <CopyButton text={nft.txHash} label="transaction hash" />
            </div>
          </div>
        )}

        {/* Minted Date */}
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Minted</span>
          <span className="text-slate-300">
            {mintDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Explorer Link */}
      {nft.txHash && (
        <a
          href={getExplorerUrl(nft.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-pixel uppercase tracking-wider transition-all hover:bg-white/10"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--mi-mint)',
          }}
        >
          <span>View on Explorer</span>
          <ExternalLink size={12} />
        </a>
      )}
    </motion.div>
  );
}
