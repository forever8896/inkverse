'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface Monster2DDisplayProps {
  imageUrl: string | null;
  alt?: string;
  className?: string;
}

/**
 * 2D image display component for monsters without 3D models.
 * Features radial glow effect and loading skeleton.
 */
export default function Monster2DDisplay({
  imageUrl,
  alt = 'Monster',
  className = '',
}: Monster2DDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle no image URL
  if (!imageUrl) {
    return (
      <div
        className={`relative flex items-center justify-center aspect-square rounded-2xl ${className}`}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="text-center">
          <span className="text-6xl mb-4 block">🦖</span>
          <p className="text-slate-500 text-sm">Image unavailable</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <div
        className={`relative flex items-center justify-center aspect-square rounded-2xl ${className}`}
        style={{
          background: 'rgba(255, 100, 100, 0.05)',
          border: '1px solid rgba(255, 100, 100, 0.2)',
        }}
      >
        <div className="text-center">
          <span className="text-6xl mb-4 block">😢</span>
          <p className="text-red-400 text-sm">Failed to load image</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-pixel uppercase bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(79, 255, 176, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <div
              className="w-64 h-64 rounded-2xl"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Monster image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 0.95 : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className="max-w-full max-h-[500px] object-contain rounded-lg"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(79, 255, 176, 0.3))',
          }}
        />
      </motion.div>

      {/* Shimmer animation styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
