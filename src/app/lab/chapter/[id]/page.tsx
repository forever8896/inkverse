import { notFound } from "next/navigation";
import SimpleLab from "@/components/SimpleLab";
import { getSimpleChapterById } from "@/lib/simplified-chapters";

interface ChapterPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params;
  const chapterId = parseInt(id);
  
  if (isNaN(chapterId) || chapterId < 1 || chapterId > 6) {
    notFound();
  }

  const chapter = getSimpleChapterById(chapterId);
  
  if (!chapter) {
    notFound();
  }

  return <SimpleLab chapter={chapter} />;
} 