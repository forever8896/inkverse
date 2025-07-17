"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lesson, validateCode } from "@/lib/lessons";
import CodeEditor from "@/components/CodeEditor";

interface LessonLayoutProps {
  lesson: Lesson;
}

export default function LessonLayout({ lesson }: LessonLayoutProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentStepData = lesson.steps[currentStep];

  useEffect(() => {
    // Initialize code editor with step's initial code
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
  }, [currentStep, currentStepData]);

  const validateUserCode = () => {
    if (currentStepData?.validation) {
      const isValid = validateCode(userCode, currentStepData.validation);
      setIsValidated(isValid);
      return isValid;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < lesson.steps.length - 1) {
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/lessons" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">I</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Inkverse
              </span>
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

      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Panel */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="max-w-2xl">
            {/* Lesson Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span className={`px-2 py-1 rounded ${
                  lesson.difficulty === "Beginner" ? "bg-green-600/20 text-green-400" :
                  lesson.difficulty === "Intermediate" ? "bg-yellow-600/20 text-yellow-400" :
                  lesson.difficulty === "Advanced" ? "bg-orange-600/20 text-orange-400" :
                  "bg-red-600/20 text-red-400"
                }`}>
                  {lesson.difficulty}
                </span>
                <span>⏱️ {lesson.duration}</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">
                {currentStepData.title}
              </h2>
              <div 
                className="prose prose-invert prose-purple max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: currentStepData.content.replace(/\n/g, '<br>').replace(/##/g, '<h3>').replace(/#/g, '<h2>') 
                }}
              />
            </div>

            {/* Hint */}
            {currentStepData.hint && (
              <div className="mb-6">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>💡</span>
                  <span>{showHint ? "Hide Hint" : "Show Hint"}</span>
                </button>
                {showHint && (
                  <div className="mt-2 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                    <p className="text-amber-200">{currentStepData.hint}</p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Status */}
            {currentStepData.validation && (
              <div className="mb-6">
                {isValidated ? (
                  <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>Great job! Your code is correct.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span>⏳</span>
                      <span>Complete the code to continue.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                ← Previous
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: lesson.steps.length }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i === currentStep
                        ? "bg-purple-400"
                        : i < currentStep
                        ? "bg-green-400"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={
                  currentStep === lesson.steps.length - 1 ||
                  (currentStepData.validation && !isValidated)
                }
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {currentStep === lesson.steps.length - 1 ? "Complete" : "Next →"}
              </button>
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="w-1/2 border-l border-slate-700">
          {currentStepData.code !== undefined && (
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="border-b border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Code Editor</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetCode}
                      className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    >
                      Reset
                    </button>
                    {currentStepData.validation && (
                      <button
                        onClick={validateUserCode}
                        className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                      >
                        Check Code
                      </button>
                    )}
                    {currentStepData.expectedCode && (
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

              {/* Editor */}
              <div className="flex-1">
                <CodeEditor
                  value={userCode}
                  onChange={setUserCode}
                  language="rust"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 