'use client';

/**
 * Squink - Animated character that displays compilation feedback
 *
 * Features:
 * - Slides up from bottom center when showing feedback
 * - Speech bubble displays error or success messages
 * - Playful, alive feeling with subtle animations
 * - Random success messages for variety
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CompilationError } from '@/hooks/useCodeCompilation';

// Random success messages for variety
const SUCCESS_MESSAGES = [
  "LGTM!",
  "Marvelous work!",
  "The ink! is satisfactory",
  "Perfectly brewed!",
  "Exquisite code!",
  "Splendid work!",
  "Nailed it!",
  "A masterpiece!",
  "Beautifully written!",
  "Chef's kiss!",
  "Superb ink!",
  "Flawless execution!",
];

interface SquinkProps {
  errors: CompilationError[];
  isSuccess?: boolean;
  onDismiss?: () => void;
}

export function Squink({ errors, isSuccess = false, onDismiss }: SquinkProps) {
  const hasErrors = errors.length > 0;
  const [successMessage, setSuccessMessage] = useState('');

  // Pick a random success message when success state changes
  useEffect(() => {
    if (isSuccess) {
      const randomIndex = Math.floor(Math.random() * SUCCESS_MESSAGES.length);
      setSuccessMessage(SUCCESS_MESSAGES[randomIndex]);
    }
  }, [isSuccess]);

  // Format the error message for display
  const formatErrorMessage = (error: CompilationError): string => {
    let message = error.message;

    // Truncate long messages
    if (message.length > 150) {
      message = message.slice(0, 147) + '...';
    }

    return message;
  };

  // Get location string if available
  const getLocationString = (error: CompilationError): string | null => {
    if (!error.location) return null;
    return `Line ${error.location.line}${error.location.column ? `:${error.location.column}` : ''}`;
  };

  const shouldShow = hasErrors || isSuccess;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto"
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
            mass: 0.8
          }}
        >
          {/* Speech Bubble */}
          <motion.div
            className="relative mb-2 max-w-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {/* Bubble Content - Error State */}
            {hasErrors && (() => {
              // Find the most relevant error (skip generic "could not compile" messages)
              const relevantError = errors.find(e =>
                e.code || // Has an error code = specific error
                e.location?.line || // Has line info = specific location
                !e.message.toLowerCase().includes('could not compile')
              ) || errors[0];

              return (
                <div className="bg-gradient-to-br from-red-500/90 to-rose-600/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-red-400/30">
                  {/* Error Code Badge */}
                  {relevantError.code && (
                    <span className="inline-block px-2 py-0.5 bg-red-900/50 rounded text-[10px] font-mono text-red-200 mb-1">
                      {relevantError.code}
                    </span>
                  )}

                  {/* Error Message */}
                  <p className="text-white text-sm font-medium leading-tight">
                    {formatErrorMessage(relevantError)}
                  </p>

                  {/* Location */}
                  {getLocationString(relevantError) && (
                    <p className="text-red-200 text-xs mt-1 font-mono">
                      {getLocationString(relevantError)}
                    </p>
                  )}

                  {/* Multiple errors indicator */}
                  {errors.length > 1 && (
                    <p className="text-red-200 text-xs mt-2 opacity-70">
                      +{errors.length - 1} more issue{errors.length > 2 ? 's' : ''}
                    </p>
                  )}

                  {/* Dismiss button */}
                  {onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-600/50"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Bubble Content - Success State */}
            {isSuccess && !hasErrors && (
              <div className="bg-gradient-to-br from-emerald-500/90 to-green-600/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-xl border border-emerald-400/30">
                {/* Success Message */}
                <p className="text-white text-sm font-bold leading-tight text-center">
                  {successMessage}
                </p>

                {/* Dismiss button */}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-600/50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className={`w-4 h-4 rotate-45 border-r border-b ${
                hasErrors
                  ? 'bg-gradient-to-br from-red-500/90 to-rose-600/90 border-red-400/30'
                  : 'bg-gradient-to-br from-emerald-500/90 to-green-600/90 border-emerald-400/30'
              }`} />
            </div>
          </motion.div>

          {/* Squink Character */}
          <motion.div
            className="relative cursor-pointer"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, type: 'spring', damping: 15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
          >
            {/* Bounce animation - more excited for success */}
            <motion.div
              animate={{
                y: isSuccess ? [0, -8, 0] : [0, -4, 0],
                rotate: isSuccess ? [0, -3, 3, 0] : 0,
              }}
              transition={{
                duration: isSuccess ? 1.5 : 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* Glow effect behind squink - green for success */}
              <div className={`absolute inset-0 blur-xl rounded-full scale-75 ${
                hasErrors ? 'bg-purple-500/30' : 'bg-emerald-500/40'
              }`} />

              {/* The Squink */}
              <Image
                src="/ink-squink.svg"
                alt="Squink"
                width={80}
                height={120}
                className={`relative ${
                  hasErrors
                    ? 'drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                }`}
                priority
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export with the old name for backwards compatibility
export { Squink as ErrorSquink };
