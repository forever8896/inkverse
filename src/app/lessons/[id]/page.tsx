import { notFound } from "next/navigation";
import LessonLayout from "@/components/LessonLayout";
import { getLessonById } from "@/lib/lessons";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const lessonId = parseInt(id);
  
  if (isNaN(lessonId) || lessonId < 1 || lessonId > 8) {
    notFound();
  }

  const lesson = getLessonById(lessonId);
  
  if (!lesson) {
    notFound();
  }

  return <LessonLayout lesson={lesson} />;
} 