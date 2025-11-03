import { LessonEditorErrorBoundary } from '@/components/LessonEditorErrorBoundary';
import { ReactNode } from 'react';

export default function LessonEditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LessonEditorErrorBoundary>
      {children}
    </LessonEditorErrorBoundary>
  );
}
