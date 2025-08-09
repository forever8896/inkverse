import LessonLayout from '@/components/LessonLayout';
import { getLessonById } from '@/lib/lessons-server';

export default function SimplePage() {
  // Use the first lesson as the simple page content
  const lesson = getLessonById(1);

  return <LessonLayout lesson={lesson} />;
}
