import { notFound } from "next/navigation";
import LessonLayout from "@/components/LessonLayout";
import { getLessonById } from "@/lib/lessons";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const lessonId = parseInt(id);
  
  if (isNaN(lessonId) || lessonId < 1) {
    notFound();
  }

  const lesson = getLessonById(lessonId);
  
  // Always render LessonLayout, even with undefined lesson for empty state
  return <LessonLayout lesson={lesson} />;
} 