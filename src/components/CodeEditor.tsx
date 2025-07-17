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
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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

  return (
    <div className="h-full code-editor">
      <div className="h-full relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 w-12 h-full bg-slate-800 border-r border-slate-600 flex flex-col text-slate-500 text-sm font-mono leading-6 p-2">
          {value.split('\n').map((_, index) => (
            <span key={index} className="block">
              {index + 1}
            </span>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          className="w-full h-full pl-16 pr-4 py-2 bg-transparent text-slate-100 font-mono text-sm leading-6 resize-none focus:outline-none focus:ring-0 border-0"
          style={{
            minHeight: '100%',
            fontFamily: 'var(--font-mono), Consolas, Monaco, "Courier New", monospace',
            lineHeight: '1.5',
            tabSize: 4,
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={readOnly ? "" : "// Start typing your ink! contract here..."}
        />

        {/* Syntax highlighting overlay (simplified) */}
        <div className="absolute inset-0 pl-16 pr-4 py-2 pointer-events-none font-mono text-sm leading-6 text-transparent">
          <pre className="whitespace-pre-wrap break-words">
            <code
              dangerouslySetInnerHTML={{
                __html: highlightRustCode(value)
              }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}

// Simple Rust syntax highlighting
function highlightRustCode(code: string): string {
  if (!code) return '';

  return code
    // Keywords
    .replace(/\b(fn|pub|struct|impl|mod|use|let|mut|self|Self|const|static|if|else|match|for|while|loop|break|continue|return|true|false)\b/g, 
      '<span style="color: #8b5cf6;">$1</span>')
    // Attributes
    .replace(/#\[([^\]]+)\]/g, '<span style="color: #06b6d4;">#[$1]</span>')
    // Strings
    .replace(/"([^"\\]|\\.)*"/g, '<span style="color: #10b981;">"$1"</span>')
    // Comments
    .replace(/(\/\/.*$)/gm, '<span style="color: #64748b;">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span style="color: #f59e0b;">$&</span>')
    // Types
    .replace(/\b(bool|u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|f32|f64|usize|isize|String|str|Vec|Option|Result)\b/g, 
      '<span style="color: #ef4444;">$1</span>');
} 