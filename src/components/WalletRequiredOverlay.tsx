'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWallets, useWalletConnector, useAccounts, useConnectedWallets } from '@reactive-dot/react';

interface WalletRequiredOverlayProps {
  isOpen: boolean;
  onWalletConnected: (address: string) => void;
  onClose?: () => void;
}

export function WalletRequiredOverlay({ isOpen, onWalletConnected, onClose }: WalletRequiredOverlayProps) {
  const wallets = useWallets();
  const accounts = useAccounts();
  const connectedWallets = useConnectedWallets();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // useWalletConnector returns [state, connectFn] - reactive-dot catches errors internally
  const [connectState, connectWallet] = useWalletConnector();

  const handleConnect = async () => {
    if (wallets.length === 0) {
      setError('No wallets detected. Please install Talisman, SubWallet, or Polkadot.js extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // connectWallet's returned promise resolves even on failure (reactive-dot catches internally),
      // so we need to also check connectState after the call
      await connectWallet(wallets[0]);

      // Give a short delay for accounts to propagate through reactive-dot state
      await new Promise(resolve => setTimeout(resolve, 500));

      // If no accounts appeared after connection, the extension likely rejected
      if (!accounts || accounts.length === 0) {
        setError('Wallet connected but no accounts found. Please check your extension and ensure you have accounts.');
      }
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectAccount = (address: string) => {
    setSelectedAccount(address);
  };

  const handleConfirm = () => {
    if (selectedAccount) {
      onWalletConnected(selectedAccount);
    } else if (accounts && accounts.length > 0) {
      onWalletConnected(accounts[0].address);
    }
  };

  // If already connected and has accounts, show account selection
  const hasAccounts = accounts && accounts.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-slate-400 text-sm">
                Your monster will be minted as an NFT on Polkadot Asset Hub.
                Connect your wallet to receive ownership.
              </p>
            </div>

            {/* Content */}
            {!hasAccounts ? (
              // Not connected - show connect button
              <div className="space-y-4">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || wallets.length === 0}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                        <path d="M17 21v-8H7v8M7 3v5h8" />
                      </svg>
                      Connect Wallet
                    </>
                  )}
                </button>

                {wallets.length === 0 && (
                  <div className="text-center">
                    <p className="text-amber-400 text-sm mb-3">
                      No wallet extension detected
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      <a
                        href="https://talisman.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
                      >
                        Talisman
                      </a>
                      <a
                        href="https://subwallet.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
                      >
                        SubWallet
                      </a>
                      <a
                        href="https://polkadot.js.org/extension"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
                      >
                        Polkadot.js
                      </a>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
              </div>
            ) : (
              // Connected - show account selection
              <div className="space-y-4">
                <p className="text-slate-300 text-sm text-center mb-4">
                  Select an account to receive your NFT:
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.address}
                      onClick={() => handleSelectAccount(account.address)}
                      className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                        selectedAccount === account.address || (!selectedAccount && accounts[0].address === account.address)
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-medium truncate">
                        {account.name || 'Unnamed Account'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">
                        {account.address.slice(0, 8)}...{account.address.slice(-8)}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-200"
                >
                  Generate Monster & Mint NFT
                </button>
              </div>
            )}

            {/* Footer */}
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 w-full py-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            )}

            {/* Info */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                Your NFT will be minted on Paseo Asset Hub (testnet).
                No real funds required.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
