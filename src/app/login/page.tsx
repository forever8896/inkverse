'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import GitHubAuthModal from '@/components/GitHubAuthModal';

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  // If already logged in, redirect to home
  useEffect(() => {
    if (session?.user) {
      router.push('/');
    }
  }, [session, router]);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <GitHubAuthModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}