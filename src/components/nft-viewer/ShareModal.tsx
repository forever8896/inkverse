'use client';

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  monsterName?: string;
}

/**
 * Share modal with URL copy and social media buttons.
 */
export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  monsterName = 'Monster',
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Share text for social media
  const shareText = `Check out my Monsters Ink! creature! I created this while learning ink! smart contracts on Polkadot.`;
  const hashtags = 'MonstersInk,Polkadot,ink,Web3Education';

  // Social share URLs
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  // Copy URL handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: 'linear-gradient(180deg, #1a0a3a 0%, #0f0520 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-white uppercase tracking-wider">
            Share Your Monster
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div
            className="p-4 rounded-lg text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <p className="text-slate-300 text-sm mb-2">{monsterName}</p>
            <p className="text-[10px] text-slate-500 font-mono break-all">
              {shareUrl}
            </p>
          </div>

          {/* Copy URL Button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
            style={{
              background: copied
                ? 'rgba(79, 255, 176, 0.2)'
                : 'var(--mi-cobalt)',
              border: copied
                ? '1px solid rgba(79, 255, 176, 0.4)'
                : '1px solid transparent',
              color: copied ? 'var(--mi-mint)' : 'white',
            }}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or share via</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Twitter/X */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(29, 161, 242, 0.15)',
                border: '1px solid rgba(29, 161, 242, 0.3)',
                color: '#1DA1F2',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </a>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(0, 136, 204, 0.15)',
                border: '1px solid rgba(0, 136, 204, 0.3)',
                color: '#0088CC',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
