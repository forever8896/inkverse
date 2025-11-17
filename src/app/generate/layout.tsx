import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

interface GenerateLayoutProps {
  children: ReactNode;
  params: Promise<{
    jobId?: string;
  }>;
}

export default async function GenerateLayout({ children, params }: GenerateLayoutProps) {
  const session = await getServerSession();
  const resolvedParams = await params;

  if (!session) {
    const redirectTarget = resolvedParams?.jobId ? `/generate/${resolvedParams.jobId}` : '/generate';
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  return <>{children}</>;
}
