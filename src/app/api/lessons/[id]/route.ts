import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lessonPath = path.join(process.cwd(), 'src/content/lessons', `${id}.json`);

    if (!fs.existsSync(lessonPath)) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const content = fs.readFileSync(lessonPath, 'utf-8');
    const lesson = JSON.parse(content);

    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load lesson' }, { status: 500 });
  }
}
