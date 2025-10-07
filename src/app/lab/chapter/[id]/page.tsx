import { notFound } from 'next/navigation';
import LessonLayout from '@/components/LessonLayout';
import { getLessonById } from '@/lib/lessons-server';
import { getServerSession, validateLessonAccess } from '@/lib/auth-server';

interface ChapterPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params;
  const chapterId = parseInt(id);

  if (isNaN(chapterId) || chapterId < 1) {
    notFound();
  }

  // Use the same lesson data for both lessons and lab chapters
  const lesson = getLessonById(chapterId);

  if (!lesson) {
    notFound();
  }

  // Check authentication requirements for any lesson steps
  try {
    const session = await getServerSession();

    // Check if lesson has chapters (new format) or steps (old format)
    const allSteps = lesson.chapters
      ? lesson.chapters.flatMap(chapter => chapter.steps)
      : lesson.steps;

    const hasAuthSteps = allSteps?.some(step => step.requiresAuth);

    if (hasAuthSteps) {
      const authResult = await validateLessonAccess(
        { requiresAuth: true },
        session
      );

      if (!authResult.allowed) {
        // Pass auth info to the client component to handle the modal
        return <LessonLayout lesson={lesson} authRequired={true} authError={authResult.error} />;
      }
    }
  } catch (error) {
    console.error('[Auth] Server-side auth check failed:', error);
    // Continue with client-side auth for now
  }

  // Always render LessonLayout, even with undefined lesson for empty state
  return <LessonLayout lesson={lesson} />;
}
