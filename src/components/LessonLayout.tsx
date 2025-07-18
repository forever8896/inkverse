"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lesson, validateCode, ValidationRule } from "@/lib/lessons";
import CodeEditor from "@/components/CodeEditor";
import ShaderBackground from "@/components/ShaderBackground";

interface LessonLayoutProps {
  lesson?: Lesson;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
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
  }, [currentStep, currentStepData]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const validateUserCode = () => {
    if (currentStepData?.validation) {
      const validationResult = validateCodeWithFeedback(
        userCode,
        currentStepData.validation
      );

      if (validationResult.isValid) {
        setIsValidated(true);
        addToast({
          type: "success",
          title: "🎉 Perfect!",
          message: "Your creature responds beautifully to the code!",
        });
      } else {
        setIsValidated(false);
        addToast({
          type: "error",
          title: "🔍 Not quite there yet",
          message: validationResult.feedback,
        });
      }
      return validationResult.isValid;
    } else {
      // No validation needed, just show success
      addToast({
        type: "success",
        title: "✅ Step Complete!",
        message: "Ready to move on to the next step.",
      });
      return true;
    }
  };

  // Enhanced validation with detailed feedback
  const validateCodeWithFeedback = (code: string, rules: ValidationRule[]) => {
    for (const rule of rules) {
      switch (rule.type) {
        case "includes":
          for (const pattern of rule.patterns) {
            if (!code.includes(pattern)) {
              return {
                isValid: false,
                feedback: getPatternFeedback(pattern, currentStep),
              };
            }
          }
          break;
        case "excludes":
          for (const pattern of rule.patterns) {
            if (code.includes(pattern)) {
              return {
                isValid: false,
                feedback: `Remove "${pattern}" from your code.`,
              };
            }
          }
          break;
        case "regex":
          for (const pattern of rule.patterns) {
            if (!new RegExp(pattern).test(code)) {
              return {
                isValid: false,
                feedback: `Make sure your code matches the required pattern.`,
              };
            }
          }
          break;
        case "custom":
          // Handle custom validation rules if needed
          break;
      }
    }
    return { isValid: true, feedback: "" };
  };

  // Specific feedback for different patterns
  const getPatternFeedback = (pattern: string, step: number): string => {
    const feedbackMap: Record<string, string> = {
      "#[ink(storage)]":
        "Add the #[ink(storage)] attribute above your struct. This tells ink! that this struct will store data on the blockchain.",
      "struct Creature":
        "Create a struct called 'Creature' - this will be your creature's blueprint. Use 'pub struct Creature {' syntax.",
      is_conscious:
        "Add an 'is_conscious' field inside your struct. This should be of type 'bool' to track if your creature is awake.",
      bool: "Make sure your is_conscious field is of type 'bool' (true/false values).",
      "impl Creature":
        "Create an implementation block with 'impl Creature {' - this is where your creature's abilities will live.",
      "#[ink(constructor)]":
        "Add the #[ink(constructor)] attribute above your constructor function. This tells ink! this function creates new creatures.",
      birth_awake:
        "Create a constructor function called 'birth_awake' that takes a 'conscious: bool' parameter.",
      birth_sleeping:
        "Create a second constructor called 'birth_sleeping' with no parameters. It should call 'Self::birth_awake(false)'.",
      "#[ink(message)]":
        "Add the #[ink(message)] attribute above your function. This makes it callable from outside the contract.",
      "pub fn is_awake":
        "Create a public function called 'is_awake' that takes '&self' and returns 'bool'.",
      "&self":
        "Your is_awake function should take '&self' as a parameter (read-only access to the creature).",
      "self.is_conscious":
        "Return 'self.is_conscious' from your function to tell others if the creature is awake.",
      "pub fn toggle_consciousness":
        "Create a function called 'toggle_consciousness' that takes '&mut self' (mutable access).",
      "&mut self":
        "Use '&mut self' because you're changing the creature's state. The 'mut' means mutable/changeable.",
      "self.is_conscious = !self.is_conscious":
        "Flip the consciousness state using 'self.is_conscious = !self.is_conscious;' - the ! operator flips true to false and vice versa.",
    };

    return (
      feedbackMap[pattern] || `Make sure to include "${pattern}" in your code.`
    );
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
              This lesson is ready for content. Start building your
              bio-engineering tutorial here.
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
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Creature Display with Shader Background */}
        <div className="w-1/2 relative overflow-hidden">
          {/* Shader Background */}
          <ShaderBackground />

          <div className="absolute top-0 flex justify-between w-full">
            <div className="p-5">
              <Link href="/lessons" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Monsters ink!" className="h-24" />
              </Link>
            </div>

            <div className="p-5">
              <div className="w-32 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentStep + 1) / lesson.steps.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Creature Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
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
                        filter:
                          "drop-shadow(0 0 15px rgba(139, 92, 246, 0.6)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.4)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.2)) drop-shadow(0 0 90px rgba(139, 92, 246, 0.1))",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{
                        animationDuration: "2s",
                        background:
                          "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 30%, rgba(168, 85, 247, 0.04) 60%, rgba(168, 85, 247, 0) 100%)",
                      }}
                    />
                  </div>
                ) : (
                  // Steps 2-5: Show the creature! Sleeping until step 5 is validated
                  <div className="relative">
                    <img
                      src={
                        isValidated && currentStep === 4
                          ? "/creatures/first_awake.png"
                          : "/creatures/first_sleeping.png"
                      }
                      alt={
                        isValidated && currentStep === 4
                          ? "Awakened creature"
                          : "Sleeping creature"
                      }
                      className="w-80 h-80 object-contain transition-all duration-1000 ease-in-out"
                      style={{
                        filter:
                          isValidated && currentStep === 4
                            ? "drop-shadow(0 0 20px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 80px rgba(168, 85, 247, 0.3)) drop-shadow(0 0 120px rgba(168, 85, 247, 0.1))"
                            : "drop-shadow(0 0 12px rgba(71, 85, 105, 0.7)) drop-shadow(0 0 25px rgba(71, 85, 105, 0.4)) drop-shadow(0 0 50px rgba(71, 85, 105, 0.2)) drop-shadow(0 0 75px rgba(71, 85, 105, 0.1))",
                      }}
                    />
                    {isValidated && currentStep === 4 && (
                      <div
                        className="absolute inset-0 rounded-full animate-pulse"
                        style={{
                          animationDuration: "1.5s",
                          background:
                            "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.12) 30%, rgba(168, 85, 247, 0.06) 60%, rgba(168, 85, 247, 0) 100%)",
                        }}
                      />
                    )}
                    {/* Gentle breathing animation for sleeping creature */}
                    {!(isValidated && currentStep === 4) && (
                      <div
                        className="absolute inset-0 rounded-full animate-pulse"
                        style={{
                          animationDuration: "4s",
                          background:
                            "radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, rgba(96, 165, 250, 0.04) 30%, rgba(96, 165, 250, 0.02) 60%, rgba(96, 165, 250, 0) 100%)",
                        }}
                      />
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
                    style={{
                      filter:
                        "drop-shadow(0 0 18px rgba(168, 85, 247, 0.7)) drop-shadow(0 0 35px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 70px rgba(168, 85, 247, 0.3)) drop-shadow(0 0 105px rgba(168, 85, 247, 0.1))",
                    }}
                  />
                </div>
              ) : (
                // Future lessons: Placeholder
                <div className="w-64 h-64 bg-slate-800/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-6xl">🔬</span>
                </div>
              )}
            </div>
          </div>

          {/* Creature Info Overlay */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="text-center space-y-3 backdrop-blur-md bg-slate-900/40 rounded-xl px-6 py-4 border border-slate-700/50">
              {/* Creature Name */}
              <h3 className="text-lg font-semibold text-white">
                {lesson.id === 1
                  ? currentStep === 0
                    ? "Mysterious Egg"
                    : "Bio-Specimen Alpha"
                  : lesson.id === 2
                  ? "Enhanced Creature"
                  : "Specimen"}
              </h3>

              {/* Status */}
              <p className="text-sm text-slate-300">
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
                  : "In development"}
              </p>

              {/* Progress Indicators */}
              {lesson.id === 1 && currentStep > 0 && (
                <div className="flex justify-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentStep >= 1 ? "bg-purple-400/80" : "bg-slate-600/50"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentStep >= 2 ? "bg-purple-400/80" : "bg-slate-600/50"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentStep >= 3 ? "bg-purple-400/80" : "bg-slate-600/50"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isValidated && currentStep >= 4
                        ? "bg-green-400/80"
                        : currentStep >= 4
                        ? "bg-amber-400/80"
                        : "bg-slate-600/50"
                    }`}
                  />
                </div>
              )}

              {/* Achievement */}
              {isValidated && currentStep === 4 && lesson.id === 1 && (
                <div className="text-center">
                  <span className="text-sm text-green-400 font-semibold">
                    ✨ Awakened
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Overlay */}
          <div className="absolute bottom-8 right-8">
            <div className="flex space-x-3 backdrop-blur-md bg-slate-900/40 rounded-xl p-3 border border-slate-700/50">
              {Array.from({ length: lesson.steps.length }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
                    i === currentStep
                      ? "bg-gradient-to-r from-purple-400 to-cyan-400 shadow-lg shadow-purple-400/30"
                      : i < currentStep
                      ? "bg-gradient-to-r from-green-400 to-emerald-400 shadow-md shadow-green-400/20"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Instructions + Code Editor */}
        <div className="w-1/2 flex flex-col border-l border-slate-700">
          {/* Instructions Section */}
          <div className="h-1/2 p-6 flex flex-col overflow-hidden">
            {currentStepData && (
              <div className="flex-1 flex flex-col min-h-0">
                <div
                  className="prose prose-invert prose-purple max-w-none text-slate-200 leading-relaxed flex-1 overflow-y-auto
                  [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-4 [&>h1]:leading-tight
                  [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:mb-3 [&>h2]:mt-4
                  [&>h3]:text-base [&>h3]:font-medium [&>h3]:text-cyan-300 [&>h3]:mb-2 [&>h3]:mt-3
                  [&>p]:mb-4 [&>p]:text-sm [&>p]:leading-6 [&>p]:text-slate-200
                  [&>ul]:mb-4 [&>ul]:space-y-1 [&>ol]:mb-4 [&>ol]:space-y-1
                  [&>li]:text-slate-200 [&>li]:leading-5 [&>li]:pl-1 [&>li]:text-sm
                  [&>code]:bg-slate-800 [&>code]:text-purple-300 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                  [&>strong]:text-white [&>strong]:font-semibold
                  [&>em]:text-slate-100 [&>em]:italic
                  [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:bg-slate-800/30 [&>blockquote]:py-2 [&>blockquote]:my-3"
                  dangerouslySetInnerHTML={{ __html: currentStepData.content }}
                />
              </div>
            )}

            {/* Hint */}
            {currentStepData?.hint && (
              <div className="mt-4 flex-shrink-0">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/50 text-sm"
                >
                  <span>💡</span>
                  <span className="font-medium">
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </span>
                </button>
                {showHint && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-600/40 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg mt-0.5">💡</span>
                      <div>
                        <h4 className="text-amber-300 font-semibold mb-1 text-sm">
                          Hint
                        </h4>
                        <p className="text-amber-100 leading-relaxed text-sm">
                          {currentStepData.hint}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-3">
              {toasts.map((toast, idx) => (
                <div
                  key={toast.id}
                  className={`max-w-sm p-4 rounded-xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 ease-in-out
                      ${
                        toast.type === "success"
                          ? "bg-gradient-to-r from-green-900/90 to-emerald-900/80 border-green-600/50 text-green-100"
                          : toast.type === "error"
                          ? "bg-gradient-to-r from-red-900/90 to-rose-900/80 border-red-600/50 text-red-100"
                          : "bg-gradient-to-r from-blue-900/90 to-cyan-900/80 border-blue-600/50 text-blue-100"
                      }
                      animate-toast-fly-in`}
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    animationFillMode: "both",
                  }}
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
            <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 backdrop-blur-sm flex-shrink-0">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 border border-slate-600 hover:border-slate-500 text-sm"
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: lesson.steps.length }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
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
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 shadow-lg text-sm"
              >
                <span>
                  {currentStep === lesson.steps.length - 1
                    ? "Complete"
                    : "Next"}
                </span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Code Editor Section */}
          <div className="h-1/2 flex flex-col border-t border-slate-700">
            {/* Editor Header */}
            <div className="border-b border-slate-700 p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Code Workspace</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={resetCode}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    Reset
                  </button>
                  {currentStepData?.validation && (
                    <button
                      onClick={validateUserCode}
                      className="px-3 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg transition-all duration-200 font-semibold shadow-lg"
                    >
                      🧬 Check Code
                    </button>
                  )}
                  {currentStepData?.expectedCode && (
                    <button
                      onClick={showSolution}
                      className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 rounded transition-colors"
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
                    <h3 className="text-xl font-semibold mb-2">
                      Code Workspace
                    </h3>
                    <p className="text-slate-400">
                      Your code editor will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm p-4 rounded-xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 ease-in-out ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-900/90 to-emerald-900/80 border-green-600/50 text-green-100"
                : toast.type === "error"
                ? "bg-gradient-to-r from-red-900/90 to-rose-900/80 border-red-600/50 text-red-100"
                : "bg-gradient-to-r from-blue-900/90 to-cyan-900/80 border-blue-600/50 text-blue-100"
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
    </div>
  );
}
