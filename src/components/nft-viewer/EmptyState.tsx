'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  ctaText?: string;
  ctaHref?: string;
}

/**
 * Empty state component shown when user has no minted NFT.
 * Features a mystery icon and call-to-action to start learning.
 */
export default function EmptyState({
  title = 'No Monster Yet',
  message = 'Complete your lessons to mint your first creature on-chain!',
  ctaText = 'Start Learning',
  ctaHref = '/lesson/1/1/1',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Mystery Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="relative">
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-3xl opacity-30"
            style={{
              background:
                'radial-gradient(circle, rgba(79, 255, 176, 0.4) 0%, transparent 70%)',
              width: 200,
              height: 200,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Mystery question mark */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 w-32 h-32 flex items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(79, 255, 176, 0.1)',
              border: '2px solid rgba(79, 255, 176, 0.2)',
            }}
          >
            <span
              className="text-7xl font-bold select-none"
              style={{
                color: 'rgba(79, 255, 176, 0.4)',
                textShadow: '0 0 20px rgba(79, 255, 176, 0.2)',
              }}
            >
              ?
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-pixel text-xl text-white mb-4 text-center uppercase tracking-wider"
      >
        {title}
      </motion.h2>

      {/* Message */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-slate-400 text-center max-w-sm mb-8"
      >
        {message}
      </motion.p>

      {/* CTA Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Link
          href={ctaHref}
          className="inline-block px-8 py-4 rounded-xl font-pixel text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105"
          style={{
            background: 'var(--mi-cobalt)',
            color: 'white',
            boxShadow: '0 0 30px rgba(30, 76, 221, 0.3)',
          }}
        >
          {ctaText}
        </Link>
      </motion.div>
    </div>
  );
}
