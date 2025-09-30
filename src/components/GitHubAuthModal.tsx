'use client';

import { useState } from 'react';
import { signIn, useSession } from '@/lib/auth-client';
import { Github, Loader2, X, Shield, Zap, Users } from 'lucide-react';

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function GitHubAuthModal({ isOpen, onClose, onAuthSuccess }: GitHubAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // If user is already authenticated, call success callback
  if (session?.user && isOpen) {
    setTimeout(onAuthSuccess, 0);
    return null;
  }

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'github',
        callbackURL: window.location.href, // Stay on current page after auth
      });
      // The signIn will redirect, so we don't need to handle success here
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-700/50">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You must login to continue
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            To protect our AI generation resources and ensure fair usage, please authenticate with GitHub before proceeding to advanced lessons.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={16} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Unlock AI Generation</h3>
              <p className="text-slate-400 text-xs mt-1">Access monster creation and 3D model generation</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Fair Usage Protection</h3>
              <p className="text-slate-400 text-xs mt-1">One account = one NFT, preventing resource abuse</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-pink-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={16} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Secure & Private</h3>
              <p className="text-slate-400 text-xs mt-1">Only requires basic GitHub profile access</p>
            </div>
          </div>
        </div>

        {/* GitHub Sign In Button */}
        <button
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Github size={20} />
              <span>Continue with GitHub</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            By continuing, you agree to our authentication requirements.
            <br />
            We only access basic profile information.
          </p>
        </div>
      </div>
    </div>
  );
}