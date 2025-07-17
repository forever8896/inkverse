"use client";

import { useRef, useEffect, useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

// Function to highlight comments and basic syntax
const highlightCode = (code: string, language: string) => {
  if (language === "rust") {
    return code
      .split('\n')
      .map((line, lineIndex) => {
        // Handle single-line comments
        if (line.includes('//')) {
          const parts = line.split('//');
          const codePart = parts[0];
          const commentPart = parts.slice(1).join('//');
          
          return (
            <div key={lineIndex} style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}>
              <span className="text-slate-100">{codePart}</span>
              <span className="text-emerald-400/80">{commentPart ? `//${commentPart}` : ''}</span>
            </div>
          );
        }
        
        // Handle multi-line comments (basic)
        if (line.includes('/*') || line.includes('*/')) {
          return (
            <div key={lineIndex} className="text-emerald-400/80" style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}>
              {line || '\u00A0'}
            </div>
          );
        }
        
        return (
          <div key={lineIndex} className="text-slate-100" style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}>
            {line || '\u00A0'}
          </div>
        );
      });
  }
  
  // Default highlighting for other languages
  return code.split('\n').map((line, lineIndex) => (
    <div key={lineIndex} className="text-slate-100" style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }}>
      {line || '\u00A0'}
    </div>
  ));
};

export default function CodeEditor({ 
  value, 
  onChange, 
  language = "rust", 
  readOnly = false 
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize textarea based on content
      const minHeight = 400;
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(minHeight, textareaRef.current.scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Sync overlay height
      if (overlayRef.current) {
        overlayRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [value]);

  // Sync scroll position between textarea and overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const lineNumbers = value.split('\n').map((_, index) => index + 1);
  const highlightedCode = highlightCode(value, language);

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-600/50 shadow-2xl backdrop-blur-sm">
      {/* Line numbers */}
      <div 
        className="flex-shrink-0 w-16 bg-gradient-to-b from-slate-800/80 to-slate-700/80 border-r border-slate-600/50 text-slate-400 text-sm font-mono select-none py-4 px-3 overflow-hidden backdrop-blur-sm"
        style={{ transform: `translateY(-${scrollTop}px)` }}
      >
        {lineNumbers.map((lineNum, index) => (
          <div key={index} style={{ lineHeight: '24px', height: '24px', fontSize: '14px' }} className="text-right hover:text-purple-400 transition-colors duration-200">
            {lineNum}
          </div>
        ))}
      </div>

      {/* Code area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax highlighted overlay */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 p-4 pointer-events-none font-mono overflow-hidden"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '24px',
            fontSize: '14px',
            tabSize: 4,
            minHeight: '400px',
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
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '24px',
            fontSize: '14px',
            tabSize: 4,
            minHeight: '400px',
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={readOnly ? "" : "// Start typing your ink! contract here..."}
        />
        
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-purple-500/5" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-900/20" />
        
        {/* Subtle border glow */}
        <div className="absolute inset-0 pointer-events-none rounded-xl border border-purple-500/20 shadow-inner" />
      </div>
    </div>
  );
} 