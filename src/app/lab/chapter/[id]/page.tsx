import { notFound } from "next/navigation";
import LessonLayout from "@/components/LessonLayout";
import { getLessonById } from "@/lib/lessons";

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
  
  // Always render LessonLayout, even with undefined lesson for empty state
  return <LessonLayout lesson={lesson} />;
} 