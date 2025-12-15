'use client';

import { WalletProviders } from '@/components/WalletProviders';
import { Toaster } from 'sonner';

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProviders>
      {children}
      <Toaster position="bottom-right" />
    </WalletProviders>
  );
}
