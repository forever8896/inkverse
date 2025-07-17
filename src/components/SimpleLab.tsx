"use client";

import { useState } from "react";
import Link from "next/link";
import { SimpleChapter } from "@/lib/simplified-chapters";
import InteractiveCodeBuilder from "./InteractiveCodeBuilder";

interface SimpleLabProps {
  chapter: SimpleChapter;
}

export default function SimpleLab({ chapter }: SimpleLabProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  
  const currentStepData = chapter.steps[currentStep];
  const isStepCompleted = completedSteps.includes(currentStep);

  const handleCodeComplete = (code: string) => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const nextStep = () => {
    if (currentStep < chapter.steps.length - 1 && isStepCompleted) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startChapter = () => {
    setShowIntro(false);
  };

  const progressPercentage = ((completedSteps.length) / chapter.steps.length) * 100;

  // Show chapter introduction first
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/lab" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-2xl">🧬</span>
                </div>
                <div>
                  <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Bio-Lab
                  </div>
                  <div className="text-xs text-slate-400">Chapter {chapter.id}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Chapter Introduction */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <div className="text-8xl mb-6 animate-bounce">{chapter.creature}</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Chapter {chapter.id}: {chapter.title}
            </h1>
            <p className="text-xl text-slate-300 mb-8">{chapter.tagline}</p>
          </div>

          {/* Story Introduction */}
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-2xl p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-3xl flex-shrink-0 animate-pulse">
                🤖
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Your Mission:</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  {chapter.story}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <span className="text-slate-300">{chapter.steps.length} challenges await</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧩</span>
                    <span className="text-slate-300">Solve problems with code</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚡</span>
                    <span className="text-slate-300">Click to build solutions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏆</span>
                    <span className="text-slate-300">Save your creature!</span>
                  </div>
                </div>
                <button
                  onClick={startChapter}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl py-4 px-6 text-lg font-semibold transition-all duration-200 transform hover:scale-105 animate-pulse"
                >
                  🚀 Accept Mission & Start Adventure!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link href="/lab" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-xl flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-2xl">🧬</span>
                </div>
                <div>
                  <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Bio-Lab
                  </div>
                  <div className="text-xs text-slate-400 hidden sm:block">Chapter {chapter.id}: {chapter.title}</div>
                </div>
              </Link>
            </div>
            
            {/* Right side */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="text-right">
                <div className="text-sm text-slate-400">Progress</div>
                <div className="text-lg font-bold text-purple-400">
                  {completedSteps.length}/{chapter.steps.length}
                </div>
              </div>
              <div className="w-24 sm:w-32 bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Problem & Solution */}
          <div className="space-y-6 order-2 xl:order-1">
            {/* Challenge Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 sm:p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-400/30 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  {currentStepData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{currentStepData.title}</h2>
                  <p className="text-slate-400 text-sm">Challenge {currentStep + 1} of {chapter.steps.length}</p>
                </div>
                {isStepCompleted && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* The Problem */}
            <div className="bg-red-900/20 border border-red-600/30 rounded-2xl p-4 sm:p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  🚨
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-red-400">Problem Alert!</h3>
                  <p className="text-red-200 text-sm sm:text-base leading-relaxed">
                    {currentStepData.problem}
                  </p>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="bg-green-900/20 border border-green-600/30 rounded-2xl p-4 sm:p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                  💡
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-green-400">Solution Strategy</h3>
                  <p className="text-green-200 text-sm sm:text-base leading-relaxed mb-4">
                    {currentStepData.solution}
                  </p>
                  
                  {/* Goal */}
                  <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-semibold text-sm flex-shrink-0">🎯 Mission:</span>
                      <span className="text-cyan-200 text-sm">{currentStepData.goal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {isStepCompleted && (
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-600/30 rounded-lg p-4 animate-bounce">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl animate-spin">🎉</span>
                  <span className="text-green-400 font-bold text-sm sm:text-base break-words">
                    {currentStepData.successMessage}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="w-full sm:w-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              {/* Step indicators */}
              <div className="flex space-x-2">
                {chapter.steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-4 h-4 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-purple-400 animate-pulse"
                        : completedSteps.includes(index)
                        ? "bg-green-400"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={!isStepCompleted || currentStep === chapter.steps.length - 1}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>{currentStep === chapter.steps.length - 1 ? "Complete!" : "Next Challenge"}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Right Panel - Interactive Code Builder */}
          <div className="order-1 xl:order-2">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">🧪</span>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Solution Builder</h3>
                <span className="text-sm text-slate-400">Click the pieces!</span>
              </div>

              <InteractiveCodeBuilder
                targetCode={currentStepData.targetCode}
                onCodeComplete={handleCodeComplete}
                suggestions={currentStepData.suggestions}
                placeholder="// Click the solution pieces below to fix the problem!"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 