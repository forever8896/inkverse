'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import GitHubAuthModal from '@/components/GitHubAuthModal';

function LoginContent() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const redirectTarget = useMemo(() => {
    const redirectParam = searchParams?.get('redirect');

    if (!redirectParam) {
      return '/';
    }

    if (!redirectParam.startsWith('/') || redirectParam.startsWith('//')) {
      return '/';
    }

    if (redirectParam === '/login') {
      return '/';
    }

    return redirectParam;
  }, [searchParams]);

  const goToRedirectTarget = useCallback(() => {
    router.push(redirectTarget);
  }, [router, redirectTarget]);

  // If already logged in, redirect to requested destination
  useEffect(() => {
    if (session?.user) {
      goToRedirectTarget();
    }
  }, [session, goToRedirectTarget]);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  const handleAuthSuccess = () => {
    goToRedirectTarget();
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginContent />
    </Suspense>
  );
}
