import React from 'react';

interface LessonContentProps {
  html: string;
}

/**
 * LessonContent - Renders lesson step content with consistent styling
 *
 * Supported content components (use simple HTML, styling is automatic):
 *
 * - <h1>Title</h1> - Main heading
 * - <h2>Section</h2> - Section heading
 * - <h3>Subsection</h3> - Subsection heading
 * - <p>Text</p> - Paragraph
 * - <ul><li>Item</li></ul> - Unordered list
 * - <ol><li>Item</li></ol> - Ordered list
 * - <code>code</code> - Inline code
 * - <strong>bold</strong> - Bold text
 * - <em>italic</em> - Italic text
 * - <a href="...">link</a> - External link
 *
 * Special components (use data-component attribute):
 *
 * - <div data-component="info-box">Content</div> - Info box (gray)
 * - <div data-component="success-box">Content</div> - Success box (green)
 * - <div data-component="warning-box">Content</div> - Warning box (orange)
 * - <div data-component="highlight-box">Content</div> - Highlight box (purple)
 * - <div data-component="code-block">Code example</div> - Code block
 * - <table>...</table> - Tables (auto-styled)
 */
export default function LessonContent({ html }: LessonContentProps) {
  return (
    <div
      className="lesson-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
