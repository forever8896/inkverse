import fs from 'fs';
import path from 'path';
import { successResponse, notFoundResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lessonPath = path.join(process.cwd(), 'src/content/lessons', `${id}.json`);

    if (!fs.existsSync(lessonPath)) {
      return notFoundResponse('Lesson');
    }

    const content = fs.readFileSync(lessonPath, 'utf-8');
    const lesson = JSON.parse(content);

    return successResponse({ lesson });
  } catch (error) {
    logError('Lessons API', error);
    return internalErrorResponse(error, 'Failed to load lesson');
  }
}
