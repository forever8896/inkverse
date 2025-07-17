"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lesson, validateCode } from "@/lib/lessons";
import CodeEditor from "@/components/CodeEditor";

interface LessonLayoutProps {
  lesson?: Lesson;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function LessonLayout({ lesson }: LessonLayoutProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const currentStepData = lesson?.steps[currentStep];

  useEffect(() => {
    // Initialize code editor with step's initial code
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
    
    // Show encouraging message for new coding steps
    if (currentStepData?.validation && currentStep > 0) {
      setTimeout(() => {
        addToast({
          type: 'info',
          title: '💻 Time to Code!',
          message: 'Read the instructions, then start coding. Click "Check Code" when ready!'
        });
      }, 500);
    }
  }, [currentStep, currentStepData]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const validateUserCode = () => {
    if (currentStepData?.validation) {
      const validationResult = validateCodeWithFeedback(userCode, currentStepData.validation);
      
      if (validationResult.isValid) {
        setIsValidated(true);
        addToast({
          type: 'success',
          title: '🎉 Perfect!',
          message: 'Your creature responds beautifully to the code!'
        });
      } else {
        setIsValidated(false);
        addToast({
          type: 'error',
          title: '🔍 Not quite there yet',
          message: validationResult.feedback
        });
      }
      return validationResult.isValid;
    } else {
      // No validation needed, just show success
      addToast({
        type: 'success',
        title: '✅ Step Complete!',
        message: 'Ready to move on to the next step.'
      });
      return true;
    }
  };

  // Enhanced validation with detailed feedback
  const validateCodeWithFeedback = (code: string, rules: any[]) => {
    for (let rule of rules) {
      switch (rule.type) {
        case "includes":
          for (let pattern of rule.patterns) {
            if (!code.includes(pattern)) {
              return {
                isValid: false,
                feedback: getPatternFeedback(pattern, currentStep)
              };
            }
          }
          break;
        case "excludes":
          for (let pattern of rule.patterns) {
            if (code.includes(pattern)) {
              return {
                isValid: false,
                feedback: `Remove "${pattern}" from your code.`
              };
            }
          }
          break;
        case "regex":
          for (let pattern of rule.patterns) {
            if (!new RegExp(pattern).test(code)) {
              return {
                isValid: false,
                feedback: `Make sure your code matches the required pattern.`
              };
            }
          }
          break;
      }
    }
    return { isValid: true, feedback: "" };
  };

  // Specific feedback for different patterns
  const getPatternFeedback = (pattern: string, step: number): string => {
    const feedbackMap: Record<string, string> = {
      "#[ink(storage)]": "Add the #[ink(storage)] attribute above your struct. This tells ink! that this struct will store data on the blockchain.",
      "struct Creature": "Create a struct called 'Creature' - this will be your creature's blueprint. Use 'pub struct Creature {' syntax.",
      "is_conscious": "Add an 'is_conscious' field inside your struct. This should be of type 'bool' to track if your creature is awake.",
      "bool": "Make sure your is_conscious field is of type 'bool' (true/false values).",
      "impl Creature": "Create an implementation block with 'impl Creature {' - this is where your creature's abilities will live.",
      "#[ink(constructor)]": "Add the #[ink(constructor)] attribute above your constructor function. This tells ink! this function creates new creatures.",
      "birth_awake": "Create a constructor function called 'birth_awake' that takes a 'conscious: bool' parameter.",
      "birth_sleeping": "Create a second constructor called 'birth_sleeping' with no parameters. It should call 'Self::birth_awake(false)'.",
      "#[ink(message)]": "Add the #[ink(message)] attribute above your function. This makes it callable from outside the contract.",
      "pub fn is_awake": "Create a public function called 'is_awake' that takes '&self' and returns 'bool'.",
      "&self": "Your is_awake function should take '&self' as a parameter (read-only access to the creature).",
      "self.is_conscious": "Return 'self.is_conscious' from your function to tell others if the creature is awake.",
      "pub fn toggle_consciousness": "Create a function called 'toggle_consciousness' that takes '&mut self' (mutable access).",
      "&mut self": "Use '&mut self' because you're changing the creature's state. The 'mut' means mutable/changeable.",
      "self.is_conscious = !self.is_conscious": "Flip the consciousness state using 'self.is_conscious = !self.is_conscious;' - the ! operator flips true to false and vice versa."
    };

    return feedbackMap[pattern] || `Make sure to include "${pattern}" in your code.`;
  };

  const nextStep = () => {
    if (lesson && currentStep < lesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetCode = () => {
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
      setIsValidated(false);
    }
  };

  const showSolution = () => {
    if (currentStepData?.expectedCode) {
      setUserCode(currentStepData.expectedCode);
      setIsValidated(true);
    }
  };

  if (!lesson) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Navigation */}
        <nav className="border-b border-slate-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/lessons" className="flex items-center space-x-2">
               
                <img src="/logo.png" alt="Monsters ink!" className="h-24" />
              </Link>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Lesson</span>
            </div>
          </div>
        </nav>

        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">📖</div>
            <h1 className="text-3xl font-bold mb-4">Empty Lesson</h1>
            <p className="text-slate-300 mb-6">
              This lesson is ready for content. Start building your bio-engineering tutorial here.
            </p>
            <Link
              href="/lessons"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg font-semibold transition-all duration-200 inline-block"
            >
              ← Back to Lessons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/lessons" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Monsters ink!" className="h-24" />
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Lesson {lesson.id}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-400">
              Step {currentStep + 1} of {lesson.steps.length}
            </div>
            <div className="w-32 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / lesson.steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Instructions */}
        <div className="w-1/2 p-6 flex flex-col relative">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl">
              {/* Lesson Header */}
              <div className="mb-8 pb-6 border-b border-slate-700/50">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-tight">{lesson.title}</h1>
                <div className="flex items-center space-x-6 text-sm">
                  <span className={`px-3 py-1.5 rounded-full font-medium ${
                    lesson.difficulty === "Beginner" ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30" :
                    lesson.difficulty === "Intermediate" ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30" :
                    lesson.difficulty === "Advanced" ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30" :
                    "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30"
                  }`}>
                    {lesson.difficulty}
                  </span>
                  <span className="flex items-center space-x-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full">
                    <span>⏱️</span>
                    <span>{lesson.duration}</span>
                  </span>
                </div>
              </div>

              {/* Step Content */}
              {currentStepData && (
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-6 border border-purple-500/20 mb-6">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      {currentStepData.title}
                    </h2>
                  </div>
                  <div 
                    className="prose prose-invert prose-purple max-w-none text-slate-200 leading-relaxed
                    [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-6 [&>h1]:leading-tight
                    [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:mb-4 [&>h2]:mt-8
                    [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-cyan-300 [&>h3]:mb-3 [&>h3]:mt-6
                    [&>p]:mb-6 [&>p]:text-base [&>p]:leading-7 [&>p]:text-slate-200
                    [&>ul]:mb-6 [&>ul]:space-y-2 [&>ol]:mb-6 [&>ol]:space-y-2
                    [&>li]:text-slate-200 [&>li]:leading-6 [&>li]:pl-2
                    [&>code]:bg-slate-800 [&>code]:text-purple-300 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
                    [&>strong]:text-white [&>strong]:font-semibold
                    [&>em]:text-slate-100 [&>em]:italic
                    [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:bg-slate-800/30 [&>blockquote]:py-2 [&>blockquote]:my-4"
                    dangerouslySetInnerHTML={{ __html: currentStepData.content }}
                  />
                </div>
              )}

              {/* Hint */}
              {currentStepData?.hint && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center space-x-3 text-amber-400 hover:text-amber-300 transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500/50"
                  >
                    <span className="text-lg">💡</span>
                    <span className="font-medium">{showHint ? "Hide Hint" : "Show Hint"}</span>
                  </button>
                  {showHint && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-600/40 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl mt-1">💡</span>
                        <div>
                          <h4 className="text-amber-300 font-semibold mb-2">Hint</h4>
                          <p className="text-amber-100 leading-relaxed">{currentStepData.hint}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Toast Container */}
              <div className="fixed top-4 right-4 z-50 space-y-3">
                {toasts.map((toast) => (
                  <div
                    key={toast.id}
                    className={`max-w-sm p-4 rounded-xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 ease-in-out ${
                      toast.type === 'success'
                        ? 'bg-gradient-to-r from-green-900/90 to-emerald-900/80 border-green-600/50 text-green-100'
                        : toast.type === 'error'
                        ? 'bg-gradient-to-r from-red-900/90 to-rose-900/80 border-red-600/50 text-red-100'
                        : 'bg-gradient-to-r from-blue-900/90 to-cyan-900/80 border-blue-600/50 text-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{toast.title}</h4>
                        <p className="text-sm opacity-90">{toast.message}</p>
                      </div>
                      <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-3 text-white/60 hover:text-white/80 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mb-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 border border-slate-600 hover:border-slate-500"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>

                <div className="flex space-x-3">
                  {Array.from({ length: lesson.steps.length }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`w-4 h-4 rounded-full transition-all duration-200 hover:scale-110 ${
                        i === currentStep
                          ? "bg-gradient-to-r from-purple-400 to-cyan-400 shadow-lg shadow-purple-400/30"
                          : i < currentStep
                          ? "bg-gradient-to-r from-green-400 to-emerald-400 shadow-md shadow-green-400/20"
                          : "bg-slate-600 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  disabled={
                    currentStep === lesson.steps.length - 1 ||
                    (currentStepData?.validation && !isValidated)
                  }
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg"
                >
                  <span>{currentStep === lesson.steps.length - 1 ? "Complete" : "Next"}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Creature Display - Integrated and minimal */}
          <div className="flex-shrink-0 relative flex flex-col items-center justify-center">
            {/* Creature Image - Integrated with breathing effects */}
            <div className="relative flex items-center justify-center mb-4">
              {lesson.id === 1 ? (
                // Lesson 1: Show creature progression
                currentStep === 0 ? (
                  // Step 1 only: Egg waiting to hatch
                  <div className="relative">
                    <img
                      src="/creatures/first_egg.png"
                      alt="Creature egg"
                      className="w-80 h-80 object-contain transition-all duration-1000 ease-in-out"
                      style={{
                        filter: "drop-shadow(0 0 15px rgba(139, 92, 246, 0.3))"
                      }}
                    />
                    <div className="absolute inset-0 bg-purple-400/5 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                  </div>
                ) : (
                  // Steps 2-5: Show the creature! Sleeping until step 5 is validated
                  <div className="relative">
                    <img
                      src={isValidated && currentStep === 4 ? "/creatures/first_awake.png" : "/creatures/first_sleeping.png"}
                      alt={isValidated && currentStep === 4 ? "Awakened creature" : "Sleeping creature"}
                      className="w-80 h-80 object-contain transition-all duration-1000 ease-in-out"
                      style={{
                        filter: isValidated && currentStep === 4
                          ? "drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))" 
                          : "drop-shadow(0 0 20px rgba(71, 85, 105, 0.4))"
                      }}
                    />
                    {isValidated && currentStep === 4 && (
                      <div className="absolute inset-0 bg-purple-400/10 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }} />
                    )}
                    {/* Gentle breathing animation for sleeping creature */}
                    {!(isValidated && currentStep === 4) && (
                      <div className="absolute inset-0 bg-blue-400/3 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                    )}
                  </div>
                )
              ) : lesson.id === 2 ? (
                // Lesson 2: Show creature with body
                <div className="relative">
                  <img
                    src="/creatures/second_body.png"
                    alt="Creature with body"
                    className="w-80 h-80 object-contain"
                    style={{ filter: "drop-shadow(0 0 25px rgba(168, 85, 247, 0.5))" }}
                  />
                </div>
              ) : (
                // Future lessons: Placeholder
                <div className="w-56 h-56 bg-slate-800/30 rounded-full flex items-center justify-center">
                  <span className="text-7xl">🔬</span>
                </div>
              )}
            </div>

            {/* Text info - Below creature */}
            <div className="text-center">
              {/* Creature Name - Small and elegant */}
              <h3 className="text-lg font-medium text-slate-300 mb-1">
                {lesson.id === 1 ? (currentStep === 0 ? "Mysterious Egg" : "Bio-Specimen Alpha") : lesson.id === 2 ? "Enhanced Creature" : "Specimen"}
              </h3>
              
              {/* Status - Very concise */}
              <p className="text-xs text-slate-400 mb-3">
                {lesson.id === 1 
                  ? currentStep === 0
                    ? "Waiting to hatch..."
                    : currentStep < 4
                      ? "Sleeping peacefully"
                      : isValidated 
                        ? "Fully conscious!"
                        : "Ready to awaken"
                  : lesson.id === 2 
                    ? "Growing stronger"
                    : "In development"
                }
              </p>

              {/* Minimal Progress Indicators */}
              {lesson.id === 1 && currentStep > 0 && (
                <div className="flex justify-center space-x-1 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentStep >= 1 ? 'bg-purple-400/80' : 'bg-slate-600/50'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentStep >= 2 ? 'bg-purple-400/80' : 'bg-slate-600/50'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${currentStep >= 3 ? 'bg-purple-400/80' : 'bg-slate-600/50'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isValidated && currentStep >= 4 ? 'bg-green-400/80' : currentStep >= 4 ? 'bg-amber-400/80' : 'bg-slate-600/50'}`} />
                </div>
              )}

              {/* Achievement - Only when earned */}
              {isValidated && currentStep === 4 && lesson.id === 1 && (
                <div className="text-center">
                  <span className="text-xs text-green-400">✨ Awakened</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Workspace */}
        <div className="w-1/2 border-l border-slate-700">
          <div className="h-full flex flex-col">
            {/* Editor Header */}
            <div className="border-b border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Code Workspace</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={resetCode}
                    className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    Reset
                  </button>
                  {currentStepData?.validation && (
                    <button
                      onClick={validateUserCode}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                    >
                      🧬 Check Code
                    </button>
                  )}
                  {currentStepData?.expectedCode && (
                    <button
                      onClick={showSolution}
                      className="px-3 py-1 text-sm bg-amber-600 hover:bg-amber-700 rounded transition-colors"
                    >
                      Solution
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1">
              {currentStepData?.code !== undefined ? (
                <CodeEditor
                  value={userCode}
                  onChange={setUserCode}
                  language="rust"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/50">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💻</div>
                    <h3 className="text-xl font-semibold mb-2">Code Workspace</h3>
                    <p className="text-slate-400">Your code editor will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 