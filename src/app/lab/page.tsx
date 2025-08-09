import LabClient from '@/components/LabClient';
import { getAllLessons } from '@/lib/lessons-server';

export default function LabPage() {
  const chapters = getAllLessons();
  return <LabClient chapters={chapters} />;
}
