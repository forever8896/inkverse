/**
 * useNFTCapture - Hook for capturing creature display as NFT image
 *
 * Extracted from LessonLayout.tsx to improve modularity.
 * Handles canvas rendering, shutter animation, and API upload.
 */

import { useState, useCallback, RefObject } from 'react';

interface Toast {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface UseNFTCaptureOptions {
  /** Ref to the DOM element containing the creature display */
  creatureDisplayRef: RefObject<HTMLDivElement | null>;
  /** Toast notification callback */
  addToast: (toast: Toast) => void;
}

interface UseNFTCaptureReturn {
  /** Trigger the NFT capture process */
  captureNFT: () => Promise<void>;
  /** Whether capture is currently in progress */
  isCapturing: boolean;
  /** Whether to show the camera shutter animation */
  showShutter: boolean;
  /** Whether to show the success overlay */
  showSuccess: boolean;
}

/**
 * Hook for capturing creature display as an NFT image.
 *
 * Creates a 1024x1024 PNG from the creature display element,
 * uploads it to the server, and provides UI state for animations.
 *
 * @example
 * ```tsx
 * const { captureNFT, isCapturing, showShutter, showSuccess } = useNFTCapture({
 *   creatureDisplayRef,
 *   addToast
 * });
 * ```
 */
export function useNFTCapture({
  creatureDisplayRef,
  addToast,
}: UseNFTCaptureOptions): UseNFTCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const captureNFT = useCallback(async () => {
    if (!creatureDisplayRef.current) return;

    setIsCapturing(true);
    setShowShutter(true);

    // Shutter effect timing
    setTimeout(() => setShowShutter(false), 800);

    try {
      // Create a new canvas for the NFT with square dimensions
      const nftCanvas = document.createElement('canvas');
      const nftSize = 1024;
      nftCanvas.width = nftSize;
      nftCanvas.height = nftSize;

      const ctx = nftCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context');
      }

      // Fill background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, nftSize);
      gradient.addColorStop(0, '#1e293b'); // slate-800
      gradient.addColorStop(1, '#0f172a'); // slate-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, nftSize, nftSize);

      // Get creature element
      const creatureElement = creatureDisplayRef.current.querySelector('img, span');
      if (creatureElement) {
        if (creatureElement.tagName === 'IMG') {
          // Handle image elements
          const img = creatureElement as HTMLImageElement;
          await new Promise((resolve) => {
            if (img.complete) {
              resolve(undefined);
            } else {
              img.onload = () => resolve(undefined);
            }
          });

          // Draw the creature image centered with padding
          const padding = nftSize * 0.1;
          const targetSize = nftSize - padding * 2;

          ctx.drawImage(
            img,
            padding,
            padding,
            targetSize,
            targetSize
          );
        } else {
          // Handle emoji/text elements
          const span = creatureElement as HTMLSpanElement;
          const fontSize = nftSize * 0.4; // 40% of canvas size
          ctx.font = `${fontSize}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = window.getComputedStyle(span).color || '#ffffff';

          // Apply any filters if present
          const filter = window.getComputedStyle(span).filter;
          if (filter && filter !== 'none') {
            ctx.filter = filter;
          }

          ctx.fillText(
            span.textContent || '🔬',
            nftSize / 2,
            nftSize / 2
          );
        }
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        nftCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob'));
        }, 'image/png');
      });

      // Send to backend
      const formData = new FormData();
      formData.append('image', blob, 'creature-nft.png');

      const response = await fetch('/api/nft-snapshot', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Show success overlay
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        addToast({
          type: 'success',
          title: '📸 NFT Created!',
          message: 'Your creature has been captured successfully',
        });
      } else {
        throw new Error(result.error || 'Failed to save NFT');
      }
    } catch (error) {
      console.error('Error creating NFT:', error);
      addToast({
        type: 'error',
        title: '❌ Capture Failed',
        message: 'Failed to create NFT snapshot. Please try again.',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [creatureDisplayRef, addToast]);

  return {
    captureNFT,
    isCapturing,
    showShutter,
    showSuccess,
  };
}
