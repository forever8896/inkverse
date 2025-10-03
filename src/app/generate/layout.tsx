import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';

interface GenerateLayoutProps {
  children: ReactNode;
  params: {
    jobId?: string;
  };
}

export default async function GenerateLayout({ children, params }: GenerateLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    const redirectTarget = params?.jobId ? `/generate/${params.jobId}` : '/generate';
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  return <>{children}</>;
}
