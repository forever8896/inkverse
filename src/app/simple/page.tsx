import { getSimpleChapterById } from "@/lib/simplified-chapters";
import SimpleLab from "@/components/SimpleLab";

export default function SimplePage() {
  const chapter = getSimpleChapterById(1);
  
  if (!chapter) {
    return <div>Chapter not found</div>;
  }

  return <SimpleLab chapter={chapter} />;
} 