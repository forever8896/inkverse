"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Editor, { Monaco, loader } from "@monaco-editor/react";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface InkSuggestion {
  text: string;
  description: string;
  insertText: string;
  type: "macro" | "keyword" | "function" | "type";
}

// Configure Monaco loader for better performance
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

// Custom ink! suggestions disabled - using native Rust language server instead
const INK_SUGGESTIONS: InkSuggestion[] = [];

// Memoized completion items creation
const createCompletionItems = (suggestions: InkSuggestion[], range: any, monaco: Monaco): any[] => {
  return suggestions.map((suggestion, index) => ({
    label: suggestion.text,
    kind: getMonacoKind(suggestion.type),
    documentation: {
      value: suggestion.description,
      isTrusted: true,
    },
    insertText: suggestion.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range: range,
    sortText: `${suggestion.type}_${index.toString().padStart(3, '0')}`,
  }));
};

// Map our types to Monaco completion kinds (using numbers for better performance)
const getMonacoKind = (type: string): number => {
  switch (type) {
    case "macro":
      return 27; // Snippet
    case "keyword":
      return 17; // Keyword
    case "function":
      return 2; // Function
    case "type":
      return 25; // TypeParameter
    default:
      return 18; // Text
  }
};

// Global variables to prevent re-registration
let isThemeDefined = false;
let isCompletionProviderRegistered = false;

export default function MonacoCodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  className,
  style,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Memoize filtered suggestions for better performance
  const memoizedSuggestions = useMemo(() => {
    const macroSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'macro');
    const functionSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'function' || s.type === 'keyword');
    return { macroSuggestions, functionSuggestions, allSuggestions: INK_SUGGESTIONS };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    
    // Delay showing the editor slightly for a smooth transition
    setTimeout(() => {
      setShowEditor(true);
    }, 100);

    // Custom completion provider disabled - using native Rust language server instead
    // This allows Monaco's built-in Rust support to handle autocomplete
    isCompletionProviderRegistered = true;

    // Configure editor for better ink! experience
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      lineHeight: 24,
      minimap: {
        enabled: false, // Disable minimap for cleaner look
      },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      selectionHighlight: false,
      bracketPairColorization: {
        enabled: true,
      },
      suggest: {
        showIcons: true,
        showStatusBar: true,
        preview: true,
        previewMode: 'prefix',
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Custom theme with glass-morphism effect matching the lesson page
  const defineTheme = (monaco: Monaco) => {
    if (!isThemeDefined) {
      monaco.editor.defineTheme('inkverse-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '10b981', fontStyle: 'italic' }, // green comments - visible and nice
          { token: 'keyword', foreground: 'a855f7' }, // purple-500 - matches lesson accent
          { token: 'string', foreground: '06b6d4' }, // cyan-500 - matches lesson accent
          { token: 'number', foreground: 'f59e0b' }, // amber-500
          { token: 'type', foreground: 'ec4899' }, // pink-500
          { token: 'function', foreground: '3b82f6' }, // blue-500
          { token: 'attribute', foreground: 'f97316' }, // orange for ink attributes
        ],
        colors: {
          // Transparent background for glass effect
          'editor.background': '#0f172a00', // completely transparent - let container handle the glass effect
          'editor.foreground': '#f1f5f9',
          
          // Subtle line highlighting
          'editor.lineHighlightBackground': '#1e293b20', // very subtle highlight
          
          // Selection colors using lesson accent colors
          'editor.selectionBackground': '#a855f750',
          'editor.inactiveSelectionBackground': '#a855f730',
          'editor.selectionHighlightBackground': '#a855f730',
          
          // Cursor
          'editorCursor.foreground': '#06b6d4', // cyan-500 - lesson accent
          
          // No gutter background - keep it transparent
          'editorGutter.background': '#00000000', // transparent
          'editorLineNumber.foreground': '#64748b',
          'editorLineNumber.activeForeground': '#a855f7',
          
          // Whitespace
          'editorWhitespace.foreground': '#475569',
          
          // Suggestion widget with glass effect
          'editorSuggestWidget.background': '#1e293b90', // semi-transparent
          'editorSuggestWidget.border': '#475569',
          'editorSuggestWidget.foreground': '#f1f5f9',
          'editorSuggestWidget.selectedBackground': '#a855f750',
          
          // Hover widget with glass effect  
          'editorHoverWidget.background': '#1e293b90', // semi-transparent
          'editorHoverWidget.border': '#475569',
        },
      });
      isThemeDefined = true;
    }
  };

  return (
    <div 
      className={`h-full w-full rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-sm bg-white/5 overflow-hidden relative ${className || ''}`}
      style={style}
    >
      {/* Loading State */}
      <div 
        className={`absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/10 rounded-xl transition-all duration-500 ease-out ${
          showEditor 
            ? 'opacity-0 translate-y-[-20px] pointer-events-none' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🧬</div>
          <div className="text-slate-300">Loading code editor...</div>
        </div>
      </div>

      {/* Editor */}
      <div 
        className={`h-full w-full transition-all duration-500 ease-out ${
          showEditor 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-[20px]'
        }`}
      >
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={defineTheme}
          theme="inkverse-theme"
          options={{
            readOnly,
            automaticLayout: true,
            contextmenu: false,
            // Disable all side panels
            minimap: { enabled: false },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            wordBasedSuggestions: 'off',
            parameterHints: {
              enabled: true,
            },
            hover: {
              enabled: true,
              delay: 300,
            },
            // Performance optimizations
            renderValidationDecorations: 'off',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}