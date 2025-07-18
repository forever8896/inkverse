"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lesson, validateCode, ValidationRule } from "@/lib/lessons";
import CodeEditor from "@/components/CodeEditor";
import ShaderBackground from "@/components/ShaderBackground";
import dynamic from "next/dynamic";
import { HSLValues } from "@/components/CreatureColorPicker";

const ConsolePanel = dynamic(() => import("@/app/ConsolePanel"), {
  ssr: false,
});

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [creatureColor, setCreatureColor] = useState<HSLValues>({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });

  const currentStepData = lesson?.steps[currentStep];

  useEffect(() => {
    // Initialize code editor with step's initial code
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
    setShowCompletionModal(false); // Reset modal when step changes
  }, [currentStep, currentStepData]);

  // Load saved creature color from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem("creatureColor");
    if (savedColor) {
      try {
        const parsedColor = JSON.parse(savedColor);
        setCreatureColor(parsedColor);
      } catch (error) {
        console.error("Error parsing saved color:", error);
      }
    }
  }, []);

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

  // Generate CSS filter string from HSL values
  const getImageFilter = () => {
    const { hue, saturation, lightness } = creatureColor;
    return `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${
      100 + lightness
    }%) drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))`;
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
    <>
      {/* Toast Notifications */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-1000 flex flex-col items-center space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-lg shadow-lg border
              ${
                toast.type === "success"
                  ? "bg-green-700/90 border-green-400 text-white"
                  : ""
              }
              ${
                toast.type === "error"
                  ? "bg-red-700/90 border-red-400 text-white"
                  : ""
              }
              ${
                toast.type === "info"
                  ? "bg-blue-700/90 border-blue-400 text-white"
                  : ""
              }
              animate-fade-in-up pointer-events-auto
            `}
            style={{ minWidth: 280, maxWidth: 400 }}
            role="alert"
            aria-live="polite"
          >
            <div className="font-semibold mb-1">{toast.title}</div>
            <div className="text-sm">{toast.message}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>

      <div className="h-screen w-screen bg-slate-900 flex flex-col overflow-hidden bg-black">
        {/* Full-screen Shader Background */}
        <ShaderBackground />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Panel: Creature Display */}
          <div className="w-1/2 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 flex justify-between w-full z-20">
              <div className="p-5">
                <Link href="/" className="flex items-center space-x-2">
                  <img src="/logo.png" alt="Monsters ink!" className="h-24" />
                </Link>
              </div>
            </div>

            {/* Creature Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {lesson.id === 1 ? (
                  currentStepData?.image ? (
                    <img
                      src={currentStepData.image}
                      alt="Creature"
                      width={320}
                      height={320}
                      className="w-80 h-80 object-contain"
                      style={{
                        filter: getImageFilter(),
                      }}
                    />
                  ) : (
                    <div className="w-64 h-64 bg-slate-800/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <span className="text-6xl">🔬</span>
                    </div>
                  )
                ) : (
                  <div className="w-64 h-64 bg-slate-800/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span
                      className="text-6xl"
                      style={{
                        filter: getImageFilter(),
                      }}
                    >
                      🔬
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Creature Info Overlay */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="text-center space-y-3 px-6 py-4 ">
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
          </div>

          {/* Right Panel: Instructions + Code Editor */}
          <div className="w-1/2 flex flex-col p-10 min-h-0">
            {/* Instructions Section */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden backdrop-blur-md bg-white/5 rounded mb-4 min-h-0">
              {currentStepData && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div
                    className="prose prose-invert prose-purple max-w-none text-slate-200 leading-relaxed flex-1 overflow-y-auto
                  [&>h1]:text-base [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-4 [&>h1]:leading-tight
                  [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:mb-3 [&>h2]:mt-4
                  [&>h3]:text-xs [&>h3]:font-medium [&>h3]:text-cyan-300 [&>h3]:mb-2 [&>h3]:mt-3
                  [&>p]:mb-4 [&>p]:text-sm [&>p]:leading-6 [&>p]:text-slate-200
                  [&>ul]:mb-4 [&>ul]:space-y-1 [&>ol]:mb-4 [&>ol]:space-y-1
                  [&>li]:text-slate-200 [&>li]:leading-5 [&>li]:pl-1 [&>li]:text-sm
                  [&>code]:bg-slate-800 [&>code]:text-purple-300 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                  [&>strong]:text-white [&>strong]:font-semibold
                  [&>em]:text-slate-100 [&>em]:italic
                  [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:bg-slate-800/30 [&>blockquote]:py-2 [&>blockquote]:my-3"
                    dangerouslySetInnerHTML={{
                      __html: currentStepData.content,
                    }}
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
                    <span className="font-medium">Show Hint</span>
                  </button>
                  <div className="relative w-full flex justify-center">
                    {/* Animated Toast-like Hint Overlay */}
                    <div
                      className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 ${
                        showHint
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 -translate-y-4"
                      } w-[min(90vw,420px)]`}
                      aria-live="polite"
                    >
                      <div className="p-4 bg-gradient-to-r from-amber-900/80 to-yellow-900/70 border border-amber-600/60 rounded-lg shadow-xl backdrop-blur-lg flex items-start space-x-3 pointer-events-auto">
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
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor Section */}
            <div className="flex-1 flex flex-col min-h-0 mb-4">
              {/* Editor Header */}
              <div className="p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">Workspace</h4>
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
                        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                      >
                        Solution
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 min-h-0">
                {currentStepData?.code !== undefined ? (
                  <CodeEditor
                    value={userCode}
                    onChange={setUserCode}
                    language="rust"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-800/20">
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

            {/* Navigation */}
            <div className="flex justify-between items-center flex-shrink-0">
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

              {currentStep === lesson.steps.length - 1 && lesson.id === 1 ? (
                <button
                  onClick={() => setShowCompletionModal(true)}
                  disabled={currentStepData?.validation && !isValidated}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 shadow-lg text-sm"
                >
                  <span>Complete</span>
                  <span>→</span>
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-slate-900 rounded-lg shadow-2xl p-8 flex flex-col items-center max-w-[90vw] max-h-[90vh] relative">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
              <video
                src="/creatures/video.mp4"
                autoPlay
                loop
                controls
                className="w-[min(480px,70vw)] h-[min(270px,40vw)] mx-auto rounded-lg shadow-lg mb-6 bg-black"
                style={{ objectFit: "contain" }}
              />
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                Congratulations!
              </h2>
              <p className="text-lg text-slate-200 text-center mb-4">
                You just wrote your first ever contract. Welcome to the world of
                ink! smart contracts!
              </p>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg text-white font-semibold shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
