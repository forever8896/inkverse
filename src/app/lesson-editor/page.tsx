'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Lesson, Chapter, Step } from '@/lib/lesson-types';
import LessonContent from '@/components/LessonContent';
import CodeEditor from '@/components/CodeEditor';
import { CreatureStageDisplay } from '@/components/CreatureStageDisplay';
import LessonEditorTutorial from '@/components/LessonEditorTutorial';
import { validateLesson } from '@/lib/lesson-editor-validation';
import { useMonsterAsset } from '@/hooks/useMonsterAsset';
import { toast, Toaster } from 'sonner';
import '@/styles/lesson-content.css';

// Component palette for drag & drop
const COMPONENT_TEMPLATES = {
  'info-box': '<div data-component="info-box">\nYour info here\n</div>',
  'success-box': '<div data-component="success-box">\nSuccess message\n</div>',
  'warning-box': '<div data-component="warning-box">\nWarning message\n</div>',
  'highlight-box': '<div data-component="highlight-box">\nHighlighted content\n</div>',
  'code-block': '<div data-component="code-block">\nYour code here\n</div>',
  'code-snippet': '<div data-component="code-snippet">\n<code>your_inline_code();</code>\n</div>',
  'nested-code': '<div data-component="nested-code">\n<code>// Nested code block\nlet value = 42;</code>\n</div>',
  'heading-1': '<h1>Your Heading</h1>',
  'heading-2': '<h2>Section Heading</h2>',
  'paragraph': '<p>Your paragraph text here.</p>',
  'list': '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
  'code-inline': '<code>your_code</code>',
  'table': '<table>\n  <tr>\n    <th>Header 1</th>\n    <th>Header 2</th>\n  </tr>\n  <tr>\n    <td>Data 1</td>\n    <td>Data 2</td>\n  </tr>\n</table>',
};

export default function LessonEditorPage() {
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    id: 1,
    title: 'New Lesson',
    description: '',
    difficulty: 'Beginner',
    duration: '60 min',
    objectives: [],
    completed: false,
    locked: false,
  });

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [jsonOutput, setJsonOutput] = useState('');
  const [loadedJson, setLoadedJson] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [availableLessons, setAvailableLessons] = useState<Array<{ id: number; title: string; filename: string }>>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [recentlyAddedComponent, setRecentlyAddedComponent] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<{ name: string; template: string; rect: DOMRect } | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const { data: session } = authClient.useSession();
  const asset = useMonsterAsset(session?.user?.id, lesson.id || 0);

  // Load available lessons on mount
  useEffect(() => {
    fetch('/api/lessons/list')
      .then(res => res.json())
      .then(data => setAvailableLessons(data.lessons || []))
      .catch(err => {
        console.error('Failed to load lessons:', err);
        toast.error('Failed to load available lessons');
      });
  }, []);

  // Load selected lesson
  const loadExistingLesson = async (lessonId: string) => {
    if (!lessonId) return;

    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.lesson) {
        // Validate loaded data
        const validation = validateLesson(data.lesson);
        if (!validation.success) {
            toast.warning('Lesson loaded with validation issues', {
                description: 'Check console for details. You may need to fix some fields.',
                duration: 5000
            });
            console.warn('Lesson validation errors:', validation.errors);
        }

        setLesson({
          id: data.lesson.id,
          title: data.lesson.title,
          description: data.lesson.description,
          difficulty: data.lesson.difficulty,
          duration: data.lesson.duration,
          objectives: data.lesson.objectives,
          completed: data.lesson.completed,
          locked: data.lesson.locked,
          evolutionPath: data.lesson.evolutionPath,
        });
        setChapters(data.lesson.chapters || []);
        setSelectedChapter(null);
        setSelectedStep(null);
        setSelectedLessonId(lessonId);
        toast.success(`Loaded: ${data.lesson.title}`);
      } else {
        toast.error('Lesson data not found in response');
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
      toast.error('Failed to load lesson. Please try again.');
    }
  };

  // Add new chapter
  const addChapter = () => {
    const newChapter: Chapter = {
      id: chapters.length,
      lessonId: lesson.id || 1,
      title: 'New Chapter',
      description: '',
      order: chapters.length,
      concept: 'implementation',
      steps: [],
      estimatedTime: 10,
      requiresPreviousChapter: false,
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapter(newChapter.id);
  };

  // Add new step to selected chapter
  const addStep = () => {
    if (selectedChapter === null || selectedChapter < 0 || selectedChapter >= chapters.length) return;

    const chapter = chapters[selectedChapter];
    const newStep: Step = {
      id: chapter.steps.length + 1,
      chapterId: chapter.id,
      title: 'New Step',
      content: '<p>Step content here</p>',
      order: chapter.steps.length + 1,
    };

    const updatedChapters = [...chapters];
    updatedChapters[selectedChapter] = {
      ...updatedChapters[selectedChapter],
      steps: [...updatedChapters[selectedChapter].steps, newStep]
    };
    setChapters(updatedChapters);
    setSelectedStep(updatedChapters[selectedChapter].steps.length - 1);
  };

  // Update lesson field
  const updateLesson = (field: string, value: any) => {
    setLesson({ ...lesson, [field]: value });
  };

  // Update chapter field
  const updateChapter = (field: string, value: any) => {
    if (selectedChapter === null || selectedChapter < 0 || selectedChapter >= chapters.length) return;
    const updatedChapters = [...chapters];
    updatedChapters[selectedChapter] = { ...updatedChapters[selectedChapter], [field]: value };
    setChapters(updatedChapters);
  };

  // Update step field
  const updateStep = (field: string, value: any) => {
    if (selectedChapter === null || selectedStep === null) return;
    if (selectedChapter < 0 || selectedChapter >= chapters.length) return;
    if (selectedStep < 0 || selectedStep >= chapters[selectedChapter].steps.length) return;
    
    const updatedChapters = [...chapters];
    const chapterIndex = selectedChapter;
    const stepIndex = selectedStep;

    // Deep clone the path we are modifying
    const updatedChapter = { ...updatedChapters[chapterIndex] };
    const updatedSteps = [...updatedChapter.steps];
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      [field]: value,
    };

    updatedChapter.steps = updatedSteps;
    updatedChapters[chapterIndex] = updatedChapter;
    
    setChapters(updatedChapters);
  };

  // Update multiple step fields at once
  const updateStepFields = (updates: Record<string, any>) => {
    if (selectedChapter === null || selectedStep === null) return;
    if (selectedChapter < 0 || selectedChapter >= chapters.length) return;
    if (selectedStep < 0 || selectedStep >= chapters[selectedChapter].steps.length) return;
    
    const updatedChapters = [...chapters];
    const chapterIndex = selectedChapter;
    const stepIndex = selectedStep;

    const updatedChapter = { ...updatedChapters[chapterIndex] };
    const updatedSteps = [...updatedChapter.steps];
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      ...updates,
    };

    updatedChapter.steps = updatedSteps;
    updatedChapters[chapterIndex] = updatedChapter;
    
    setChapters(updatedChapters);
  };

  // Insert component template at cursor
  const insertComponent = (template: string, componentName: string) => {
    if (selectedChapter === null || selectedStep === null) return;
    const currentContent = chapters[selectedChapter].steps[selectedStep].content || '';
    updateStep('content', currentContent + '\n\n' + template);

    // Show feedback animation
    setRecentlyAddedComponent(componentName);
    setTimeout(() => setRecentlyAddedComponent(null), 1500);

    // Scroll the Content HTML textarea to bottom to show new content
    setTimeout(() => {
      const textarea = document.querySelector('.editor-panel textarea[rows="12"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
        textarea.focus();
      }
    }, 100);
  };

  // Generate JSON output with validation
  const generateJson = () => {
    const output = {
      ...lesson,
      chapters: chapters,
    };

    // Validate before generating
    const validation = validateLesson(output);

    if (!validation.success) {
      toast.error('Validation failed! Please fix the following errors:', {
        description: validation.errors?.slice(0, 3).map(e => `${e.field}: ${e.message}`).join('\n'),
        duration: 6000,
      });
      console.error('Validation errors:', validation.errors);
      return;
    }

    setJsonOutput(JSON.stringify(output, null, 2));
    toast.success('JSON generated successfully!', {
      description: 'Review the output and copy to clipboard when ready.',
    });
  };

  // Load JSON from input with validation
  const loadJson = () => {
    try {
      const parsed = JSON.parse(loadedJson);

      // Validate the parsed JSON
      const validation = validateLesson(parsed);

      if (!validation.success) {
        toast.error('Invalid lesson structure!', {
          description: validation.errors?.slice(0, 3).map(e => `${e.field}: ${e.message}`).join('\n'),
          duration: 6000,
        });
        console.error('Validation errors:', validation.errors);
        return;
      }

      setLesson({
        id: parsed.id,
        title: parsed.title,
        description: parsed.description,
        difficulty: parsed.difficulty,
        duration: parsed.duration,
        objectives: parsed.objectives,
        completed: parsed.completed,
        locked: parsed.locked,
        evolutionPath: parsed.evolutionPath,
      });
      setChapters(parsed.chapters || []);
      setSelectedChapter(null);
      setSelectedStep(null);
      setLoadedJson(''); // Clear input after successful load
      toast.success('Lesson loaded successfully!');
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format', {
          description: 'Please check your JSON syntax and try again.',
        });
      } else {
        toast.error('Failed to load lesson');
      }
      console.error('JSON load error:', error);
    }
  };

  const currentChapter = selectedChapter !== null ? chapters[selectedChapter] : null;
  const currentStep = currentChapter && selectedStep !== null ? currentChapter.steps[selectedStep] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Toast notifications */}
      <Toaster position="top-right" theme="dark" richColors />

      {/* Tutorial overlay */}
      <LessonEditorTutorial
        isActive={showTutorial}
        onComplete={() => {
          setShowTutorial(false);
          localStorage.setItem('lessonEditorTutorialCompleted', 'true');
        }}
        onSkip={() => {
          setShowTutorial(false);
          localStorage.setItem('lessonEditorTutorialCompleted', 'true');
        }}
      />

      {/* Component Hover Preview - Fixed positioning, not constrained by sidebar */}
      {hoveredComponent && !recentlyAddedComponent && (
        <div
          className="fixed z-50 w-96 pointer-events-none"
          style={{
            left: `${hoveredComponent.rect.left - 400 - 16}px`, // Position to the left with gap
            top: `${hoveredComponent.rect.top}px`
          }}
        >
          <div className="bg-slate-900 border-2 border-purple-500 rounded-lg p-4 shadow-2xl">
            <p className="text-xs text-slate-400 mb-2 font-semibold">Preview: {hoveredComponent.name}</p>
            <div className="lesson-content" dangerouslySetInnerHTML={{ __html: hoveredComponent.template }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="lesson-editor-header border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              🧬 Lesson Editor
            </h1>
            <p className="text-slate-400 text-sm">Create and edit MonstersInk! lessons visually</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20 rounded"
              title="Start Tutorial"
            >
              📚 TUTORIAL
            </button>
            <select
              value={selectedLessonId}
              onChange={(e) => loadExistingLesson(e.target.value)}
              className="lesson-selector px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
            >
              <option value="">Load Existing Lesson...</option>
              {availableLessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  Lesson {lesson.id}: {lesson.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="preview-toggle px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 font-pixel text-[8px] uppercase transition-all hover:shadow-lg hover:shadow-cyan-500/20 rounded"
            >
              {showPreview ? '✏️ EDIT MODE' : '👁️ PREVIEW MODE'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-100px)]">
        {/* Left Sidebar - Structure */}
        <div className="structure-panel col-span-3 bg-slate-800 rounded-lg p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 text-purple-400">Lesson Structure</h2>

          {/* Lesson Info */}
          <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
            <input
              type="text"
              value={lesson.title || ''}
              onChange={(e) => updateLesson('title', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 mb-2 text-sm"
              placeholder="Lesson Title"
            />
            <textarea
              value={lesson.description || ''}
              onChange={(e) => updateLesson('description', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 mb-2 text-sm"
              placeholder="Description"
              rows={2}
            />
            <select
              value={lesson.difficulty || 'Beginner'}
              onChange={(e) => updateLesson('difficulty', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>

          {/* Chapters List */}
          <div className="chapters-list space-y-2">
            {chapters.map((chapter, idx) => (
              <div key={idx} className={`p-2 rounded cursor-pointer transition-all ${selectedChapter === idx ? 'bg-slate-700/70 border-2 border-purple-500/70 shadow-lg shadow-purple-500/20' : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'}`}>
                <div onClick={() => setSelectedChapter(idx)}>
                  <div className="font-semibold text-sm">Chapter {idx}</div>
                  <div className="text-xs text-slate-300">{chapter.title}</div>
                  <div className="text-xs text-slate-400">{chapter.steps.length} steps</div>
                </div>

                {/* Steps List */}
                {selectedChapter === idx && (
                  <div className="mt-2 ml-3 space-y-1">
                    {chapter.steps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        onClick={(e) => { e.stopPropagation(); setSelectedStep(stepIdx); }}
                        className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                          selectedStep === stepIdx
                            ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                            : 'bg-slate-800/50 hover:bg-slate-700/70 border border-transparent'
                        }`}
                      >
                        <span className="text-slate-400">{stepIdx + 1}.</span> {step.title}
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); addStep(); }}
                      className="w-full py-1 px-2 bg-slate-800/50 hover:bg-slate-700/70 border border-slate-600/50 hover:border-slate-500 rounded text-xs text-slate-300 hover:text-slate-200 transition-colors"
                    >
                      + Add Step
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addChapter}
            className="add-chapter-btn w-full mt-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded text-sm font-pixel uppercase text-purple-300"
          >
            + Add Chapter
          </button>
        </div>

        {/* Center - Editor or Preview */}
        {!showPreview ? (
          <>
            {/* Edit Mode */}
            <div className="editor-panel col-span-6 bg-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="border-b border-slate-700 p-4 bg-slate-900">
                <h2 className="text-lg font-bold text-purple-400">
                  {currentStep ? `Edit Step: ${currentStep.title}` : 'Select a step to edit'}
                </h2>
              </div>

              {currentChapter && !currentStep && (
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  <h3 className="font-bold text-cyan-400">Chapter Settings</h3>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={currentChapter.title}
                      onChange={(e) => updateChapter('title', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <textarea
                      value={currentChapter.description}
                      onChange={(e) => updateChapter('description', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Concept</label>
                    <input
                      type="text"
                      value={currentChapter.concept}
                      onChange={(e) => updateChapter('concept', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      placeholder="e.g., syntax, storage, deployment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Estimated Time (minutes)</label>
                    <input
                      type="number"
                      value={currentChapter.estimatedTime}
                      onChange={(e) => updateChapter('estimatedTime', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {currentStep && (
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Step Title</label>
                    <input
                      type="text"
                      value={currentStep.title}
                      onChange={(e) => updateStep('title', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Content (HTML)</label>
                    <textarea
                      value={currentStep.content}
                      onChange={(e) => updateStep('content', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 font-mono text-sm"
                      rows={12}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Initial Code</label>
                      <textarea
                        value={currentStep.code || ''}
                        onChange={(e) => updateStep('code', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 font-mono text-xs"
                        rows={6}
                        placeholder="Initial code template"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Expected Code</label>
                      <textarea
                        value={currentStep.expectedCode || ''}
                        onChange={(e) => updateStep('expectedCode', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 font-mono text-xs"
                        rows={6}
                        placeholder="Solution code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Hint</label>
                    <textarea
                      value={currentStep.hint || ''}
                      onChange={(e) => updateStep('hint', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      rows={2}
                      placeholder="Helpful hint for the student"
                    />
                  </div>

                  <div className="flex gap-2 mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentStep.requiresAuth || false}
                        onChange={(e) => updateStep('requiresAuth', e.target.checked)}
                        className="rounded"
                      />
                      Requires Auth
                    </label>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded border border-purple-500/20 space-y-4 mb-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase">Asset Lifecycle (AI)</h4>
                    
                    <label className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-purple-500/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={currentStep.triggersGeneration || false}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            if (isChecked) {
                                updateStepFields({ triggersGeneration: true, generationStage: 'young' });
                            } else {
                                updateStepFields({ triggersGeneration: false });
                            }
                        }}
                        className="rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
                      />
                      <span>🚀 Triggers Generation</span>
                    </label>

                    {currentStep.triggersGeneration && (
                        <div className="ml-6 mt-2 p-2 bg-purple-900/20 rounded border border-purple-500/30">
                            <label className="block text-xs text-purple-300 mb-1 font-semibold">Generation Stage</label>
                            <select
                                value={currentStep.generationStage || 'young'}
                                onChange={(e) => updateStep('generationStage', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                            >
                                <option value="young">🐣 Young (Baby)</option>
                                <option value="adult">🦕 Adult (Mature)</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 uppercase font-semibold">Reveal Monster (Display)</label>
                      <select
                          value={currentStep.displayStage || ''}
                          onChange={(e) => updateStep('displayStage', e.target.value || undefined)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                          <option value="">Auto (Timeline History)</option>
                          <option value="egg">🥚 Force Egg (Incubating)</option>
                          <option value="young">🐣 Force Young (2D)</option>
                          <option value="adult">🦕 Force Adult (3D)</option>
                      </select>
                      <p className="text-[10px] text-slate-500">
                        "Auto" shows the highest unlocked stage. "Force" overrides it (e.g. for flashbacks).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Image Path</label>
                    <input
                      type="text"
                      value={currentStep.image || ''}
                      onChange={(e) => updateStep('image', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                      placeholder="/creatures/example.png"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Components & Output */}
            <div className="col-span-3 space-y-4 overflow-y-auto">
              {/* Component Palette */}
              <div className="component-palette bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3 text-cyan-400">Component Palette</h3>
                <div className="space-y-2">
                  {Object.entries(COMPONENT_TEMPLATES).map(([name, template]) => (
                    <button
                      key={name}
                      onClick={() => insertComponent(template, name)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredComponent({ name, template, rect });
                      }}
                      onMouseLeave={() => setHoveredComponent(null)}
                      disabled={!currentStep}
                      className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-mono transition-all hover:shadow-md relative"
                    >
                      {name}
                      {recentlyAddedComponent === name && (
                        <span className="ml-2 text-emerald-400 animate-pulse">✓ Added!</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* JSON Export/Import */}
              <div className="export-section bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3 text-emerald-400">Export / Import</h3>

                <button
                  onClick={generateJson}
                  className="w-full mb-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 rounded text-sm font-pixel uppercase text-emerald-300"
                >
                  Generate JSON
                </button>

                {jsonOutput && (
                  <div className="mb-4">
                    <textarea
                      value={jsonOutput}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 font-mono text-xs h-40"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(jsonOutput);
                        setCopiedToClipboard(true);
                        setTimeout(() => setCopiedToClipboard(false), 2000);
                      }}
                      className="w-full mt-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 rounded text-xs text-cyan-300 transition-all relative"
                    >
                      {copiedToClipboard ? (
                        <span className="text-emerald-400">✓ Copied to Clipboard!</span>
                      ) : (
                        'Copy to Clipboard'
                      )}
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <label className="block text-sm text-slate-400 mb-2">Import JSON</label>
                  <textarea
                    value={loadedJson}
                    onChange={(e) => setLoadedJson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2 font-mono text-xs h-32 mb-2"
                    placeholder="Paste lesson JSON here..."
                  />
                  <button
                    onClick={loadJson}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded text-sm font-pixel uppercase text-purple-300"
                  >
                    Load JSON
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Preview Mode - Matching actual lesson view */
          <div className="col-span-9 flex">
            {/* Content Preview */}
            <div className="w-1/2 overflow-y-auto bg-slate-900 p-6">
              {currentStep ? (
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4 text-purple-400">
                    {currentStep.title}
                  </h2>
                  <LessonContent html={currentStep.content} />

                  {currentStep.hint && (
                    <div className="mt-6 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <p className="text-amber-200 font-semibold text-sm mb-1">
                            Lab Assistant says:
                          </p>
                          <p className="text-amber-200">{currentStep.hint}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Select a step to preview
                </div>
              )}
            </div>

            {/* Code Preview */}
            <div className="w-1/2 border-l border-slate-700 bg-slate-900 flex flex-col">
              {/* Monster Asset Preview */}
              <div className="h-1/3 border-b border-slate-700 relative bg-slate-950/50">
                 {currentChapter && selectedStep !== null ? (
                    <CreatureStageDisplay
                        stage={(() => {
                            const step = currentChapter.steps[selectedStep];
                            // 1. Explicit Override
                            if (step.displayStage) return step.displayStage as 'egg' | 'young' | 'adult';
                            
                            // 2. History (Auto)
                            const hatchIndex = currentChapter.steps.findIndex(s => s.displayStage === 'young');
                            const evoIndex = currentChapter.steps.findIndex(s => s.displayStage === 'adult');
                            
                            if (evoIndex !== -1 && selectedStep >= evoIndex && asset.isModelReady) return 'adult';
                            if (hatchIndex !== -1 && selectedStep >= hatchIndex && asset.isImageReady) return 'young';
                            
                            return 'egg';
                        })()}
                        imageUrl={asset.imageUrl}
                        modelUrl={asset.modelUrl}
                        isRevealing={false}
                        isLoading={asset.isGenerating}
                        error={asset.error}
                        onRetry={asset.forceRefresh}
                    />
                 ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 text-xs">Asset Preview</div>
                 )}
                 <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white pointer-events-none">
                      Live Asset Preview
                 </div>
              </div>

              {/* Code Editor Container */}
              <div className="flex-1 flex flex-col min-h-0">
                {currentStep?.code !== undefined ? (
                  <div className="h-full flex flex-col">
                    <div className="border-b border-slate-700 p-4 bg-slate-800/50">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">🧪</span>
                        <h3 className="text-lg font-semibold">Creature DNA Editor</h3>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <CodeEditor
                        value={currentStep.code}
                        onChange={() => {}}
                        language="rust"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <div className="text-6xl mb-4">📖</div>
                      <h3 className="text-xl font-semibold text-purple-400 mb-2">
                        No coding needed!
                      </h3>
                      <p className="text-slate-400">
                        Just read and continue to the next step.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
