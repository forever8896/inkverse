import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 });
  }
}
