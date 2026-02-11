import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import route handlers
import { GET as listGET } from '../lessons/list/route';
import { GET as lessonGET } from '../lessons/[id]/route';

describe('GET /api/lessons/list', () => {
  it('returns a list of lessons', async () => {
    const response = await listGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.lessons)).toBe(true);
    expect(body.lessons.length).toBeGreaterThan(0);
  });

  it('each lesson has id, title, and filename', async () => {
    const response = await listGET();
    const body = await response.json();

    for (const lesson of body.lessons) {
      expect(lesson.id).toBeDefined();
      expect(typeof lesson.title).toBe('string');
      expect(lesson.filename).toMatch(/\.json$/);
    }
  });
});

describe('GET /api/lessons/[id]', () => {
  it('returns lesson content for valid id', async () => {
    // Lesson 1 should always exist
    const request = new Request('http://localhost/api/lessons/1');
    const response = await lessonGET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.lesson).toBeDefined();
    expect(body.lesson.id).toBe(1);
    expect(body.lesson.title).toBeDefined();
    expect(body.lesson.chapters).toBeDefined();
  });

  it('returns 404 for non-existent lesson', async () => {
    const request = new Request('http://localhost/api/lessons/9999');
    const response = await lessonGET(request, { params: Promise.resolve({ id: '9999' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toContain('not found');
  });

  it('lesson has required structure', async () => {
    const request = new Request('http://localhost/api/lessons/1');
    const response = await lessonGET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    const lesson = body.lesson;
    expect(lesson.title).toBeDefined();
    expect(lesson.description).toBeDefined();
    expect(Array.isArray(lesson.chapters)).toBe(true);
    expect(lesson.chapters.length).toBeGreaterThan(0);

    // Each chapter should have steps
    for (const chapter of lesson.chapters) {
      expect(chapter.title).toBeDefined();
      expect(Array.isArray(chapter.steps)).toBe(true);
      expect(chapter.steps.length).toBeGreaterThan(0);
    }
  });
});
