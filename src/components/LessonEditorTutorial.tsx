'use client';

import { useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
  waitForAction?: boolean; // If true, only advance when user performs action
  checkAction?: () => boolean; // Function to check if action was performed
  autoAdvance?: boolean; // Auto-advance to next step when action is completed
  noShadow?: boolean; // Don't show dark overlay (allow user to see everything)
  tooltipSize?: 'slim' | 'normal'; // Slim for tight spaces, normal for default
  forcePosition?: 'left-column' | 'right-column' | 'top-bar'; // Force specific layout positioning
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to the Lesson Editor!',
    description: 'This interactive tutorial will teach you how to create and edit lessons by walking through a real example. Let\'s start by loading an existing lesson!',
    targetSelector: '.lesson-editor-header',
    position: 'center',
  },
  {
    id: 'load-lesson',
    title: '📚 Step 1: Load an Example Lesson',
    description: 'Click on the dropdown below and select any lesson. We\'ll use it as an example to explore the editor.',
    targetSelector: '.lesson-selector',
    position: 'bottom',
    action: 'Select any lesson from the dropdown',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      const select = document.querySelector('.lesson-selector') as HTMLSelectElement;
      // Check if any lesson is selected (value is not empty and not the placeholder)
      return select?.value !== '' && select?.value !== undefined;
    },
  },
  {
    id: 'structure-panel',
    title: '📖 Lesson Loaded!',
    description: 'Great! The lesson structure appears on the left. You can see the lesson title, description, and difficulty. Below are the chapters that make up this lesson.',
    targetSelector: '.structure-panel',
    position: 'right',
  },
  {
    id: 'select-chapter',
    title: '📂 Step 2: Explore a Chapter',
    description: 'Now click on any chapter (the gray boxes) to expand it and see its steps. Try clicking on the first chapter!',
    targetSelector: '.chapters-list',
    position: 'right',
    action: 'Click on a chapter to expand it',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      // Check if any chapter steps are visible by looking for step buttons
      // More robust than checking for Tailwind class - looks for actual content structure
      const chaptersList = document.querySelector('.chapters-list');
      if (!chaptersList) return false;

      // Check if there are any buttons with "Add Step" text, which appears when chapter is expanded
      const addStepButton = Array.from(chaptersList.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('+ Add Step')
      );
      return addStepButton !== undefined;
    },
  },
  {
    id: 'view-steps',
    title: '🎯 Chapter Expanded!',
    description: 'Perfect! You can now see all the steps inside this chapter. Each step represents one screen the student will see during the lesson.',
    targetSelector: '.chapters-list',
    position: 'right',
  },
  {
    id: 'select-step',
    title: '✏️ Step 3: Edit a Step',
    description: 'Click on any step (the smaller cyan boxes) to open it in the editor. This will show you all the content and settings for that step.',
    targetSelector: '.chapters-list',
    position: 'right',
    action: 'Click on a step to edit it',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      const editor = document.querySelector('.editor-panel h2');
      return editor?.textContent?.includes('Edit Step:') || false;
    },
  },
  {
    id: 'editor-panel',
    title: '🎨 The Content Editor',
    description: 'This is where the magic happens! Here you can edit the step title, content (HTML), code examples, hints, and more.',
    targetSelector: '.editor-panel',
    position: 'left',
    tooltipSize: 'slim',
    forcePosition: 'left-column',
  },
  {
    id: 'component-palette',
    title: '🧩 Step 4: Component Palette',
    description: 'The right sidebar has pre-built styled elements. Scroll down and click "info-box" to insert an information callout into the current step\'s content.',
    targetSelector: '.component-palette',
    position: 'left',
    action: 'Click on "info-box" component',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      const textarea = document.querySelector('.editor-panel textarea') as HTMLTextAreaElement;
      return textarea?.value?.includes('data-component="info-box"') || false;
    },
  },
  {
    id: 'component-added',
    title: '✅ Component Added!',
    description: 'Excellent! You just added an info-box component to the lesson. Notice how it was added to the HTML content textarea. This is a pre-styled component that will look great in the preview.',
    targetSelector: '.editor-panel',
    position: 'left',
    tooltipSize: 'slim',
    forcePosition: 'left-column',
  },
  {
    id: 'preview-mode',
    title: '👁️ Step 5: Preview Mode',
    description: 'Click "PREVIEW MODE" at the top to see how your lesson looks to students.',
    targetSelector: '.preview-toggle',
    position: 'bottom',
    tooltipSize: 'slim',
    forcePosition: 'top-bar',
    action: 'Click "PREVIEW MODE"',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      const button = document.querySelector('.preview-toggle');
      return button?.textContent?.includes('EDIT MODE') || false;
    },
  },
  {
    id: 'preview-explanation',
    title: '🎨 Preview Active',
    description: 'Perfect! The left shows lesson content, right shows code. Notice the info-box you added is beautifully styled.',
    targetSelector: '.lesson-editor-header',
    position: 'right',
    tooltipSize: 'slim',
    forcePosition: 'left-column',
    noShadow: true,
  },
  {
    id: 'observe-styling',
    title: '✨ Styled Components',
    description: 'The info-box has proper spacing and colors. All use data-component attributes. Scroll through to see everything.',
    targetSelector: '.lesson-editor-header',
    position: 'right',
    tooltipSize: 'slim',
    forcePosition: 'left-column',
    noShadow: true,
  },
  {
    id: 'back-to-edit',
    title: '↩️ Back to Editing',
    description: 'Click "EDIT MODE" to return. Toggle between modes frequently to ensure your lesson looks perfect!',
    targetSelector: '.preview-toggle',
    position: 'bottom',
    tooltipSize: 'slim',
    forcePosition: 'top-bar',
    action: 'Click "EDIT MODE"',
    waitForAction: true,
    autoAdvance: true,
    checkAction: () => {
      const button = document.querySelector('.preview-toggle');
      return button?.textContent?.includes('PREVIEW MODE') || false;
    },
  },
  {
    id: 'other-components',
    title: '🎨 More Components',
    description: 'The palette has info-box (gray), success-box (green), warning-box (orange), highlight-box (purple), code-block, code-snippet, nested-code, and more! Each serves a specific educational purpose.',
    targetSelector: '.component-palette',
    position: 'left',
  },
  {
    id: 'export',
    title: '💾 Step 6: Export',
    description: 'When you\'re done editing, scroll down to the Export section and click "Generate JSON". This creates the lesson file that you\'ll save to src/content/lessons/[id].json',
    targetSelector: '.export-section',
    position: 'left',
  },
  {
    id: 'export-workflow',
    title: '📝 PR Workflow',
    description: 'After generating JSON: 1) Copy it to clipboard, 2) Save it to the correct file in the codebase, 3) Commit your changes, 4) Open a Pull Request. Maintainers can easily review the diff in GitHub!',
    targetSelector: '.export-section',
    position: 'left',
  },
  {
    id: 'complete',
    title: '🎉 You\'re Ready to Create!',
    description: 'You now know how to: load lessons, navigate chapters and steps, edit content, use components, preview changes, and export JSON files. Start creating amazing lessons for MonstersInk!',
    targetSelector: '.lesson-editor-header',
    position: 'center',
  },
];

interface LessonEditorTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function LessonEditorTutorial({ isActive, onComplete, onSkip }: LessonEditorTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [canAdvance, setCanAdvance] = useState(true);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // Check if user performed required action
  useEffect(() => {
    if (!isActive || !step.waitForAction || !step.checkAction) {
      setCanAdvance(true);
      return;
    }

    setCanAdvance(false);

    const checkInterval = setInterval(() => {
      if (step.checkAction && step.checkAction()) {
        setCanAdvance(true);
        clearInterval(checkInterval);

        // Auto-advance to next step after a brief delay
        if (step.autoAdvance) {
          setTimeout(() => {
            if (currentStep < TUTORIAL_STEPS.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }, 1000); // 1 second delay to show the "Done!" message
        }
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [currentStep, isActive, step]);

  // Update highlighted element and tooltip position
  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setHighlightedElement(element);

        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Adaptive tooltip sizing
        const tooltipWidth = step.tooltipSize === 'slim' ? 320 : 450;
        const tooltipHeight = step.tooltipSize === 'slim' ? 280 : 350;
        const margin = 20;
        const safeGap = 30; // Minimum gap between tooltip and highlighted element

        let top = 0;
        let left = 0;

        // Force specific positioning for layout-aware placement
        if (step.forcePosition) {
          switch (step.forcePosition) {
            case 'left-column':
              // Position in left sidebar area (col-span-3)
              left = margin;
              top = rect.top < margin ? margin : Math.min(rect.top, viewportHeight - tooltipHeight - margin);
              break;
            case 'right-column':
              // Position in right sidebar area (col-span-3)
              left = viewportWidth - tooltipWidth - margin;
              top = rect.top < margin ? margin : Math.min(rect.top, viewportHeight - tooltipHeight - margin);
              break;
            case 'top-bar':
              // Position below header bar
              left = Math.max(margin, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                viewportWidth - tooltipWidth - margin
              ));
              top = rect.bottom + margin;
              break;
          }
        } else if (step.position === 'center') {
          // Center on screen
          top = (viewportHeight - tooltipHeight) / 2;
          left = (viewportWidth - tooltipWidth) / 2;
        } else {
          // Calculate element size relative to viewport
          const elementWidthPercent = (rect.width / viewportWidth) * 100;
          const elementHeightPercent = (rect.height / viewportHeight) * 100;
          const isLargeElement = elementWidthPercent > 25 || elementHeightPercent > 40;

          if (isLargeElement) {
            // For large elements, use smart fixed positioning to avoid overlap
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;

            // Determine best quadrant for tooltip
            const isLeftSide = elementCenterX < viewportWidth / 2;
            const isTopSide = elementCenterY < viewportHeight / 2;

            if (step.position === 'right' || (isLeftSide && step.position !== 'left')) {
              // Place tooltip on the right side of screen, clear of the element
              left = Math.min(
                rect.right + safeGap,
                viewportWidth - tooltipWidth - margin
              );
              // Ensure it doesn't overlap by checking if there's enough room
              if (left < rect.right + safeGap) {
                // Not enough room on right, try far right
                left = viewportWidth - tooltipWidth - margin;
              }
              top = Math.max(margin, Math.min(rect.top, viewportHeight - tooltipHeight - margin));
            } else if (step.position === 'left' || !isLeftSide) {
              // Place tooltip on the left side of screen, clear of the element
              left = Math.max(margin, rect.left - tooltipWidth - safeGap);
              // Ensure it doesn't overlap
              if (left + tooltipWidth > rect.left - safeGap) {
                // Not enough room on left, use left edge
                left = margin;
              }
              top = Math.max(margin, Math.min(rect.top, viewportHeight - tooltipHeight - margin));
            } else if (step.position === 'bottom' || isTopSide) {
              // Place tooltip below element
              top = Math.min(rect.bottom + safeGap, viewportHeight - tooltipHeight - margin);
              left = Math.max(margin, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                viewportWidth - tooltipWidth - margin
              ));
            } else {
              // Place tooltip above element
              top = Math.max(margin, rect.top - tooltipHeight - safeGap);
              left = Math.max(margin, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                viewportWidth - tooltipWidth - margin
              ));
            }
          } else {
            // For small elements, use relative positioning
            switch (step.position) {
              case 'bottom':
                top = rect.bottom + margin;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
              case 'top':
                top = rect.top - tooltipHeight - margin;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
              case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - margin;
                break;
              case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + margin;
                break;
            }

            // Ensure tooltip stays on screen with margins
            if (top < margin) {
              top = rect.bottom + margin;
            }
            if (top + tooltipHeight > viewportHeight - margin) {
              top = Math.max(margin, viewportHeight - tooltipHeight - margin);
            }

            if (left < margin) {
              left = margin;
            }
            if (left + tooltipWidth > viewportWidth - margin) {
              left = viewportWidth - tooltipWidth - margin;
            }
          }

          // Final check: ensure tooltip doesn't overlap highlighted element
          const tooltipRect = {
            left,
            right: left + tooltipWidth,
            top,
            bottom: top + tooltipHeight,
          };

          const hasOverlap = !(
            tooltipRect.right < rect.left ||
            tooltipRect.left > rect.right ||
            tooltipRect.bottom < rect.top ||
            tooltipRect.top > rect.bottom
          );

          if (hasOverlap && !step.noShadow) {
            // If there's overlap, force tooltip to a safe corner
            const spaceOnRight = viewportWidth - rect.right;
            const spaceOnLeft = rect.left;

            if (spaceOnRight > tooltipWidth + margin * 2) {
              // Place on right edge
              left = viewportWidth - tooltipWidth - margin;
              top = margin;
            } else if (spaceOnLeft > tooltipWidth + margin * 2) {
              // Place on left edge
              left = margin;
              top = margin;
            } else {
              // Place at top center
              left = (viewportWidth - tooltipWidth) / 2;
              top = margin;
            }
          }
        }

        setTooltipPosition({ top, left });

        // Scroll element into view
        if (step.position !== 'center') {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    };

    updatePosition();

    // Update on resize/scroll
    const handleUpdate = () => requestAnimationFrame(updatePosition);
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [currentStep, isActive, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && canAdvance) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentStep, canAdvance, onSkip]);

  const handleNext = () => {
    if (!canAdvance) return;

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive) return null;

  const getHighlightStyle = () => {
    if (!highlightedElement) return {};
    const rect = highlightedElement.getBoundingClientRect();
    return {
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    };
  };

  return (
    <>
      {/* Dark overlay with SVG cutout - only show if not noShadow */}
      {!step.noShadow && highlightedElement && step.position !== 'center' && (
        <svg
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={getHighlightStyle().left}
                y={getHighlightStyle().top}
                width={getHighlightStyle().width}
                height={getHighlightStyle().height}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {/* Dark overlay for center position (no cutout) - only show if not noShadow */}
      {!step.noShadow && step.position === 'center' && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 pointer-events-none"
        />
      )}

      {/* Glowing border - show even with noShadow, but lighter */}
      {highlightedElement && step.position !== 'center' && (
        <div
          className="fixed z-[10000] pointer-events-none transition-all duration-500 ease-out"
          style={{
            ...getHighlightStyle(),
            background: 'transparent',
            border: step.noShadow
              ? '3px solid rgba(168, 85, 247, 0.5)'
              : '4px solid rgba(168, 85, 247, 0.9)',
            borderRadius: '12px',
            boxShadow: step.noShadow
              ? '0 0 15px 3px rgba(168, 85, 247, 0.4)'
              : `0 0 30px 6px rgba(168, 85, 247, 0.7),
                 inset 0 0 30px 4px rgba(168, 85, 247, 0.3)`,
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <div
        className="fixed z-[10002] transition-all duration-500 pointer-events-auto"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: step.tooltipSize === 'slim' ? '320px' : '450px',
        }}
      >
        <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500 rounded-xl shadow-2xl ${step.tooltipSize === 'slim' ? 'p-4' : 'p-6'}`}>
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-8 bg-purple-500'
                      : idx < currentStep
                      ? 'w-1.5 bg-purple-600'
                      : 'w-1.5 bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold mb-3 text-purple-300">
            {step.title}
          </h3>
          <p className="text-slate-300 mb-4 leading-relaxed">
            {step.description}
          </p>

          {step.action && (
            <div className={`mb-4 p-3 rounded-lg border ${
              canAdvance
                ? 'bg-emerald-900/20 border-emerald-500/30'
                : 'bg-cyan-900/20 border-cyan-500/30 animate-pulse'
            }`}>
              <p className="text-sm flex items-center gap-2">
                {canAdvance ? (
                  <>
                    <span className="text-emerald-300">✅</span>
                    <span className="text-emerald-300"><strong>Done!</strong> {step.action}</span>
                  </>
                ) : (
                  <>
                    <span className="text-cyan-300">👉</span>
                    <span className="text-cyan-300"><strong>Action:</strong> {step.action}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={onSkip}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Skip Tutorial
            </button>

            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  canAdvance
                    ? step.autoAdvance && step.waitForAction
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-purple-500/50'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLastStep
                  ? '✓ Finish'
                  : canAdvance && step.autoAdvance && step.waitForAction
                    ? '✅ Auto-advancing...'
                    : canAdvance
                      ? 'Next →'
                      : 'Waiting...'}
              </button>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 text-center">
            <span className="inline-flex items-center space-x-2">
              {currentStep > 0 && (
                <>
                  <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">←</kbd>
                  <span>back</span>
                  <span>•</span>
                </>
              )}
              {canAdvance && (
                <>
                  <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">→</kbd>
                  <span>next</span>
                  <span>•</span>
                </>
              )}
              <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600">ESC</kbd>
              <span>skip</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
