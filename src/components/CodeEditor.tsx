'use client';

import { useRef, useEffect, useState } from 'react';

import React, { CSSProperties } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Suggestion {
  text: string;
  description: string;
  insertText: string;
  type: 'macro' | 'keyword' | 'function' | 'type';
}

// Custom autocomplete disabled - using native Rust language server instead
const SUGGESTIONS: Suggestion[] = [];

// Function to highlight comments and basic syntax
const highlightCode = (code: string, language: string) => {
  if (language === 'rust') {
    return code.split('\n').map((line, lineIndex) => {
      // Handle single-line comments
      if (line.includes('//')) {
        const parts = line.split('//');
        const codePart = parts[0];
        const commentPart = parts.slice(1).join('//');

        return (
          <div
            key={lineIndex}
            style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}
          >
            <span className="text-slate-100">{codePart}</span>
            <span className="text-emerald-400/80">
              {commentPart ? `//${commentPart}` : ''}
            </span>
          </div>
        );
      }

      // Handle multi-line comments (basic)
      if (line.includes('/*') || line.includes('*/')) {
        return (
          <div
            key={lineIndex}
            className="text-emerald-400/80"
            style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}
          >
            {line || '\u00A0'}
          </div>
        );
      }

      return (
        <div
          key={lineIndex}
          className="text-slate-100"
          style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  }

  // Default highlighting for other languages
  return code.split('\n').map((line, lineIndex) => (
    <div
      key={lineIndex}
      className="text-slate-100"
      style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}
    >
      {line || '\u00A0'}
    </div>
  ));
};

export default function CodeEditor({
  value,
  onChange,
  language = 'rust',
  readOnly = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });
  const [currentTrigger, setCurrentTrigger] = useState({ start: 0, text: '' });

  useEffect(() => {
    // Remove auto-resize behavior to allow scrolling
    // The textarea should have a fixed height and scroll when content exceeds it
  }, [value]);

  // Get cursor position in pixels for suggestion dropdown
  const getCursorPosition = (
    textarea: HTMLTextAreaElement,
    caretPos: number
  ) => {
    const textBeforeCaret = textarea.value.substring(0, caretPos);
    const lines = textBeforeCaret.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[lines.length - 1].length;

    // Calculate position (approximate)
    const lineHeight = 24;
    const charWidth = 8.4; // Approximate character width for monospace

    const top = currentLine * lineHeight + 32; // Add padding
    const left = currentColumn * charWidth + 64; // Add line numbers width + padding

    return { top, left };
  };

  // Check for autocomplete triggers - DISABLED (using native Rust autocomplete)
  const checkAutocomplete = (text: string, caretPos: number) => {
    // Custom autocomplete disabled - let native Rust language server handle this
    setShowSuggestions(false);
  };

  // Accept suggestion
  const acceptSuggestion = (suggestion: Suggestion) => {
    const newValue =
      value.substring(0, currentTrigger.start) +
      suggestion.insertText +
      value.substring(currentTrigger.start + currentTrigger.text.length);

    onChange(newValue);
    setShowSuggestions(false);

    // Focus back to textarea and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCaretPos = currentTrigger.start + suggestion.insertText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCaretPos, newCaretPos);
      }
    }, 0);
  };

  // Sync scroll position between textarea and overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const caretPos = e.target.selectionStart;

    onChange(newValue);

    // Check for autocomplete triggers
    checkAutocomplete(newValue, caretPos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestion navigation
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        acceptSuggestion(suggestions[selectedSuggestion]);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue =
        value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions]);

  const lineNumbers = value.split('\n').map((_, index) => index + 1);
  const highlightedCode = highlightCode(value, language);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'macro':
        return '🏷️';
      case 'keyword':
        return '🔤';
      case 'function':
        return '⚡';
      case 'type':
        return '📐';
      default:
        return '💡';
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-sm relative">
      {/* Line numbers */}
      <div className="flex-shrink-0 w-16 bg-gradient-to-b from-slate-800/80 to-slate-700/80 border-r border-slate-600/50 text-slate-400 text-sm font-mono select-none overflow-hidden backdrop-blur-sm relative">
        <div
          className="py-4 px-3"
          style={{ transform: `translateY(-${scrollTop}px)` }}
        >
          {lineNumbers.map((lineNum, index) => (
            <div
              key={index}
              style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}
              className="text-right hover:text-purple-400 transition-colors duration-200"
            >
              {lineNum}
            </div>
          ))}
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 relative">
        {/* Syntax highlighted overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 p-4 pointer-events-none font-mono overflow-hidden"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '24px',
            fontSize: '14px',
            tabSize: 4,
          }}
        >
          {highlightedCode}
        </div>

        {/* Textarea for input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          className="w-full h-full p-4 bg-transparent text-transparent font-mono resize-none border-none outline-none caret-white selection:bg-purple-500/30 placeholder:text-transparent relative z-10 overflow-auto"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '24px',
            fontSize: '14px',
            tabSize: 4,
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={
            readOnly ? '' : '// Start typing your ink! contract here...'
          }
        />

        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-purple-500/5" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900/20" />

        {/* Subtle border glow */}
        <div className="absolute inset-0 pointer-events-none rounded-xl border border-purple-500/20 shadow-inner" />
      </div>

      {/* Autocomplete suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 bg-slate-800/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-2xl max-w-md"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-3 py-2 cursor-pointer text-sm border-b border-slate-700/50 last:border-b-0 transition-all duration-150 ${
                index === selectedSuggestion
                  ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              onClick={() => acceptSuggestion(suggestion)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <div className="flex-1">
                  <div
                    className={`font-mono font-medium ${
                      index === selectedSuggestion
                        ? 'text-purple-200'
                        : 'text-slate-200'
                    }`}
                  >
                    {suggestion.text}
                  </div>
                  <div
                    className={`text-xs ${
                      index === selectedSuggestion
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {suggestion.description}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Help text */}
          <div className="px-3 py-2 text-xs text-slate-500 bg-slate-900/50 border-t border-slate-700/50">
            <span className="flex items-center space-x-2">
              <span>↑↓ navigate</span>
              <span>•</span>
              <span>Enter select</span>
              <span>•</span>
              <span>Esc cancel</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
