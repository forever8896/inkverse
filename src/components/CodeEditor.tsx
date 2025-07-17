"use client";

import { useRef, useEffect } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = "rust", 
  readOnly = false 
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize textarea based on content
      const minHeight = 400;
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(minHeight, textareaRef.current.scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

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

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-slate-600 shadow-2xl">
      {/* Line numbers */}
      <div className="flex-shrink-0 w-14 bg-gradient-to-b from-slate-800 to-slate-700 border-r border-slate-600 text-slate-400 text-sm font-mono select-none py-4 px-3 overflow-hidden">
        {lineNumbers.map((lineNum, index) => (
          <div key={index} className="leading-6 text-right h-6 hover:text-purple-400 transition-colors">
            {lineNum}
          </div>
        ))}
      </div>

      {/* Code textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-sm leading-6 resize-none border-none outline-none caret-white selection:bg-purple-500/30 placeholder:text-slate-500"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '1.5',
            tabSize: 4,
            minHeight: '400px',
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={readOnly ? "" : "// Start typing your ink! contract here..."}
        />
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-purple-500/5" />
      </div>
    </div>
  );
} 