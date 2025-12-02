import { notFound } from 'next/navigation';
import LessonLayout from '@/components/LessonLayout';
import { getLessonById } from '@/lib/lessons-server';
import { getServerSession, validateLessonAccess } from '@/lib/auth-server';

interface LessonPageProps {
  params: Promise<{
    lessonId: string;
    chapterId: string;
    stepId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId, chapterId, stepId } = await params;
  const lessonIdNum = parseInt(lessonId);
  const chapterNum = parseInt(chapterId);
  const stepNum = parseInt(stepId);

  // Validate all params are valid numbers >= 1
  if (isNaN(lessonIdNum) || lessonIdNum < 1 ||
      isNaN(chapterNum) || chapterNum < 1 ||
      isNaN(stepNum) || stepNum < 1) {
    notFound();
  }

  // Load the lesson
  const lesson = getLessonById(lessonIdNum);

  if (!lesson) {
    notFound();
  }

  // Validate chapter exists
  if (!lesson.chapters || chapterNum > lesson.chapters.length) {
    notFound();
  }

  // Validate step exists in chapter
  const chapter = lesson.chapters[chapterNum - 1];
  if (!chapter || stepNum > chapter.steps.length) {
    notFound();
  }

  // Check authentication requirements for any lesson steps
  try {
    const session = await getServerSession();

    // Check if any steps in any chapter require auth
    const hasAuthSteps = lesson.chapters?.some(ch =>
      ch.steps.some(step => step.requiresAuth)
    );

    if (hasAuthSteps) {
      const authResult = await validateLessonAccess(
        { requiresAuth: true },
        session
      );

      if (!authResult.allowed) {
        return (
          <LessonLayout
            lesson={lesson}
            authRequired={true}
            authError={authResult.error}
            initialChapter={chapterNum}
            initialStep={stepNum}
          />
        );
      }
    }
  } catch (error) {
    console.error('[Auth] Server-side auth check failed:', error);
  }

  return (
    <LessonLayout
      lesson={lesson}
      initialChapter={chapterNum}
      initialStep={stepNum}
    />
  );
}
