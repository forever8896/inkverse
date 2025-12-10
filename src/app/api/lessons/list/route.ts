import fs from 'fs';
import path from 'path';
import { successResponse, internalErrorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const lessonsDir = path.join(process.cwd(), 'src/content/lessons');
    const files = fs.readdirSync(lessonsDir);

    const lessons = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const lessonPath = path.join(lessonsDir, file);
        const content = fs.readFileSync(lessonPath, 'utf-8');
        const lesson = JSON.parse(content);

        return {
          id: lesson.id,
          title: lesson.title,
          filename: file,
        };
      });

    return successResponse({ lessons });
  } catch (error) {
    return internalErrorResponse(error, 'Failed to load lessons');
  }
}
