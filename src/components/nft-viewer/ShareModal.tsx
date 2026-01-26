'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
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

const COLORS = {
  mint: '#4FFFB0',
  peach: '#FFDAB9',
  violet: '#240B4D',
};

/**
 * Share modal with URL copy.
 */
export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  monsterName = 'Monster',
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

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
          border: '1px solid rgba(79, 255, 176, 0.15)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-white uppercase tracking-wider">
            Share Monster
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* URL Display */}
          <div
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <p className="text-xs font-mono break-all" style={{ color: 'rgba(255, 218, 185, 0.7)' }}>
              {shareUrl}
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-pixel text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
            style={{
              background: copied
                ? `${COLORS.mint}33`
                : `${COLORS.mint}1A`,
              border: `1px solid ${copied ? COLORS.mint : `${COLORS.mint}4D`}`,
              color: COLORS.mint,
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
