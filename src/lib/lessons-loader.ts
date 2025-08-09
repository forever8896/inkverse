import fs from 'node:fs';
import path from 'node:path';
import { Lesson } from './lesson-types';

// Server-only: read JSON files directly from disk
const lessonsDir = path.join(process.cwd(), 'src', 'content', 'lessons');

function loadLessonsFromDisk(): Lesson[] {
  if (!fs.existsSync(lessonsDir)) return [];
  const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));
  const parsed = files.map((file) => {
    const full = path.join(lessonsDir, file);
    const raw = fs.readFileSync(full, 'utf-8');
    return JSON.parse(raw) as Lesson;
  });
  return parsed.sort((a, b) => a.id - b.id);
}

const lessons: Lesson[] = loadLessonsFromDisk();

export function getAllLessons(): Lesson[] {
  return lessons;
}

export function getLessonById(id: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getNextLesson(currentId: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === currentId + 1);
}

export function getPreviousLesson(currentId: number): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === currentId - 1);
}
