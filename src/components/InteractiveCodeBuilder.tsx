"use client";

import { useState, useRef, useEffect } from "react";

interface CodeSuggestion {
  text: string;
  description: string;
  category: "structure" | "storage" | "constructor" | "message" | "event" | "error";
  icon: string;
}

interface InteractiveCodeBuilderProps {
  targetCode: string;
  onCodeComplete: (code: string) => void;
  suggestions: CodeSuggestion[];
  placeholder: string;
}

export default function InteractiveCodeBuilder({ 
  targetCode, 
  onCodeComplete, 
  suggestions,
  placeholder 
}: InteractiveCodeBuilderProps) {
  const [currentCode, setCurrentCode] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check if code is complete
    const cleanCurrent = currentCode.replace(/\s+/g, ' ').trim();
    const cleanTarget = targetCode.replace(/\s+/g, ' ').trim();
    
    if (cleanCurrent === cleanTarget) {
      onCodeComplete(currentCode);
    }
  }, [currentCode, targetCode, onCodeComplete]);

  const insertSuggestion = (suggestion: CodeSuggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Add the suggestion to the code
    const newCode = currentCode + (currentCode ? '\n' : '') + suggestion.text;
    setCurrentCode(newCode);
    
    // Mark this suggestion as used
    setUsedSuggestions(prev => new Set([...prev, suggestion.text]));
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const resetCode = () => {
    setCurrentCode("");
    setUsedSuggestions(new Set());
    setShowSuggestions(true);
  };

  const availableSuggestions = suggestions.filter(s => 
    !usedSuggestions.has(s.text)
  );

  const progressPercentage = Math.min(100, (usedSuggestions.size / suggestions.length) * 100);

  return (
    <div className="space-y-4">
      {/* Code Editor */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">●</span>
              <span className="text-yellow-400">●</span>
              <span className="text-red-400">●</span>
              <span className="text-slate-400 text-sm ml-2">creature_dna.rs</span>
            </div>
            <button
              onClick={resetCode}
              className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-700"
            >
              🔄 Reset
            </button>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            placeholder={placeholder}
            className="w-full h-80 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none overflow-auto"
            style={{
              fontFamily: 'var(--font-mono), Consolas, Monaco, "Courier New", monospace',
              lineHeight: '1.5',
              tabSize: 4,
            }}
            spellCheck={false}
            readOnly
          />
          
          {/* Progress indicator */}
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center space-x-2 bg-slate-800/90 rounded-lg px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-xs text-slate-300">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Code Pieces */}
      {showSuggestions && availableSuggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center">
            <span className="mr-2">🧩</span>
            Click to add these code pieces:
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => insertSuggestion(suggestion)}
                className="w-full group cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-400/50 rounded-lg p-3 transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl flex-shrink-0">{suggestion.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-slate-100 mb-1 break-all">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-slate-400 break-words">
                      {suggestion.description}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                      Add
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {availableSuggestions.length === 0 && usedSuggestions.size > 0 && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <span className="text-green-400 font-semibold">
              Perfect! Your creature's DNA is complete!
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
} 