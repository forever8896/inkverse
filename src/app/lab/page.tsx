import LabClient from '@/components/LabClient';
import { getAllLessons } from '@/lib/lessons-server';

// Force dynamic rendering - this page shows user-specific data (progress, NFT, wallet)
export const dynamic = 'force-dynamic';

export default function LabPage() {
  const chapters = getAllLessons();
  return <LabClient chapters={chapters} />;
}
