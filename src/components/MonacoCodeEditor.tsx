"use client";

import React, { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { CompilationError } from "@/hooks/useCodeCompilation";

export interface EditorMarker {
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  errors?: CompilationError[];
}

export interface MonacoCodeEditorRef {
  revealLine: (line: number) => void;
  setPosition: (line: number, column: number) => void;
}

interface InkSuggestion {
  text: string;
  description: string;
  insertText: string;
  type: "macro" | "keyword" | "function" | "type";
}

// Monaco will auto-bundle when no loader config is specified
// This is the recommended approach for Next.js + Vercel deployments

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

const MonacoCodeEditor = forwardRef<MonacoCodeEditorRef, MonacoCodeEditorProps>(function MonacoCodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  className,
  style,
  errors = [],
}, ref) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Memoize filtered suggestions for better performance
  const memoizedSuggestions = useMemo(() => {
    const macroSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'macro');
    const functionSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'function' || s.type === 'keyword');
    return { macroSuggestions, functionSuggestions, allSuggestions: INK_SUGGESTIONS };
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    revealLine: (line: number) => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
      }
    },
    setPosition: (line: number, column: number) => {
      if (editorRef.current) {
        editorRef.current.setPosition({ lineNumber: line, column });
        editorRef.current.focus();
      }
    }
  }), []);

  // Update error markers and decorations when errors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Clear previous markers
    monaco.editor.setModelMarkers(model, 'compilation', []);

    // Convert compilation errors to Monaco markers
    const markers = errors
      .filter(error => error.location?.line)
      .map(error => ({
        severity: error.level === 'error'
          ? monaco.MarkerSeverity.Error
          : error.level === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
        startLineNumber: error.location!.line,
        startColumn: error.location!.column || 1,
        endLineNumber: error.location!.lineEnd || error.location!.line,
        endColumn: error.location!.columnEnd || model.getLineMaxColumn(error.location!.line),
        message: error.message + (error.suggestion ? `\n\nSuggestion: ${error.suggestion}` : ''),
        source: 'rustc',
        code: error.code || undefined,
      }));

    // Set markers (shows squiggly underlines)
    monaco.editor.setModelMarkers(model, 'compilation', markers);

    // Create decorations for error lines (gutter icon + line highlight)
    const decorations = errors
      .filter(error => error.location?.line)
      .map(error => ({
        range: new monaco.Range(
          error.location!.line,
          1,
          error.location!.line,
          1
        ),
        options: {
          isWholeLine: true,
          className: error.level === 'error' ? 'error-line-decoration' : 'warning-line-decoration',
          glyphMarginClassName: error.level === 'error' ? 'error-glyph' : 'warning-glyph',
          overviewRuler: {
            color: error.level === 'error' ? '#ef4444' : '#f59e0b',
            position: monaco.editor.OverviewRulerLane.Right
          }
        }
      }));

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);

    // Reveal first error line
    if (errors.length > 0 && errors[0].location?.line) {
      editor.revealLineInCenter(errors[0].location.line);
    }
  }, [errors]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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
      glyphMargin: true, // Enable for error/warning icons
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
          // Remove focus border
          'focusBorder': '#00000000',

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

          // Error/Warning colors
          'editorError.foreground': '#ef4444',
          'editorWarning.foreground': '#f59e0b',
          'editorInfo.foreground': '#3b82f6',
          'editorGutter.addedBackground': '#22c55e',
          'editorGutter.modifiedBackground': '#3b82f6',
          'editorGutter.deletedBackground': '#ef4444',
          
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
      {/* Editor with built-in loading state */}
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        beforeMount={defineTheme}
        theme="inkverse-theme"
        loading={
          <div className="h-full w-full flex items-center justify-center backdrop-blur-md bg-white/10 rounded-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🧬</div>
              <div className="text-slate-300">Loading code editor...</div>
            </div>
          </div>
        }
        options={{
            readOnly,
            automaticLayout: true,
            contextmenu: false,
            // Disable minimap but keep overview ruler for error markers
            minimap: { enabled: false },
            overviewRulerBorder: false,
            overviewRulerLanes: 1, // Show error markers in overview ruler
            hideCursorInOverviewRuler: true,
            glyphMargin: true, // Show error icons in gutter
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
            // Show error/warning squiggly underlines
            renderValidationDecorations: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
    </div>
  );
});

export default MonacoCodeEditor;