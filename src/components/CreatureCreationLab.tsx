"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Chapter, validateCode } from "@/lib/chapters";
import CodeEditor from "@/components/CodeEditor";

interface CreatureCreationLabProps {
  chapter: Chapter;
}

export default function CreatureCreationLab({ chapter }: CreatureCreationLabProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAssistant, setShowAssistant] = useState(true);
  const [earnedRewards, setEarnedRewards] = useState<string[]>([]);

  const currentStepData = chapter.steps[currentStep];

  useEffect(() => {
    // Initialize code editor with step's initial code
    if (currentStepData?.code) {
      setUserCode(currentStepData.code);
    }
    setIsValidated(false);
    setShowHint(false);
    setShowAssistant(true);
  }, [currentStep, currentStepData]);

  const validateUserCode = () => {
    if (currentStepData?.validation) {
      const isValid = validateCode(userCode, currentStepData.validation);
      setIsValidated(isValid);
      
      // Add step rewards when validation passes
      if (isValid && currentStepData.rewards) {
        setEarnedRewards(prev => [...prev, ...currentStepData.rewards!]);
      }
      
      return isValid;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < chapter.steps.length - 1) {
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
      if (currentStepData.rewards) {
        setEarnedRewards(prev => [...prev, ...currentStepData.rewards!]);
      }
    }
  };

  const progressPercentage = ((currentStep + 1) / chapter.steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Lab Header */}
      <nav className="border-b border-slate-800 px-6 py-4 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/lab" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <span className="text-slate-900 font-bold text-2xl">🧬</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Bio-Lab
                </span>
                <div className="text-xs text-slate-400">Chapter {chapter.id}</div>
              </div>
            </Link>
            <span className="text-slate-400">•</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{chapter.creature}</span>
              <span className="text-slate-300 font-semibold">{chapter.title}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm text-slate-400">Step Progress</div>
              <div className="text-lg font-bold text-purple-400">
                {currentStep + 1}/{chapter.steps.length}
              </div>
            </div>
            <div className="w-32 bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Rewards</div>
              <div className="text-lg font-bold text-cyan-400">
                {earnedRewards.length}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Panel */}
        <div className="w-1/2 overflow-y-auto">
          {/* Assistant Chat */}
          {showAssistant && currentStepData.assistantDialogue && (
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-slate-800/50 rounded-lg p-4 relative">
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-slate-800/50 rotate-45"></div>
                    <p className="text-slate-200 leading-relaxed">
                      {currentStepData.assistantDialogue}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssistant(false)}
                    className="text-xs text-slate-500 hover:text-slate-400 mt-2"
                  >
                    Dismiss assistant
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="max-w-2xl">
              {/* Step Content */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">
                  {currentStepData.title}
                </h2>
                <div 
                  className="prose prose-invert prose-purple max-w-none text-slate-300"
                  dangerouslySetInnerHTML={{ 
                    __html: currentStepData.content
                      .replace(/\n/g, '<br>')
                      .replace(/### /g, '<h4 class="text-lg font-semibold text-cyan-400 mt-4 mb-2">')
                      .replace(/## /g, '<h3 class="text-xl font-semibold text-purple-400 mt-6 mb-3">')
                      .replace(/# /g, '<h2 class="text-2xl font-bold text-purple-400 mt-8 mb-4">')
                      .replace(/💡 \*\*Bio-Engineer Tip:\*\*/g, '<div class="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 my-4"><strong class="text-amber-400">💡 Bio-Engineer Tip:</strong>')
                      .replace(/💡 \*\*Bio-Engineer Tip:\*\*(.*?)$/gm, '<div class="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 my-4"><strong class="text-amber-400">💡 Bio-Engineer Tip:</strong>$1</div>')
                  }}
                />
              </div>

              {/* Hint System */}
              {currentStepData.hint && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors p-2 rounded-lg hover:bg-amber-900/20"
                  >
                    <span>💡</span>
                    <span>{showHint ? "Hide Lab Assistant Hint" : "Ask Lab Assistant for Help"}</span>
                  </button>
                  {showHint && (
                    <div className="mt-3 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <p className="text-amber-200 font-semibold text-sm mb-1">Lab Assistant says:</p>
                          <p className="text-amber-200">{currentStepData.hint}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation & Rewards */}
              {currentStepData.validation && (
                <div className="mb-6">
                  {isValidated ? (
                    <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-400 mb-2">
                        <span>🎉</span>
                        <span className="font-semibold">Excellent bio-engineering work!</span>
                      </div>
                      {currentStepData.rewards && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {currentStepData.rewards.map((reward, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-800/30 border border-green-600/30 rounded text-xs text-green-300">
                              {reward}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span>⏳</span>
                        <span>Complete the creature DNA to continue...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>

                <div className="flex space-x-2">
                  {Array.from({ length: chapter.steps.length }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`w-4 h-4 rounded-full transition-colors ${
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
                    currentStep === chapter.steps.length - 1 ||
                    (currentStepData.validation && !isValidated)
                  }
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <span>{currentStep === chapter.steps.length - 1 ? "Complete Chapter" : "Next"}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Code Lab Panel */}
        <div className="w-1/2 border-l border-slate-700 bg-slate-900">
          {currentStepData.code !== undefined ? (
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="border-b border-slate-700 p-4 bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🧪</span>
                    <h3 className="text-lg font-semibold">Creature DNA Editor</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetCode}
                      className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors flex items-center space-x-1"
                    >
                      <span>🔄</span>
                      <span>Reset</span>
                    </button>
                    {currentStepData.validation && (
                      <button
                        onClick={validateUserCode}
                        className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors flex items-center space-x-1"
                      >
                        <span>🔬</span>
                        <span>Test DNA</span>
                      </button>
                    )}
                    {currentStepData.expectedCode && (
                      <button
                        onClick={showSolution}
                        className="px-3 py-2 text-sm bg-amber-600 hover:bg-amber-700 rounded transition-colors flex items-center space-x-1"
                      >
                        <span>💡</span>
                        <span>Show Solution</span>
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
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">{chapter.creature}</div>
                <h3 className="text-xl font-semibold text-purple-400 mb-2">No coding needed!</h3>
                <p className="text-slate-400">Just read and continue to the next step.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 