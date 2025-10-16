#!/usr/bin/env node
/**
 * Migrate Lesson Inline Styles to Data Components
 *
 * This script converts inline style attributes to data-component attributes
 * for consistent, maintainable lesson styling.
 */

const fs = require('fs');
const path = require('path');

const LESSON_PATH = path.join(__dirname, '../src/content/lessons/1.json');

// Style pattern mappings
const STYLE_MAPPINGS = [
  {
    // Info boxes and code snippets with monospace
    pattern: /style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: (12|16)px; margin: (12|16)px 0;(?: font-family: monospace; font-size: 14px;)?"/g,
    getRepl: (match) => {
      if (match.includes('monospace')) {
        return 'data-component="code-snippet"';
      }
      return 'data-component="info-box"';
    }
  },
  {
    // Nested code blocks (dark)
    pattern: /style="background: #0f172a; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 14px;(?: margin-top: 8px;)?"/g,
    replacement: 'data-component="nested-code"'
  },
  {
    // Success/green boxes
    pattern: /style="background: #059669; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;"/g,
    replacement: 'data-component="success-box"'
  },
  {
    // Highlight/purple boxes
    pattern: /style="background: #7c3aed; border: 1px solid #a78bfa; border-radius: 8px; padding: 16px; margin: 16px 0; color: white;"/g,
    replacement: 'data-component="highlight-box"'
  },
  {
    // Remove inline link colors (handled by CSS)
    pattern: / style="color: #60a5fa;"/g,
    replacement: ''
  },
  {
    // Remove table inline styles (handled by CSS)
    pattern: / style="width: 100%; border-collapse: collapse; margin: 16px 0;"/g,
    replacement: ''
  },
  {
    // Remove table row background
    pattern: / style="background: #1e293b;"/g,
    replacement: ''
  },
  {
    // Remove table cell padding
    pattern: / style="padding: 8px; border: 1px solid #475569;"/g,
    replacement: ''
  }
];

function migrateLessonContent(content) {
  let migrated = content;
  let changesCount = 0;

  STYLE_MAPPINGS.forEach(mapping => {
    if (mapping.getRepl) {
      // Custom replacement function
      migrated = migrated.replace(mapping.pattern, (match) => {
        changesCount++;
        return mapping.getRepl(match);
      });
    } else {
      // Simple string replacement
      const matches = migrated.match(mapping.pattern);
      if (matches) {
        changesCount += matches.length;
      }
      migrated = migrated.replace(mapping.pattern, mapping.replacement);
    }
  });

  return { migrated, changesCount };
}

function main() {
  console.log('🔄 Starting Lesson Style Migration...\n');

  // Read lesson file
  console.log(`📖 Reading: ${LESSON_PATH}`);
  const lessonContent = fs.readFileSync(LESSON_PATH, 'utf-8');

  // Parse JSON
  let lesson;
  try {
    lesson = JSON.parse(lessonContent);
  } catch (error) {
    console.error('❌ Failed to parse JSON:', error.message);
    process.exit(1);
  }

  console.log(`✅ Loaded Lesson ${lesson.id}: "${lesson.title}"\n`);

  // Migrate each step
  let totalChanges = 0;
  let stepsModified = 0;

  lesson.chapters.forEach((chapter, chapterIndex) => {
    chapter.steps.forEach((step, stepIndex) => {
      if (step.content) {
        const { migrated, changesCount } = migrateLessonContent(step.content);

        if (changesCount > 0) {
          step.content = migrated;
          stepsModified++;
          totalChanges += changesCount;
          console.log(`  ✏️  Chapter ${chapterIndex}, Step ${stepIndex + 1}: ${changesCount} changes`);
        }
      }
    });
  });

  if (totalChanges === 0) {
    console.log('\n✨ No changes needed - lesson already using data-components!');
    return;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Steps modified: ${stepsModified}`);
  console.log(`   - Total replacements: ${totalChanges}`);

  // Create backup
  const backupPath = LESSON_PATH.replace('.json', '.backup.json');
  console.log(`\n💾 Creating backup: ${backupPath}`);
  fs.writeFileSync(backupPath, lessonContent);

  // Write migrated content
  console.log(`💾 Writing migrated content: ${LESSON_PATH}`);
  fs.writeFileSync(LESSON_PATH, JSON.stringify(lesson, null, 2));

  console.log('\n✅ Migration complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review changes: git diff src/content/lessons/1.json');
  console.log('   2. Test in the lesson editor');
  console.log('   3. Delete backup if everything looks good: rm src/content/lessons/1.backup.json');
}

// Run migration
try {
  main();
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
